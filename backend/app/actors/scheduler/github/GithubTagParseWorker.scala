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

import actors.IssueImporterStatusMonitor.{
  UpdateConnectivityStatus,
  UpdateProjectSyncStats
}
import actors.TagCache.TagsUpdated
import actors.scheduler.{ServiceAuthentication, ServiceConfiguration}
import org.apache.pekko.actor._
import core.SystemServices
import models._
import org.joda.time.DateTime
import play.api.libs.ws.WSClient

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.concurrent.duration._
import scala.language.postfixOps
import scala.util.{Failure, Success}

object GithubTagParseWorker {
  def props(wsClient: WSClient,
            systemServices: SystemServices,
            config: ServiceConfiguration,
            settings: GithubSettings,
            projectSettings: GithubProjectSettings,
            auth: ServiceAuthentication,
            configId: IssueImporterConfigId,
            organisationId: OrganisationId,
            projectId: ProjectId): Props =
    Props(classOf[GithubTagParseWorker],
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

class GithubTagParseWorker(wsClient: WSClient,
                           systemServices: SystemServices,
                           config: ServiceConfiguration,
                           settings: GithubSettings,
                           projectSettings: GithubProjectSettings,
                           implicit val auth: ServiceAuthentication,
                           configId: IssueImporterConfigId,
                           organisationId: OrganisationId,
                           projectId: ProjectId)
    extends Actor
    with ActorLogging {
  import GithubTagParseWorker._

  var cancellable: Option[Cancellable] = None
  val apiService = new GithubApiServiceImpl(wsClient, config)

  // GitHub query parameters: state=open by default
  val defaultParams =
    projectSettings.tagConfiguration.includeOnlyIssuesWithState.headOption
      .map(state => s"state=$state")
      .getOrElse("state=open")

  val maxResults: Int = projectSettings.maxResults.getOrElse(100)
  implicit val executionContext: ExecutionContextExecutor =
    context.system.dispatcher

  val receive: Receive = { case StartParsing =>
    cancellable = Some(
      context.system.scheduler.scheduleOnce(0.milliseconds, self, Parse))
    context.become(parsing)
  }

  val parsing: Receive = { case Parse =>
    loadIssues(1, None) // GitHub pagination starts at 1, not 0
      .map { result =>
        // fetched all results, notify
        if (log.isDebugEnabled) {
          val keys = result.map(i => s"#${i.number}")
          log.debug(s"Parsed keys:$keys")
        }

        // assemble issue tags
        val tags = result.map(toGithubIssueTag)
        systemServices.tagCache ! TagsUpdated[GithubIssueTag](
          s"${projectSettings.githubRepoOwner}/${projectSettings.githubRepoName}",
          projectId,
          tags)

        // Report successful sync
        systemServices.issueImporterStatusMonitor ! UpdateProjectSyncStats(
          configId = configId,
          organisationId = organisationId,
          projectId = projectId,
          projectName = projectSettings.externalProjectName.getOrElse(
            s"GitHub ${projectSettings.githubRepoOwner}/${projectSettings.githubRepoName}"),
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
          log.error(ex, s"Failed to parse GitHub issues for project $projectId")

          // Classify error and report
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
            projectName = projectSettings.externalProjectName.getOrElse(
              s"GitHub ${projectSettings.githubRepoOwner}/${projectSettings.githubRepoName}"),
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

          // restart timer anyway
          cancellable = Some(
            context.system.scheduler
              .scheduleOnce(settings.checkFrequency.milliseconds, self, Parse))
      }
  }

  private def toGithubIssueTag(issue: GithubIssue): GithubIssueTag = {
    // create tag for milestone
    val milestoneTag = if (projectSettings.tagConfiguration.useMilestone) {
      issue.milestone.map(m => SimpleTag(TagId(m.title)))
    } else {
      None
    }

    val titleTag = if (projectSettings.tagConfiguration.useTitle) {
      Some(SimpleTag(TagId(issue.title)))
    } else {
      None
    }

    val assigneeTags = if (projectSettings.tagConfiguration.useAssignees) {
      issue.assignees.map(a => SimpleTag(TagId(a.login)))
    } else {
      Seq()
    }

    val labelTags = if (projectSettings.tagConfiguration.useLabels) {
      issue.labels
        .filterNot(l =>
          projectSettings.tagConfiguration.labelFilter.contains(l.name))
        .map(l => SimpleTag(TagId(l.name)))
    } else {
      Seq()
    }

    val tags =
      milestoneTag
        .map { m =>
          labelTags ++ assigneeTags ++ titleTag
            .map(t => Seq(m, t))
            .getOrElse(Seq(m))
        }
        .getOrElse {
          titleTag
            .map(t => labelTags ++ assigneeTags :+ t)
            .getOrElse(labelTags ++ assigneeTags)
        }

    val issueLink = issue.html_url

    GithubIssueTag(
      TagId(
        projectSettings.projectKeyPrefix.getOrElse("") +
          s"#${issue.number}"),
      projectSettings.githubRepoOwner,
      projectSettings.githubRepoName,
      issue.number,
      Some(issue.title),
      tags,
      issueLink
    )
  }

  def loadIssues(
      page: Int,
      max: Option[Int],
      lastResult: Set[GithubIssue] = Set()): Future[Set[GithubIssue]] = {
    val newMax = max.getOrElse(maxResults)
    issues(page, newMax).flatMap { result =>
      val concat: Set[GithubIssue] = lastResult ++ result.issues.toSet
      log.debug(s"loaded issues: page:$page, fetch count:${concat.size}")

      // GitHub doesn't provide total count easily, so we stop when we get fewer results than requested
      if (result.issues.size < newMax) {
        // Last page (partial results)
        Future.successful(concat)
      } else {
        // Load next page
        loadIssues(page + 1, max, concat)
      }
    }
  }

  def issues(page: Int, perPage: Int): Future[GithubIssuesSearchResult] = {
    log.debug(
      s"Parse issues projectId=${projectId.value}, repo=${projectSettings.githubRepoOwner}/${projectSettings.githubRepoName}, page:$page, per_page:$perPage")
    val query = projectSettings.params.getOrElse(defaultParams)
    apiService
      .findIssues(projectSettings.githubRepoOwner,
                  projectSettings.githubRepoName,
                  query,
                  Some(page),
                  Some(perPage))
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
