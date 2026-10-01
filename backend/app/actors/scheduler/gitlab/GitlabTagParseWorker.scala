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

package actors.scheduler.gitlab

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

object GitlabTagParseWorker {
  def props(wsClient: WSClient,
            systemServices: SystemServices,
            config: ServiceConfiguration,
            settings: GitlabSettings,
            projectSettings: GitlabProjectSettings,
            auth: ServiceAuthentication,
            configId: IssueImporterConfigId,
            organisationId: OrganisationId,
            projectId: ProjectId): Props =
    Props(classOf[GitlabTagParseWorker],
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

class GitlabTagParseWorker(wsClient: WSClient,
                           protected val systemServices: SystemServices,
                           config: ServiceConfiguration,
                           settings: GitlabSettings,
                           projectSettings: GitlabProjectSettings,
                           private implicit val auth: ServiceAuthentication,
                           protected val configId: IssueImporterConfigId,
                           protected val organisationId: OrganisationId,
                           protected val projectId: ProjectId)
    extends TagParseWorker[GitlabIssueTag] {

  private val apiService = new GitlabApiServiceImpl(wsClient, config)
  private val maxResults = projectSettings.maxResults.getOrElse(500)
  private val query      = projectSettings.params.getOrElse(
    "state=opened&order_by=created_at&sort=desc")

  override protected val externalProjectId: String =
    projectSettings.gitlabProjectId
  override protected val projectName: String =
    projectSettings.externalProjectName.getOrElse(
      s"GitLab Project ${projectSettings.gitlabProjectId}")
  override protected val checkFrequency: FiniteDuration =
    settings.checkFrequency.milliseconds

  override protected def loadTags(): Future[Set[GitlabIssueTag]] =
    loadIssues(page = 0).map(_.map(toGitlabIssueTag))

  /** Follows the next page that GitLab reports, until all issues are loaded.
    */
  private def loadIssues(
      page: Int,
      loaded: Set[GitlabIssue] = Set.empty): Future[Set[GitlabIssue]] =
    apiService
      .findIssues(projectSettings.gitlabProjectId,
                  query,
                  Some(page),
                  Some(maxResults))
      .flatMap { result =>
        val all       = loaded ++ result.issues
        val allLoaded =
          result.totalNumberOfItems.exists(all.size >= _) ||
            result.page.zip(result.totalPages).exists { case (current, total) =>
              current >= total
            }
        result.nextPage.filter(_ > 0) match {
          case Some(nextPage) if !allLoaded => loadIssues(nextPage, all)
          case _                            => Future.successful(all)
        }
      }

  private def toGitlabIssueTag(issue: GitlabIssue): GitlabIssueTag = {
    val tagConfiguration = projectSettings.tagConfiguration
    val labelTags        =
      if (tagConfiguration.useLabels)
        issue.labels
          .filterNot(tagConfiguration.labelFilter.contains)
          .map(label => SimpleTag(TagId(label)))
      else Seq.empty
    val milestoneTag = issue.milestone
      .filter(_ => tagConfiguration.useMilestone)
      .map(milestone => SimpleTag(TagId(milestone.title)))
    val titleTag =
      Option.when(tagConfiguration.useTitle)(SimpleTag(TagId(issue.title)))

    GitlabIssueTag(
      TagId(
        projectSettings.projectKeyPrefix.getOrElse("") +
          issue.references.map(_.short).getOrElse(s"#${issue.iid}")),
      issue.project_id,
      Some(issue.title),
      labelTags ++ milestoneTag ++ titleTag,
      issue.web_url
    )
  }
}
