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

import actors.scheduler.gitlab.GitlabTagParseScheduler
import actors.scheduler.github.GithubTagParseScheduler
import actors.scheduler.jira.JiraTagParseScheduler
import actors.scheduler.plane.PlaneTagParseScheduler
import actors.scheduler.{
  ApiKeyAuthentication,
  OAuth2Authentication,
  ServiceConfiguration
}
import org.apache.pekko.actor._
import core.LoginHandler.InitializeUserViews
import models._
import play.api.libs.ws.WSClient
import play.modules.reactivemongo.ReactiveMongoApi
import repositories._

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.{Failure, Success}

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

  case object Startup

  case object Shutdown

  case class RefreshProjectTags(importerType: ImporterType,
                                configId: IssueImporterConfigId,
                                projectId: ProjectId)

  case class StartProjectScheduler(importerType: ImporterType,
                                   config: IssueImporterConfig,
                                   projectId: ProjectId)

  case class StartConfigSchedulers(config: IssueImporterConfig)

  case class StopProjectScheduler(importerType: ImporterType,
                                  configId: IssueImporterConfigId,
                                  projectId: ProjectId)

  case class StopConfigSchedulers(importerType: ImporterType,
                                  configId: IssueImporterConfigId)
}

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

  override val supportTransaction: Boolean = systemServices.supportTransaction

  import PluginHandler._

  implicit val executionContext: ExecutionContextExecutor = context.dispatcher

  private val jiraTagParseScheduler: ActorRef =
    context.actorOf(JiraTagParseScheduler.props(wsClient, systemServices))
  private val gitlabTagParseScheduler: ActorRef =
    context.actorOf(GitlabTagParseScheduler.props(wsClient, systemServices))
  private val planeTagParseScheduler: ActorRef =
    context.actorOf(PlaneTagParseScheduler.props(wsClient, systemServices))
  private val githubTagParseScheduler: ActorRef =
    context.actorOf(GithubTagParseScheduler.props(wsClient, systemServices))

  log.debug(s"PluginHandler started")

  val receive: Receive = {
    case Startup =>
      log.debug(s"PluginHandler startup")
      withDBSession() { implicit dbSession =>
        Future {
          initialize()
        }
      }
    case Shutdown =>

    case RefreshProjectTags(importerType, configId, projectId) =>
      log.debug(
        s"RefreshProjectTags: type=$importerType, configId=$configId, projectId=$projectId")
      importerType match {
        case ImporterType.Gitlab =>
          gitlabTagParseScheduler ! GitlabTagParseScheduler.RefreshTags(
            configId,
            projectId)
        case ImporterType.Jira =>
          jiraTagParseScheduler ! JiraTagParseScheduler.RefreshTags(configId,
                                                                    projectId)
        case ImporterType.Plane =>
          planeTagParseScheduler ! PlaneTagParseScheduler.RefreshTags(configId,
                                                                      projectId)
        case ImporterType.Github =>
          githubTagParseScheduler ! GithubTagParseScheduler.RefreshTags(
            configId,
            projectId)
      }

    case StartProjectScheduler(importerType, config, projectId) =>
      log.debug(
        s"StartProjectScheduler: type=$importerType, configId=${config.id}, projectId=$projectId")
      config match {
        case c: GitlabConfig =>
          c.projects.find(_.projectId == projectId).foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = OAuth2Authentication(c.auth.accessToken)
            gitlabTagParseScheduler ! GitlabTagParseScheduler.StartScheduler(
              serviceConfig,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
        case c: JiraConfig =>
          c.projects.find(_.projectId == projectId).foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = OAuth2Authentication(c.auth.accessToken)
            jiraTagParseScheduler ! JiraTagParseScheduler.StartScheduler(
              serviceConfig,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
        case c: PlaneConfig =>
          c.projects.find(_.projectId == projectId).foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = ApiKeyAuthentication(c.auth.apiKey)
            planeTagParseScheduler ! PlaneTagParseScheduler.StartScheduler(
              serviceConfig,
              c.baseUrl,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
        case c: GithubConfig =>
          c.projects.find(_.projectId == projectId).foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = OAuth2Authentication(c.auth.accessToken)
            githubTagParseScheduler ! GithubTagParseScheduler.StartScheduler(
              serviceConfig,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
      }

    case StartConfigSchedulers(config) =>
      log.debug(
        s"StartConfigSchedulers: type=${config.importerType}, configId=${config.id}")
      config match {
        case c: GitlabConfig =>
          c.projects.foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = OAuth2Authentication(c.auth.accessToken)
            gitlabTagParseScheduler ! GitlabTagParseScheduler.StartScheduler(
              serviceConfig,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
        case c: JiraConfig =>
          c.projects.foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = OAuth2Authentication(c.auth.accessToken)
            jiraTagParseScheduler ! JiraTagParseScheduler.StartScheduler(
              serviceConfig,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
        case c: PlaneConfig =>
          c.projects.foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = ApiKeyAuthentication(c.auth.apiKey)
            planeTagParseScheduler ! PlaneTagParseScheduler.StartScheduler(
              serviceConfig,
              c.baseUrl,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
        case c: GithubConfig =>
          c.projects.foreach { proj =>
            val serviceConfig = ServiceConfiguration(c.baseUrl.toString)
            val auth          = OAuth2Authentication(c.auth.accessToken)
            githubTagParseScheduler ! GithubTagParseScheduler.StartScheduler(
              serviceConfig,
              c.settings,
              proj.settings,
              auth,
              c.id,
              c.organisationReference.id,
              proj.projectId
            )
          }
      }

    case StopProjectScheduler(importerType, configId, projectId) =>
      log.debug(
        s"StopProjectScheduler: type=$importerType, configId=$configId, projectId=$projectId")
      importerType match {
        case ImporterType.Gitlab =>
          gitlabTagParseScheduler ! GitlabTagParseScheduler
            .StopProjectScheduler(configId, projectId)
        case ImporterType.Jira =>
          jiraTagParseScheduler ! JiraTagParseScheduler.StopProjectScheduler(
            configId,
            projectId)
        case ImporterType.Plane =>
          planeTagParseScheduler ! PlaneTagParseScheduler.StopProjectScheduler(
            configId,
            projectId)
        case ImporterType.Github =>
          githubTagParseScheduler ! GithubTagParseScheduler
            .StopProjectScheduler(configId, projectId)
      }

    case StopConfigSchedulers(importerType, configId) =>
      log.debug(s"StopConfigSchedulers: type=$importerType, configId=$configId")
      importerType match {
        case ImporterType.Gitlab =>
          gitlabTagParseScheduler ! GitlabTagParseScheduler.StopAllSchedulers
        case ImporterType.Jira =>
          jiraTagParseScheduler ! JiraTagParseScheduler.StopAllSchedulers
        case ImporterType.Plane =>
          planeTagParseScheduler ! PlaneTagParseScheduler.StopAllSchedulers
        case ImporterType.Github =>
          githubTagParseScheduler ! GithubTagParseScheduler.StopAllSchedulers
      }

    case msg if msg.getClass.getSimpleName == "SchedulerStarted" =>
      // Schedulers send SchedulerStarted acknowledgment - we can ignore it
      log.debug(s"Scheduler started: $msg")

    case e =>
      log.warning(s"Received unknown event:$e")
  }

  def initialize()(implicit dbSession: DBSession): Unit = {
    initializeUserViews()
    initializeGitlabPlugin()
    initializeJiraPlugin()
    initializePlanePlugin()
    initializeGithubPlugin()
  }

  private def initializeUserViews()(implicit dbSession: DBSession): Unit = {
    log.debug(s"initializeUserViews:${config.initializeViewsOnStartup}")
    if (config.initializeViewsOnStartup) {
      userRepository.findAll().foreach { users =>
        log.debug(s"findAllUsers:${users.map(_.getReference)}")
        users.foreach(user =>
          systemServices.loginHandler ! InitializeUserViews(user.getReference))
      }
    }
  }

  private def initializeJiraPlugin()(implicit dbSession: DBSession): Unit = {
    log.debug(
      s"PluginHandler initializeJiraPlugin:$issueImporterConfigRepository")
    // start jira parse scheduler for every project attached to a jira configuration
    issueImporterConfigRepository
      .findAllConfigs(Some(ImporterType.Jira))
      .map { configs =>
        log.debug(s"Got jira configs:${configs.size}")
        configs.foreach {
          case config: JiraConfig =>
            log.debug(s"Start Jira Scheduler for config:$config")
            val jiraConfig = ServiceConfiguration(config.baseUrl.toString)
            val auth       = OAuth2Authentication(config.auth.accessToken)

            config.projects.foreach { proj =>
              log.debug(
                s"Start parsing for the following configuration:$jiraConfig - $proj")
              jiraTagParseScheduler ! JiraTagParseScheduler.StartScheduler(
                jiraConfig,
                config.settings,
                proj.settings,
                auth,
                config.id,
                config.organisationReference.id,
                proj.projectId)
            }
          case _ =>
            log.warning(
              s"Expected JiraConfig but got different type - should not happen")
        }
      }
      .onComplete {
        case Success(_) =>
          log.debug(s"Successfully loaded jira plugins")
        case Failure(exception) =>
          log.warning(exception, "Failed loading jira configuration")
      }
    ()
  }

  private def initializeGitlabPlugin()(implicit dbSession: DBSession): Unit = {
    log.debug(
      s"PluginHandler initializeGitlabPlugin:$issueImporterConfigRepository")
    // start gitlab parse scheduler for every project attached to a gitlab configuration
    issueImporterConfigRepository
      .findAllConfigs(Some(ImporterType.Gitlab))
      .map { configs =>
        log.debug(s"Got gitlab configs:${configs.size}")
        configs.foreach {
          case config: GitlabConfig =>
            log.debug(s"Start Gitlab Scheduler for config:$config")
            val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
            val auth          = OAuth2Authentication(config.auth.accessToken)

            config.projects.foreach { proj =>
              log.debug(
                s"Start parsing for the following configuration:$serviceConfig - $proj")
              gitlabTagParseScheduler ! GitlabTagParseScheduler.StartScheduler(
                serviceConfig,
                config.settings,
                proj.settings,
                auth,
                config.id,
                config.organisationReference.id,
                proj.projectId)
            }
          case _ =>
            log.warning(
              s"Expected GitlabConfig but got different type - should not happen")
        }
      }
      .onComplete {
        case Success(_) =>
          log.debug(s"Successfully loaded gitlab plugins")
        case Failure(exception) =>
          log.warning(exception, "Failed loading gitlab configuration")
      }
    ()
  }

  private def initializePlanePlugin()(implicit dbSession: DBSession): Unit = {
    log.debug(
      s"PluginHandler initializePlanePlugin:$issueImporterConfigRepository")
    // start plane parse scheduler for every project attached to a plane configuration
    issueImporterConfigRepository
      .findAllConfigs(Some(ImporterType.Plane))
      .map { configs =>
        log.debug(s"Got plane configs:${configs.size}")
        configs.foreach {
          case config: PlaneConfig =>
            log.debug(s"Start Plane Scheduler for config:$config")
            val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
            val auth          = ApiKeyAuthentication(config.auth.apiKey)

            config.projects.foreach { proj =>
              log.debug(
                s"Start parsing for the following configuration:$serviceConfig - $proj")
              planeTagParseScheduler ! PlaneTagParseScheduler.StartScheduler(
                serviceConfig,
                config.baseUrl,
                config.settings,
                proj.settings,
                auth,
                config.id,
                config.organisationReference.id,
                proj.projectId)
            }
          case _ =>
            log.warning(
              s"Expected PlaneConfig but got different type - should not happen")
        }
      }
      .onComplete {
        case Success(_) =>
          log.debug(s"Successfully loaded plane plugins")
        case Failure(exception) =>
          log.warning(exception, "Failed loading plane configuration")
      }
    ()
  }

  private def initializeGithubPlugin()(implicit dbSession: DBSession): Unit = {
    log.debug(
      s"PluginHandler initializeGithubPlugin:$issueImporterConfigRepository")
    // start github parse scheduler for every project attached to a github configuration
    issueImporterConfigRepository
      .findAllConfigs(Some(ImporterType.Github))
      .map { configs =>
        log.debug(s"Got github configs:${configs.size}")
        configs.foreach {
          case config: GithubConfig =>
            log.debug(s"Start Github Scheduler for config:$config")
            val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
            val auth          = OAuth2Authentication(config.auth.accessToken)

            config.projects.foreach { proj =>
              log.debug(
                s"Start parsing for the following configuration:$serviceConfig - $proj")
              githubTagParseScheduler ! GithubTagParseScheduler.StartScheduler(
                serviceConfig,
                config.settings,
                proj.settings,
                auth,
                config.id,
                config.organisationReference.id,
                proj.projectId)
            }
          case _ =>
            log.warning(
              s"Expected GithubConfig but got different type - should not happen")
        }
      }
      .onComplete {
        case Success(_) =>
          log.debug(s"Successfully loaded github plugins")
        case Failure(exception) =>
          log.warning(exception, "Failed loading github configuration")
      }
    ()
  }
}
