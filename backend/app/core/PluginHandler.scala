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

package core

import actors.scheduler.github.GithubTagParseWorker
import actors.scheduler.gitlab.GitlabTagParseWorker
import actors.scheduler.jira.JiraTagParseWorker
import actors.scheduler.plane.PlaneTagParseWorker
import actors.scheduler.{
  ApiKeyAuthentication,
  OAuth2Authentication,
  ServiceConfiguration,
  TagParseWorker
}
import core.LoginHandler.InitializeUserViews
import models._
import org.apache.pekko.actor.SupervisorStrategy.Restart
import org.apache.pekko.actor._
import org.apache.pekko.pattern.pipe
import play.api.libs.ws.WSClient
import play.modules.reactivemongo.ReactiveMongoApi
import repositories._

import scala.concurrent.ExecutionContextExecutor
import scala.concurrent.duration.DurationInt

object PluginHandler {
  def props(userRepository: UserRepository,
            issueImporterConfigRepository: IssueImporterConfigRepository,
            systemServices: SystemServices,
            wsClient: WSClient,
            config: LasiusConfig,
            reactiveMongoApi: ReactiveMongoApi): Props =
    Props(
      classOf[PluginHandler],
      userRepository,
      issueImporterConfigRepository,
      systemServices,
      wsClient,
      config,
      reactiveMongoApi
    )

  /** Initializes the user views, migrates the mapping ids, and starts a worker
    * for each project mapping.
    */
  case object Startup

  /** Starts the worker of one mapping. A running worker of the mapping stops
    * first, so a changed mapping imports with its new settings.
    */
  final case class StartMappingWorker(config: IssueImporterConfig,
                                      mappingId: ProjectMappingId)

  /** Starts the workers of all mappings of a config, and replaces running ones.
    */
  final case class StartConfigWorkers(config: IssueImporterConfig)

  final case class StopMappingWorker(configId: IssueImporterConfigId,
                                     mappingId: ProjectMappingId)

  final case class StopConfigWorkers(configId: IssueImporterConfigId)

  final case class RefreshMappingTags(configId: IssueImporterConfigId,
                                      mappingId: ProjectMappingId)

  private final case class ConfigsLoaded(configs: Seq[IssueImporterConfig])

  private type WorkerKey = (IssueImporterConfigId, ProjectMappingId)
}

/** Runs one tag parse worker for each project mapping of the issue importers.
  */
class PluginHandler(
    userRepository: UserRepository,
    issueImporterConfigRepository: IssueImporterConfigRepository,
    systemServices: SystemServices,
    wsClient: WSClient,
    config: LasiusConfig,
    override val reactiveMongoApi: ReactiveMongoApi)
    extends Actor
    with ActorLogging
    with DBSupport {

  import PluginHandler._

  override val supportTransaction: Boolean = systemServices.supportTransaction

  private implicit val executionContext: ExecutionContextExecutor =
    context.dispatcher

  private var workers: Map[WorkerKey, ActorRef] = Map.empty

  override val supervisorStrategy: OneForOneStrategy =
    OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1.minute) {
      case _ => Restart
    }

  val receive: Receive = {
    case Startup =>
      initializeUserViews()
      loadConfigs()

    case ConfigsLoaded(configs) =>
      configs.foreach(startWorkers(_, _ => true))

    case Status.Failure(cause) =>
      log.error(
        cause,
        "The issue importers did not start, because their configs did not load")

    case StartMappingWorker(config, mappingId) =>
      startWorkers(config, _ == mappingId)

    case StartConfigWorkers(config) =>
      startWorkers(config, _ => true)

    case StopMappingWorker(configId, mappingId) =>
      stopWorker(configId -> mappingId)

    case StopConfigWorkers(configId) =>
      workers.keys.filter(_._1 == configId).foreach(stopWorker)

    case RefreshMappingTags(configId, mappingId) =>
      workers.get(configId -> mappingId) match {
        case Some(worker) => worker ! TagParseWorker.Parse
        case None         =>
          log.warning(
            s"No worker runs for mapping $mappingId of config $configId")
      }
  }

  private def initializeUserViews(): Unit =
    if (config.initializeViewsOnStartup) {
      withDBSession()(implicit dbSession => userRepository.findAll())
        .foreach(_.foreach(user =>
          systemServices.loginHandler ! InitializeUserViews(user.getReference)))
    }

  /** Loads the configs after the mapping id migration. A worker that starts
    * before the migration gets a random mapping id that no request can match.
    */
  private def loadConfigs(): Unit =
    withDBSession() { implicit dbSession =>
      for {
        migrated <- issueImporterConfigRepository.migrateProjectMappingIds()
        configs  <- issueImporterConfigRepository.findAllConfigs()
      } yield {
        if (migrated > 0)
          log.info(s"Migrated the project mapping ids of $migrated configs")
        ConfigsLoaded(configs)
      }
    }.pipeTo(self)

  private def startWorkers(config: IssueImporterConfig,
                           selected: ProjectMappingId => Boolean): Unit =
    workerProps(config).foreach { case (mappingId, props) =>
      if (selected(mappingId)) {
        val key = config.id -> mappingId
        stopWorker(key)
        workers += key -> context.actorOf(props)
      }
    }

  private def stopWorker(key: WorkerKey): Unit =
    workers.get(key).foreach { worker =>
      context.stop(worker)
      workers -= key
    }

  /** Builds the worker of each project mapping of a config. */
  protected def workerProps(
      config: IssueImporterConfig): Seq[(ProjectMappingId, Props)] = {
    val service = ServiceConfiguration(config.baseUrl.toString)
    val owner   = config.organisationReference.id

    config match {
      case c: GitlabConfig =>
        val auth = OAuth2Authentication(c.auth.accessToken)
        c.projects.map { mapping =>
          mapping.id -> GitlabTagParseWorker.props(wsClient,
                                                   systemServices,
                                                   service,
                                                   c.settings,
                                                   mapping.settings,
                                                   auth,
                                                   c.id,
                                                   owner,
                                                   mapping.projectId)
        }

      case c: JiraConfig =>
        val auth = OAuth2Authentication(c.auth.accessToken)
        c.projects.map { mapping =>
          mapping.id -> JiraTagParseWorker.props(wsClient,
                                                 systemServices,
                                                 service,
                                                 c.settings,
                                                 mapping.settings,
                                                 auth,
                                                 c.id,
                                                 owner,
                                                 mapping.projectId)
        }

      case c: PlaneConfig =>
        val auth = ApiKeyAuthentication(c.auth.apiKey)
        c.projects.map { mapping =>
          mapping.id -> PlaneTagParseWorker.props(wsClient,
                                                  systemServices,
                                                  service,
                                                  c.baseUrl,
                                                  c.settings,
                                                  mapping.settings,
                                                  auth,
                                                  c.id,
                                                  owner,
                                                  mapping.projectId)
        }

      case c: GithubConfig =>
        val auth = OAuth2Authentication(c.auth.accessToken)
        c.projects.map { mapping =>
          mapping.id -> GithubTagParseWorker.props(wsClient,
                                                   systemServices,
                                                   service,
                                                   c.settings,
                                                   mapping.settings,
                                                   auth,
                                                   c.id,
                                                   owner,
                                                   mapping.projectId)
        }
    }
  }
}
