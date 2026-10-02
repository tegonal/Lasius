/*
 *
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Lasius. If not, see <https://www.gnu.org/licenses/>.
 */

package actors

import core.{DBSupport, SystemServices}
import models._
import org.apache.pekko.actor._
import org.apache.pekko.pattern.pipe
import org.joda.time.DateTime
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{IssueImporterConfigRepository, UserRepository}

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.control.NonFatal

object IssueImporterStatusMonitor {
  def props(repository: IssueImporterConfigRepository,
            userRepository: UserRepository,
            clientReceiver: ClientReceiver,
            systemServices: SystemServices,
            reactiveMongoApi: ReactiveMongoApi): Props =
    Props(
      classOf[IssueImporterStatusMonitor],
      repository,
      userRepository,
      clientReceiver,
      systemServices,
      reactiveMongoApi
    )

  /** The result of one sync of a project mapping. */
  final case class UpdateProjectSyncStats(
      configId: IssueImporterConfigId,
      organisationId: OrganisationId,
      projectId: ProjectId,
      projectName: String,
      issueCount: Int,
      success: Boolean,
      error: Option[ConnectivityIssue] = None
  )

  private case object SyncStatusWritten
}

/** Keeps the sync status of each importer config. The status of a config
  * follows the project with the most failed syncs in a row, and the
  * administrators get a notice when the status changes.
  */
class IssueImporterStatusMonitor(
    repository: IssueImporterConfigRepository,
    userRepository: UserRepository,
    clientReceiver: ClientReceiver,
    systemServices: SystemServices,
    override val reactiveMongoApi: ReactiveMongoApi
) extends Actor
    with Stash
    with ActorLogging
    with DBSupport {

  import IssueImporterStatusMonitor._

  override val supportTransaction: Boolean = systemServices.supportTransaction
  implicit val executionContext: ExecutionContextExecutor =
    context.system.dispatcher

  val receive: Receive = idle

  private def idle: Receive = { case result: UpdateProjectSyncStats =>
    writeSyncStatus(result)
  }

  /** Holds the next result until the current write completes, because each
    * result starts from the status that the previous one wrote.
    */
  private def writing: Receive = {
    case SyncStatusWritten =>
      unstashAll()
      context.become(idle)
    case _ => stash()
  }

  private def writeSyncStatus(result: UpdateProjectSyncStats): Unit = {
    val configId = result.configId
    withDBSession() { implicit dbSession =>
      repository.findById(configId).flatMap {
        case Some(config) =>
          val syncStatus = withProjectResult(config.syncStatus, result)
          repository.updateSyncStatus(configId, syncStatus).flatMap {
            case true
                if syncStatus.connectivityStatus != config.syncStatus.connectivityStatus =>
              notifyAdministrators(config, syncStatus, result.organisationId)
            case _ => Future.unit
          }

        case None =>
          log.warning(s"Config not found: $configId")
          Future.unit
      }
    }.recover { case NonFatal(cause) =>
      log.error(cause, s"Failed to write the sync status of config $configId")
    }.map(_ => SyncStatusWritten)
      .pipeTo(self)
    context.become(writing)
  }

  /** Applies one sync result. A config without failed syncs is Healthy. Below
    * the failure threshold of the circuit breaker it is Degraded, and from the
    * threshold on it is Failed.
    */
  private def withProjectResult(
      current: ConfigSyncStatus,
      result: UpdateProjectSyncStats): ConfigSyncStatus = {
    val circuitBreaker =
      systemServices.lasiusConfig.issueImporters.circuitBreaker
    val now = DateTime.now

    val projectStats =
      current.projectStats.find(_.projectId == result.projectId) match {
        case Some(previous) if result.success =>
          previous.copy(
            projectName = result.projectName,
            lastSyncAt = Some(now),
            lastSyncIssueCount = result.issueCount,
            totalIssuesSynced = result.issueCount,
            consecutiveFailures = 0,
            lastError = None
          )
        case Some(previous) =>
          previous.copy(
            consecutiveFailures = previous.consecutiveFailures + 1,
            lastError = result.error
          )
        case None =>
          ProjectSyncStats(
            projectId = result.projectId,
            projectName = result.projectName,
            lastSyncAt = Option.when(result.success)(now),
            lastSyncIssueCount = result.issueCount,
            totalIssuesSynced = if (result.success) result.issueCount else 0,
            consecutiveFailures = if (result.success) 0 else 1,
            lastError = if (result.success) None else result.error
          )
      }

    val allProjectStats =
      current.projectStats.filterNot(_.projectId == result.projectId) :+
        projectStats
    val maxFailures =
      allProjectStats.map(_.consecutiveFailures).maxOption.getOrElse(0)
    val backoffMillis = circuitBreaker.calculateBackoffMillis(maxFailures)

    current.copy(
      connectivityStatus =
        if (maxFailures == 0) ConnectivityStatus.Healthy
        else if (circuitBreaker.isCircuitOpen(maxFailures))
          ConnectivityStatus.Failed
        else ConnectivityStatus.Degraded,
      lastConnectivityCheck = Some(now),
      currentIssue = allProjectStats
        .filter(_.consecutiveFailures > 0)
        .flatMap(_.lastError)
        .maxByOption(_.timestamp.getMillis),
      projectStats = allProjectStats,
      totalProjectsMapped = allProjectStats.size,
      totalIssuesSynced = allProjectStats.map(_.totalIssuesSynced.toLong).sum,
      lastSuccessfulSync =
        allProjectStats.flatMap(_.lastSyncAt).maxByOption(_.getMillis),
      nextScheduledSync =
        Option.when(backoffMillis > 0)(now.plusMillis(backoffMillis.toInt))
    )
  }

  private def notifyAdministrators(config: IssueImporterConfig,
                                   syncStatus: ConfigSyncStatus,
                                   orgId: OrganisationId): Future[Unit] =
    withDBSession() { implicit dbSession =>
      userRepository.findAdministratorsByOrganisation(orgId).map { admins =>
        if (admins.nonEmpty)
          clientReceiver.send(
            systemServices.systemUser,
            IssueImporterSyncStatsChanged(
              configId = config.id,
              organisationId = orgId,
              importerType = config.importerType,
              configName = config.name,
              syncStatus = syncStatus
            ),
            admins.map(_.id).toList
          )
      }
    }
}
