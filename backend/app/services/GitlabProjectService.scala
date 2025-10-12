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

import actors.scheduler.{OAuth2Authentication, ServiceConfiguration}
import models._
import play.api.libs.json.JsArray
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

/** Service for GitLab API interactions.
  */
class GitlabProjectService(wsClient: WSClient)(implicit ec: ExecutionContext)
    extends ExternalProjectService {

  override def testConnectivity(
      config: CreateIssueImporterConfig): Future[ConnectivityTestResult] = {
    handleConnectivityErrors("GitLab") {
      implicit val auth: OAuth2Authentication =
        OAuth2Authentication(config.accessToken.get)

      val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
      val testUrl       = serviceConfig.baseUrl + "/api/v4/user"

      wsClient
        .url(testUrl)
        .addHttpHeaders("PRIVATE-TOKEN" -> config.accessToken.get)
        .withRequestTimeout(ConnectivityTestTimeout)
        .get()
        .map { response =>
          response.status match {
            case 200    => successResult("GitLab")
            case 401    => authenticationFailedResult("access token")
            case status => connectionFailedResult(status, response.statusText)
          }
        }
    }
  }

  override def listProjects(
      config: IssueImporterConfig): Future[ListProjectsResponse] = {
    config match {
      case c: GitlabConfig =>
        listGitlabProjects(c).map { projects =>
          ListProjectsResponse(projects = Some(projects))
        }
      case _ =>
        Future.failed(
          new IllegalArgumentException(
            "GitlabProjectService requires GitlabConfig"))
    }
  }

  private def listGitlabProjects(
      config: GitlabConfig): Future[Seq[ExternalProject]] = {
    // GitLab uses Link headers for pagination (RFC 5988)
    // We'll fetch all pages recursively
    def fetchPage(url: String, accumulated: Seq[ExternalProject] = Seq.empty)
        : Future[Seq[ExternalProject]] = {
      wsClient
        .url(url)
        .addHttpHeaders("PRIVATE-TOKEN" -> config.auth.accessToken)
        .withRequestTimeout(ProjectListTimeout)
        .get()
        .flatMap { response =>
          response.status match {
            case 200 =>
              val projects = (response.json.as[JsArray].value).map { project =>
                val id   = (project \ "id").as[Long].toString
                val name = (project \ "name").as[String]
                ExternalProject(id, name)
              }
              val allProjects = accumulated ++ projects

              // Check for next page in Link header
              response.header("Link") match {
                case Some(linkHeader) =>
                  // Parse Link header: <url>; rel="next"
                  val nextPageRegex = """<([^>]+)>;\s*rel="next"""".r
                  nextPageRegex.findFirstMatchIn(linkHeader) match {
                    case Some(m) =>
                      val nextUrl = m.group(1)
                      fetchPage(nextUrl, allProjects)
                    case None =>
                      Future.successful(allProjects)
                  }
                case None =>
                  Future.successful(allProjects)
              }

            case _ =>
              throw new Exception(
                s"Failed to fetch GitLab projects: HTTP ${response.status}")
          }
        }
    }

    val initialUrl =
      config.baseUrl.toString + "/api/v4/projects?membership=true&archived=false&per_page=100"
    fetchPage(initialUrl)
  }
}
