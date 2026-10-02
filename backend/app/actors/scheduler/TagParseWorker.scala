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

package actors.scheduler

import actors.IssueImporterStatusMonitor.{
  UpdateConnectivityStatus,
  UpdateProjectSyncStats
}
import actors.TagCache.TagsUpdated
import core.SystemServices
import models._
import org.apache.pekko.actor.{Actor, ActorLogging, Timers}
import org.apache.pekko.pattern.pipe

import scala.concurrent.duration.FiniteDuration
import scala.concurrent.{ExecutionContext, Future}
import scala.util.Try
import scala.util.control.NonFatal

object TagParseWorker {

  /** Starts a parse now, for example on a refresh request. */
  case object Parse

  private case object NextParseTimer

  private final case class TagsLoaded[T <: Tag](tags: Set[T])

  private final case class LoadFailed(cause: Throwable)
}

/** Imports the issues of one external project as tags. The worker parses when
  * it starts, also after a restart, and again after `checkFrequency`. A load
  * result comes back as a message, so all state changes happen in `receive`.
  */
abstract class TagParseWorker[T <: Tag: Manifest]
    extends Actor
    with Timers
    with ActorLogging {

  import TagParseWorker._

  protected def systemServices: SystemServices
  protected def configId: IssueImporterConfigId
  protected def organisationId: OrganisationId
  protected def projectId: ProjectId
  protected def externalProjectId: String
  protected def projectName: String
  protected def checkFrequency: FiniteDuration

  /** Loads the tags of the external project. The worker calls it on the actor
    * thread, but the callbacks of the returned future must not touch actor
    * state.
    */
  protected def loadTags(): Future[Set[T]]

  protected implicit val executionContext: ExecutionContext = context.dispatcher

  override def preStart(): Unit = self ! Parse

  override def receive: Receive = idle

  private def idle: Receive = { case Parse =>
    startParse()
  }

  private def parsing: Receive = {
    case Parse =>
      log.debug(s"A parse of $externalProjectId runs already")

    // Only this worker sends TagsLoaded, so the tags are of type T.
    case loaded: TagsLoaded[T @unchecked] =>
      publish(loaded.tags)
      scheduleNextParse()

    case LoadFailed(cause) =>
      reportFailure(cause)
      scheduleNextParse()
  }

  private def startParse(): Unit = {
    Future
      .fromTry(Try(loadTags()))
      .flatten
      .map(TagsLoaded(_))
      .recover { case NonFatal(cause) => LoadFailed(cause) }
      .pipeTo(self)
    context.become(parsing)
  }

  private def scheduleNextParse(): Unit = {
    timers.startSingleTimer(NextParseTimer, Parse, checkFrequency)
    context.become(idle)
  }

  private def publish(tags: Set[T]): Unit = {
    systemServices.tagCache ! TagsUpdated[T](externalProjectId, projectId, tags)
    systemServices.issueImporterStatusMonitor ! UpdateProjectSyncStats(
      configId = configId,
      organisationId = organisationId,
      projectId = projectId,
      projectName = projectName,
      issueCount = tags.size,
      success = true
    )
    systemServices.issueImporterStatusMonitor ! UpdateConnectivityStatus(
      configId = configId,
      organisationId = organisationId,
      status = ConnectivityStatus.Healthy,
      issue = None
    )
  }

  private def reportFailure(cause: Throwable): Unit = {
    log.error(cause,
              s"Failed to load the issues of $externalProjectId for $projectId")
    val issue = ImporterErrors.connectivityIssue(cause)
    systemServices.issueImporterStatusMonitor ! UpdateProjectSyncStats(
      configId = configId,
      organisationId = organisationId,
      projectId = projectId,
      projectName = projectName,
      issueCount = 0,
      success = false,
      error = Some(issue)
    )
    systemServices.issueImporterStatusMonitor ! UpdateConnectivityStatus(
      configId = configId,
      organisationId = organisationId,
      status = ConnectivityStatus.Failed,
      issue = Some(issue)
    )
  }
}
