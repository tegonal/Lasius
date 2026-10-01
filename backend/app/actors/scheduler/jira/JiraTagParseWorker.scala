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

  /** Loads the search pages from `startAt` 0 until Jira's `total` is reached. A
    * page that does not move `startAt` forward ends the load, because a server
    * that ignores `startAt` returns the same page again.
    */
  private[jira] def loadAllPages(loadPage: Int => Future[JiraSearchResult])(
      implicit executionContext: ExecutionContext): Future[Set[JiraIssue]] = {
    def loadFrom(startAt: Int, loaded: Set[JiraIssue]): Future[Set[JiraIssue]] =
      loadPage(startAt).flatMap { page =>
        val issues      = loaded ++ page.issues
        val nextStartAt = page.startAt + page.issues.size
        if (nextStartAt <= startAt || nextStartAt >= page.total)
          Future.successful(issues)
        else loadFrom(nextStartAt, issues)
      }

    loadFrom(startAt = 0, loaded = Set.empty)
  }
}

class JiraTagParseWorker(wsClient: WSClient,
                         protected val systemServices: SystemServices,
                         config: ServiceConfiguration,
                         settings: JiraSettings,
                         projectSettings: JiraProjectSettings,
                         private implicit val auth: ServiceAuthentication,
                         protected val configId: IssueImporterConfigId,
                         protected val organisationId: OrganisationId,
                         protected val projectId: ProjectId)
    extends TagParseWorker[JiraIssueTag] {

  import JiraTagParseWorker.loadAllPages

  private val apiService = new JiraApiServiceImpl(wsClient, config)
  private val maxResults = projectSettings.maxResults.getOrElse(100)
  private val jql        = projectSettings.jql.getOrElse(
    s"project=${projectSettings.jiraProjectKey} and resolution=Unresolved ORDER BY created DESC")

  override protected val externalProjectId: String =
    projectSettings.jiraProjectKey
  override protected val projectName: String =
    projectSettings.externalProjectName.getOrElse(
      s"Jira Project ${projectSettings.jiraProjectKey}")
  override protected val checkFrequency: FiniteDuration =
    settings.checkFrequency.milliseconds

  override protected def loadTags(): Future[Set[JiraIssueTag]] =
    loadAllPages { startAt =>
      apiService.findIssues(jql,
                            Some(startAt),
                            Some(maxResults),
                            fields = Some("summary"))
    }.map(_.map(toJiraIssueTag))

  private def toJiraIssueTag(issue: JiraIssue): JiraIssueTag =
    JiraIssueTag(TagId(issue.key),
                 config.baseUrl,
                 issue.fields.flatMap(_.primary.summary),
                 issue.self,
                 projectSettings.jiraProjectKey)
}
