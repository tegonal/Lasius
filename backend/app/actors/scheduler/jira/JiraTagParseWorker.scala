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

import scala.concurrent.Future
import scala.concurrent.duration._

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
    loadIssues(startAt = 0).map(_.map(toJiraIssueTag))

  /** Pages through the search result with startAt until Jira's total is
    * reached.
    */
  private def loadIssues(
      startAt: Int,
      loaded: Set[JiraIssue] = Set.empty): Future[Set[JiraIssue]] =
    apiService
      .findIssues(jql,
                  Some(startAt),
                  Some(maxResults),
                  fields = Some("summary"))
      .flatMap { result =>
        val all         = loaded ++ result.issues
        val nextStartAt = result.startAt + result.issues.size
        if (result.issues.isEmpty || nextStartAt >= result.total)
          Future.successful(all)
        else loadIssues(nextStartAt, all)
      }

  private def toJiraIssueTag(issue: JiraIssue): JiraIssueTag =
    JiraIssueTag(TagId(issue.key),
                 config.baseUrl,
                 issue.fields.flatMap(_.primary.summary),
                 issue.self,
                 projectSettings.jiraProjectKey)
}
