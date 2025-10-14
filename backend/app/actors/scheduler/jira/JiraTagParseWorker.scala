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

package actors.scheduler.jira

import actors.IssueImporterStatusMonitor.{
  UpdateConnectivityStatus,
  UpdateProjectSyncStats
}
import models._
import actors.TagCache.TagsUpdated
import actors.scheduler.{ServiceAuthentication, ServiceConfiguration}
import org.apache.pekko.actor._
import core.SystemServices
import org.joda.time.DateTime
import play.api.libs.ws.WSClient

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.concurrent.duration._
import scala.language.postfixOps
import scala.util.{Failure, Success}

object JiraTagParseWorker {
  def props(wsClient: WSClient,
            systemServices: SystemServices,
            config: ServiceConfiguration,
            settings: JiraSettings,
            projectSettings: JiraProjectSettings,
            auth: ServiceAuthentication,
            configId: IssueImporterConfigId,
            organisationId: OrganisationId,
            projectId: ProjectId): Props =
    Props(classOf[JiraTagParseWorker],
          wsClient,
          systemServices,
          config,
          settings,
          projectSettings,
          auth,
          configId,
          organisationId,
          projectId)

  case object StartParsing
  case object Parse
}

class JiraTagParseWorker(wsClient: WSClient,
                         systemServices: SystemServices,
                         config: ServiceConfiguration,
                         settings: JiraSettings,
                         projectSettings: JiraProjectSettings,
                         implicit val auth: ServiceAuthentication,
                         configId: IssueImporterConfigId,
                         organisationId: OrganisationId,
                         projectId: ProjectId)
    extends Actor
    with ActorLogging {
  import JiraTagParseWorker._

  var cancellable: Option[Cancellable]   = None
  private var lastIssueSize: Option[Int] = None
  private val jiraApiService = new JiraApiServiceImpl(wsClient, config)
  private val defaultJql     =
    s"project=${projectSettings.jiraProjectKey} and resolution=Unresolved ORDER BY created DESC"
  val maxResults: Int = projectSettings.maxResults.getOrElse(100)
  implicit val executionContext: ExecutionContextExecutor =
    context.system.dispatcher

  val receive: Receive = { case StartParsing =>
    cancellable = Some(
      context.system.scheduler.scheduleOnce(0.milliseconds, self, Parse))
    context.become(parsing)
  }

  val parsing: Receive = { case Parse =>
    loadIssues(0, lastIssueSize)
      .map { result =>
        // fetched all results, notify
        lastIssueSize = Some(result.size)
        if (log.isDebugEnabled) {
          val keys = result.map(_.key)
          log.debug(s"Parsed keys:$keys")
        }

        // assemble jira issuetag
        val tags = result.map(toJiraIssueTag)
        systemServices.tagCache ! TagsUpdated[JiraIssueTag](
          projectSettings.jiraProjectKey,
          projectId,
          tags)

        // Report successful sync
        systemServices.issueImporterStatusMonitor ! UpdateProjectSyncStats(
          configId = configId,
          organisationId = organisationId,
          projectId = projectId,
          projectName = s"Jira Project ${projectSettings.jiraProjectKey}",
          issueCount = result.size,
          success = true
        )

        systemServices.issueImporterStatusMonitor ! UpdateConnectivityStatus(
          configId = configId,
          organisationId = organisationId,
          status = ConnectivityStatus.Healthy,
          issue = None
        )
      }
      .andThen {
        case Success(_) =>
          log.debug(s"Parse successful, restarting timer")
          cancellable = Some(
            context.system.scheduler
              .scheduleOnce(settings.checkFrequency.milliseconds, self, Parse))

        case Failure(ex) =>
          log.error(ex, s"Failed to parse Jira issues for project $projectId")

          val (errorCode, httpStatus) = classifyError(ex)
          val issue                   = ConnectivityIssue(
            errorCode = errorCode,
            message = ex.getMessage,
            timestamp = DateTime.now,
            httpStatus = httpStatus
          )

          systemServices.issueImporterStatusMonitor ! UpdateProjectSyncStats(
            configId = configId,
            organisationId = organisationId,
            projectId = projectId,
            projectName = s"Jira Project ${projectSettings.jiraProjectKey}",
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

          cancellable = Some(
            context.system.scheduler
              .scheduleOnce(settings.checkFrequency.milliseconds, self, Parse))
      }
  }

  private def toJiraIssueTag(issue: JiraIssue): JiraIssueTag = {
    issue.fields
      .map { fields =>
        JiraIssueTag(TagId(issue.key),
                     config.baseUrl,
                     fields.primary.summary,
                     issue.self,
                     projectSettings.jiraProjectKey)
      }
      .getOrElse {
        JiraIssueTag(TagId(issue.key),
                     config.baseUrl,
                     None,
                     issue.self,
                     projectSettings.jiraProjectKey)
      }
  }

  def loadIssues(offset: Int,
                 max: Option[Int],
                 lastResult: Set[JiraIssue] = Set()): Future[Set[JiraIssue]] = {
    val newMax = max.getOrElse(maxResults)
    issues(offset, newMax).flatMap { result =>
      val concat: Set[JiraIssue] = lastResult ++ result.issues.toSet
      log.debug(
        s"loaded issues: maxResults:${result.maxResults}, fetch count${concat.size}")
      if (result.maxResults >= concat.size) {
        // fetched all results, notify
        Future.successful(concat)
      } else {
        val maxNextRun = Math.min(result.maxResults, maxResults)
        loadIssues(newMax, Some(maxNextRun), concat)
      }
    }
  }

  def issues(offset: Int, max: Int): Future[JiraSearchResult] = {
    log.debug(
      s"Parse issues projectId=${projectId.value}, project=${projectSettings.jiraProjectKey}, offset:$offset, max:$max")
    val query = projectSettings.jql.getOrElse(defaultJql)
    jiraApiService.findIssues(query,
                              Some(offset),
                              Some(max),
                              fields = Some("summary"))
  }

  private def classifyError(ex: Throwable): (String, Option[Int]) = {
    ex.getMessage match {
      case msg if msg.contains("401") || msg.contains("Unauthorized") =>
        ("authentication_failed", Some(401))
      case msg if msg.contains("403") || msg.contains("Forbidden") =>
        ("permission_denied", Some(403))
      case msg if msg.contains("404") || msg.contains("Not Found") =>
        ("resource_not_found", Some(404))
      case msg if msg.contains("timeout") || msg.contains("timed out") =>
        ("timeout", None)
      case msg
          if msg.contains("Connection refused") || msg.contains(
            "ConnectException") =>
        ("connection_refused", None)
      case _ => ("unknown_error", None)
    }
  }

  override def postStop(): Unit = {
    cancellable.map(c => c.cancel())
    cancellable = None
    super.postStop()
  }
}
