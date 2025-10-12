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

package services

import actors.scheduler.{
  OAuthAuthentication,
  ServiceConfiguration,
  WebServiceHelper
}
import models._
import play.api.libs.json.JsArray
import play.api.libs.ws.WSClient

import scala.concurrent.{ExecutionContext, Future}

/** Service for Jira API interactions.
  */
class JiraProjectService(wsClient: WSClient)(implicit ec: ExecutionContext)
    extends ExternalProjectService {

  override def testConnectivity(
      config: CreateIssueImporterConfig): Future[ConnectivityTestResult] = {
    implicit val auth: OAuthAuthentication = OAuthAuthentication(
      consumerKey = config.consumerKey.get,
      privateKey = config.privateKey.get,
      token = config.accessToken.get,
      tokenSecret = "" // Empty for initial test
    )

    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val testUrl       = serviceConfig.baseUrl + "/rest/api/2/myself"

    handleConnectivityErrors("Jira") {
      WebServiceHelper
        .callWithOAuth(wsClient, serviceConfig, testUrl, auth)
        .map {
          case scala.util.Success((_, _)) =>
            successResult("Jira")
          case scala.util.Failure(e) if e.getMessage.contains("401") =>
            authenticationFailedResult("OAuth credentials")
          case scala.util.Failure(e) =>
            ConnectivityTestResult(
              success = false,
              message = s"Connection failed: ${e.getMessage}",
              errorCode = Some("connection_failed")
            )
        }
    }
  }

  override def listProjects(
      config: IssueImporterConfig): Future[ListProjectsResponse] = {
    config match {
      case c: JiraConfig =>
        listJiraProjects(c).map { projects =>
          ListProjectsResponse(projects = Some(projects))
        }
      case _ =>
        Future.failed(
          new IllegalArgumentException(
            "JiraProjectService requires JiraConfig"))
    }
  }

  private def listJiraProjects(
      config: JiraConfig): Future[Seq[ExternalProject]] = {
    implicit val auth: OAuthAuthentication = OAuthAuthentication(
      consumerKey = config.auth.consumerKey,
      privateKey = config.auth.privateKey,
      token = config.auth.accessToken,
      tokenSecret = ""
    )

    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)

    // Jira uses offset-based pagination (startAt parameter)
    def fetchPage(startAt: Int, accumulated: Seq[ExternalProject] = Seq.empty)
        : Future[Seq[ExternalProject]] = {
      val projectsUrl =
        serviceConfig.baseUrl + s"/rest/api/2/project?startAt=$startAt&maxResults=100"

      WebServiceHelper
        .callWithOAuth(wsClient, serviceConfig, projectsUrl, auth)
        .flatMap {
          case scala.util.Success((response, _)) =>
            // Jira returns an array of projects
            val projectsArray = response.as[JsArray].value
            val projects      = projectsArray.map { project =>
              val key  = (project \ "key").as[String]
              val name = (project \ "name").as[String]
              ExternalProject(key, name)
            }
            val allProjects = accumulated ++ projects

            // If we got 100 results, there might be more
            if (projects.size == 100) {
              fetchPage(startAt + 100, allProjects)
            } else {
              Future.successful(allProjects)
            }

          case scala.util.Failure(e) =>
            throw new Exception(
              s"Failed to fetch Jira projects: ${e.getMessage}")
        }
    }

    fetchPage(0)
  }
}
