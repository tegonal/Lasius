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

package actors.scheduler.github

import java.util.UUID

import actors.scheduler.github.GithubTagParseWorker.StartParsing
import actors.scheduler.{ServiceAuthentication, ServiceConfiguration}
import org.apache.pekko.actor.SupervisorStrategy._
import org.apache.pekko.actor.{OneForOneStrategy, _}
import core.SystemServices
import models._
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.language.postfixOps

object GithubTagParseScheduler {
  def props(wsClient: WSClient, systemServices: SystemServices): Props =
    Props(classOf[GithubTagParseScheduler], wsClient, systemServices)

  case class StartScheduler(config: ServiceConfiguration,
                            settings: GithubSettings,
                            projectSettings: GithubProjectSettings,
                            auth: ServiceAuthentication,
                            configId: IssueImporterConfigId,
                            organisationId: OrganisationId,
                            projectId: ProjectId)
  case class StopScheduler(uuid: UUID)
  case class StopProjectScheduler(configId: IssueImporterConfigId,
                                  projectId: ProjectId)
  case object StopAllSchedulers
  case class SchedulerStarted(uuid: UUID)
  case class RefreshTags(configId: IssueImporterConfigId, projectId: ProjectId)
}

class GithubTagParseScheduler(wsClient: WSClient,
                              systemServices: SystemServices)
    extends Actor
    with ActorLogging {
  import GithubTagParseScheduler._
  var workers: Map[UUID, ActorRef]                                      = Map()
  var projectWorkers: Map[(IssueImporterConfigId, ProjectId), ActorRef] = Map()

  override val supervisorStrategy: OneForOneStrategy =
    OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1.minute) {
      case _ => Restart
    }

  val receive: Receive = {
    case StartScheduler(config,
                        settings,
                        projectSettings,
                        auth,
                        configId,
                        organisationId,
                        projectId) =>
      log.debug(
        s"StartScheduler: $config, $auth, $projectId, ${projectSettings.githubRepoOwner}/${projectSettings.githubRepoName}")
      val uuid = UUID.randomUUID
      val ref  = context.actorOf(
        GithubTagParseWorker.props(wsClient,
                                   systemServices,
                                   config,
                                   settings,
                                   projectSettings,
                                   auth,
                                   configId,
                                   organisationId,
                                   projectId))
      workers += uuid                         -> ref
      projectWorkers += (configId, projectId) -> ref
      ref ! StartParsing
      sender() ! SchedulerStarted(uuid)
    case StopScheduler(uuid) =>
      log.debug(s"StopScheduler: $uuid")
      workers = workers
        .get(uuid)
        .map { worker =>
          log.debug(s"Stopping worker with uuid:$uuid")
          projectWorkers = projectWorkers.filter(_._2 != worker)
          worker ! PoisonPill
          workers - uuid
        }
        .getOrElse(workers)

    case StopAllSchedulers =>
      log.debug("Stopping all workers")
      workers.map { case (_, worker) => worker ! PoisonPill }
      projectWorkers = Map()

    case StopProjectScheduler(configId, projectId) =>
      log.debug(
        s"StopProjectScheduler: configId=$configId, projectId=$projectId")
      projectWorkers.get((configId, projectId)) match {
        case Some(worker) =>
          log.debug(
            s"Stopping worker for configId=$configId, projectId=$projectId")
          worker ! PoisonPill
          projectWorkers -= ((configId, projectId))
          // Also remove from workers map
          workers = workers.filter(_._2 != worker)
        case None =>
          log.warning(
            s"No worker found for configId=$configId, projectId=$projectId")
      }

    case RefreshTags(configId, projectId) =>
      log.debug(s"RefreshTags: configId=$configId, projectId=$projectId")
      projectWorkers.get((configId, projectId)) match {
        case Some(worker) =>
          log.debug(
            s"Found worker for project $projectId, sending Parse message")
          worker ! GithubTagParseWorker.Parse
        case None =>
          log.warning(
            s"No worker found for configId=$configId, projectId=$projectId")
      }
  }
}
