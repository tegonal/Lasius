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
import org.joda.time.DateTime
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{IssueImporterConfigRepository, UserRepository}

import scala.concurrent.{ExecutionContextExecutor, Future}

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

  case class UpdateConnectivityStatus(
      configId: IssueImporterConfigId,
      organisationId: OrganisationId,
      status: ConnectivityStatus,
      issue: Option[ConnectivityIssue]
  )

  case class UpdateProjectSyncStats(
      configId: IssueImporterConfigId,
      organisationId: OrganisationId,
      projectId: ProjectId,
      projectName: String,
      issueCount: Int,
      success: Boolean,
      error: Option[ConnectivityIssue] = None
  )
}

class IssueImporterStatusMonitor(
    repository: IssueImporterConfigRepository,
    userRepository: UserRepository,
    clientReceiver: ClientReceiver,
    systemServices: SystemServices,
    override val reactiveMongoApi: ReactiveMongoApi
) extends Actor
    with ActorLogging
    with DBSupport {

  import IssueImporterStatusMonitor._

  override val supportTransaction: Boolean = systemServices.supportTransaction
  implicit val executionContext: ExecutionContextExecutor =
    context.system.dispatcher

  val receive: Receive = {
    case UpdateConnectivityStatus(configId, orgId, status, issue) =>
      updateConnectivity(configId, orgId, status, issue)

    case UpdateProjectSyncStats(configId,
                                orgId,
                                projectId,
                                projectName,
                                issueCount,
                                success,
                                error) =>
      updateProjectStats(configId,
                         orgId,
                         projectId,
                         projectName,
                         issueCount,
                         success,
                         error)
  }

  private def updateConnectivity(
      configId: IssueImporterConfigId,
      orgId: OrganisationId,
      status: ConnectivityStatus,
      issue: Option[ConnectivityIssue]
  ): Unit = {
    withDBSession() { implicit dbSession =>
      repository.findById(configId).flatMap {
        case Some(config) =>
          val updatedStatus = config.syncStatus.copy(
            connectivityStatus = status,
            lastConnectivityCheck = Some(DateTime.now),
            currentIssue = issue
          )

          val updated = updateConfigWithStats(config, updatedStatus)

          repository.upsert(updated).map { _ =>
            log.debug(
              s"Updated connectivity status for config $configId: $status")
            broadcastStatusChange(config, updatedStatus, orgId)
          }

        case None =>
          log.warning(s"Config not found: $configId")
          Future.successful(())
      }
    }
    ()
  }

  private def updateProjectStats(
      configId: IssueImporterConfigId,
      orgId: OrganisationId,
      projectId: ProjectId,
      projectName: String,
      issueCount: Int,
      success: Boolean,
      error: Option[ConnectivityIssue]
  ): Unit = {
    withDBSession() { implicit dbSession =>
      repository.findById(configId).flatMap {
        case Some(config) =>
          val updatedStats = calculateUpdatedStats(
            config.syncStatus,
            projectId,
            projectName,
            issueCount,
            success,
            error
          )

          val updated = updateConfigWithStats(config, updatedStats)

          repository.upsert(updated).map { _ =>
            log.debug(
              s"Updated sync stats for config $configId, project $projectId: ${if (success) "success"
                else "failure"}, $issueCount issues")
            broadcastStatusChange(config, updatedStats, orgId)
          }

        case None =>
          log.warning(s"Config not found: $configId")
          Future.successful(())
      }
    }
    ()
  }

  private def calculateUpdatedStats(
      currentStats: ConfigSyncStatus,
      projectId: ProjectId,
      projectName: String,
      issueCount: Int,
      success: Boolean,
      error: Option[ConnectivityIssue]
  ): ConfigSyncStatus = {

    val circuitBreakerConfig =
      systemServices.lasiusConfig.issueImporters.circuitBreaker

    val existingProjectStats =
      currentStats.projectStats.find(_.projectId == projectId)

    val updatedProjectStats = existingProjectStats match {
      case Some(existing) =>
        if (success) {
          existing.copy(
            projectName = projectName,
            lastSyncAt = Some(DateTime.now),
            lastSyncIssueCount = issueCount,
            totalIssuesSynced = existing.totalIssuesSynced + issueCount,
            consecutiveFailures = 0,
            lastError = None
          )
        } else {
          existing.copy(
            consecutiveFailures = existing.consecutiveFailures + 1,
            lastError = error
          )
        }

      case None =>
        ProjectSyncStats(
          projectId = projectId,
          projectName = projectName,
          lastSyncAt = if (success) Some(DateTime.now) else None,
          lastSyncIssueCount = issueCount,
          totalIssuesSynced = if (success) issueCount else 0,
          consecutiveFailures = if (success) 0 else 1,
          lastError = if (success) None else error
        )
    }

    val allProjectStats = currentStats.projectStats
      .filterNot(_.projectId == projectId) :+ updatedProjectStats

    val totalIssues        = allProjectStats.map(_.totalIssuesSynced.toLong).sum
    val lastSuccessfulSync = allProjectStats
      .flatMap(_.lastSyncAt)
      .maxByOption(_.getMillis)

    // Determine connectivity status based on circuit breaker
    val maxConsecutiveFailures =
      allProjectStats.map(_.consecutiveFailures).maxOption.getOrElse(0)
    val connectivityStatus = if (success) {
      ConnectivityStatus.Healthy
    } else if (circuitBreakerConfig.isCircuitOpen(maxConsecutiveFailures)) {
      log.warning(
        s"Circuit breaker opened for config with max consecutive failures: $maxConsecutiveFailures")
      ConnectivityStatus.Failed
    } else if (maxConsecutiveFailures > 0) {
      ConnectivityStatus.Degraded
    } else {
      currentStats.connectivityStatus
    }

    // Calculate next scheduled sync with backoff if circuit is degraded/failed
    val backoffMillis =
      circuitBreakerConfig.calculateBackoffMillis(maxConsecutiveFailures)
    val nextScheduledSync = if (backoffMillis > 0) {
      Some(DateTime.now.plusMillis(backoffMillis.toInt))
    } else {
      None
    }

    currentStats.copy(
      projectStats = allProjectStats,
      totalProjectsMapped = allProjectStats.size,
      totalIssuesSynced = totalIssues,
      lastSuccessfulSync = lastSuccessfulSync,
      connectivityStatus = connectivityStatus,
      nextScheduledSync = nextScheduledSync
    )
  }

  private def updateConfigWithStats(
      config: IssueImporterConfig,
      stats: ConfigSyncStatus
  ): IssueImporterConfig = config match {
    case c: GitlabConfig => c.copy(syncStatus = stats)
    case c: JiraConfig   => c.copy(syncStatus = stats)
    case c: PlaneConfig  => c.copy(syncStatus = stats)
    case c: GithubConfig => c.copy(syncStatus = stats)
  }

  private def broadcastStatusChange(
      config: IssueImporterConfig,
      syncStatus: ConfigSyncStatus,
      orgId: OrganisationId
  ): Unit = {
    // Only send notifications for negative outcomes (Failed, Degraded, Unknown)
    // Don't notify for Healthy status
    val shouldNotify = syncStatus.connectivityStatus match {
      case ConnectivityStatus.Failed   => true
      case ConnectivityStatus.Degraded => true
      case ConnectivityStatus.Unknown  => true
      case ConnectivityStatus.Healthy  => false
    }

    if (shouldNotify) {
      withDBSession() { implicit dbSession =>
        userRepository.findAdministratorsByOrganisation(orgId).map { admins =>
          if (admins.nonEmpty) {
            val event = IssueImporterSyncStatsChanged(
              configId = config.id,
              organisationId = orgId,
              importerType = config.importerType,
              configName = config.name,
              syncStatus = syncStatus
            )
            val adminUserIds = admins.map(_.id).toList
            log.warning(
              s"Sending ${syncStatus.connectivityStatus.value} status notification for config ${config.id} to ${adminUserIds.size} organization administrators")
            clientReceiver.send(systemServices.systemUser, event, adminUserIds)
          } else {
            log.warning(
              s"No active administrators found for organisation ${orgId.value}, cannot send ${syncStatus.connectivityStatus.value} notification")
          }
        }
      }
      ()
    } else {
      log.debug(
        s"Skipping notification for healthy status on config ${config.id}")
    }
  }
}
