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

import actors.scheduler.{
  ServiceAuthentication,
  ServiceConfiguration,
  TagParseWorker
}
import core.SystemServices
import models._
import org.apache.pekko.actor.Props
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

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

  /** Loads the issue pages from page 1. GitHub reports no total, so a page with
    * fewer than `maxResults` issues is the last one. A page without a new issue
    * also ends the load, because a server that ignores `page` repeats a page.
    */
  private[github] def loadAllPages(maxResults: Int)(
      loadPage: Int => Future[GithubIssuesSearchResult])(implicit
      executionContext: ExecutionContext): Future[Set[GithubIssue]] = {
    def loadFrom(page: Int,
                 loaded: Set[GithubIssue]): Future[Set[GithubIssue]] =
      loadPage(page).flatMap { result =>
        val issues = loaded ++ result.issues
        if (result.issues.size < maxResults || issues.size == loaded.size)
          Future.successful(issues)
        else loadFrom(page + 1, issues)
      }

    loadFrom(page = 1, loaded = Set.empty)
  }
}

class GithubTagParseWorker(wsClient: WSClient,
                           protected val systemServices: SystemServices,
                           config: ServiceConfiguration,
                           settings: GithubSettings,
                           projectSettings: GithubProjectSettings,
                           private implicit val auth: ServiceAuthentication,
                           protected val configId: IssueImporterConfigId,
                           protected val organisationId: OrganisationId,
                           protected val projectId: ProjectId)
    extends TagParseWorker[GithubIssueTag] {

  import GithubTagParseWorker.loadAllPages

  private val apiService = new GithubApiServiceImpl(wsClient, config)
  private val repository =
    s"${projectSettings.githubRepoOwner}/${projectSettings.githubRepoName}"
  private val maxResults = projectSettings.maxResults.getOrElse(100)
  private val query      = projectSettings.params.getOrElse(
    projectSettings.tagConfiguration.includeOnlyIssuesWithState.headOption
      .map(state => s"state=$state")
      .getOrElse("state=open"))

  override protected val externalProjectId: String = repository
  override protected val projectName: String       =
    projectSettings.externalProjectName.getOrElse(s"GitHub $repository")
  override protected val checkFrequency: FiniteDuration =
    settings.checkFrequency.milliseconds

  override protected def loadTags(): Future[Set[GithubIssueTag]] =
    loadAllPages(maxResults) { page =>
      apiService.findIssues(projectSettings.githubRepoOwner,
                            projectSettings.githubRepoName,
                            query,
                            Some(page),
                            Some(maxResults))
    }.map(_.map(toGithubIssueTag))

  private def toGithubIssueTag(issue: GithubIssue): GithubIssueTag = {
    val tagConfiguration = projectSettings.tagConfiguration
    val labelTags        =
      if (tagConfiguration.useLabels)
        issue.labels
          .map(_.name)
          .filterNot(tagConfiguration.labelFilter.contains)
          .map(name => SimpleTag(TagId(name)))
      else Seq.empty
    val assigneeTags =
      if (tagConfiguration.useAssignees)
        issue.assignees.map(assignee => SimpleTag(TagId(assignee.login)))
      else Seq.empty
    val milestoneTag = issue.milestone
      .filter(_ => tagConfiguration.useMilestone)
      .map(milestone => SimpleTag(TagId(milestone.title)))
    val titleTag =
      Option.when(tagConfiguration.useTitle)(SimpleTag(TagId(issue.title)))

    GithubIssueTag(
      TagId(
        projectSettings.projectKeyPrefix.getOrElse("") + s"#${issue.number}"),
      projectSettings.githubRepoOwner,
      projectSettings.githubRepoName,
      issue.number,
      Some(issue.title),
      labelTags ++ assigneeTags ++ milestoneTag ++ titleTag,
      issue.html_url
    )
  }
}
