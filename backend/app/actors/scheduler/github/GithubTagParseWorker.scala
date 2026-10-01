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

import scala.concurrent.Future
import scala.concurrent.duration._

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
    loadIssues(page = 1).map(_.map(toGithubIssueTag))

  /** GitHub reports no total, so a page with fewer issues than requested is the
    * last one. The first page is 1.
    */
  private def loadIssues(
      page: Int,
      loaded: Set[GithubIssue] = Set.empty): Future[Set[GithubIssue]] =
    apiService
      .findIssues(projectSettings.githubRepoOwner,
                  projectSettings.githubRepoName,
                  query,
                  Some(page),
                  Some(maxResults))
      .flatMap { result =>
        val all = loaded ++ result.issues
        if (result.issues.size < maxResults) Future.successful(all)
        else loadIssues(page + 1, all)
      }

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
