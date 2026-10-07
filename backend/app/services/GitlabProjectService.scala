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

import scala.concurrent.{ExecutionContext, Future}

/** Service for GitLab API interactions.
  */
class GitlabProjectService(wsClient: WSClient)(implicit ec: ExecutionContext)
    extends ExternalProjectService {

  // GitLab issue states are fixed, unlike the labels of a project.
  private val GitlabStates = Seq("opened", "closed", "all")

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
      config: IssueImporterConfig): Future[ListProjectsResponse] =
    withGitlabConfig(config) { c =>
      fetchAllLinkPages(
        wsClient,
        c.baseUrl.toString + "/api/v4/projects?membership=true&archived=false&per_page=100",
        authHeader(c)
      )(_.as[JsArray].value.toSeq.map { project =>
        ExternalProject((project \ "id").as[Long].toString,
                        (project \ "name").as[String])
      }).map(projects =>
        ListProjectsResponse(projects = Some(projects.sortBy(_.name))))
    }

  override def getProjectMetadata(
      config: IssueImporterConfig,
      externalProjectId: String): Future[ExternalProjectMetadata] =
    withGitlabConfig(config) { c =>
      for {
        projectId <- validateExternalProjectId(externalProjectId, "\\d+".r)
        labels    <- fetchAllLinkPages(
          wsClient,
          s"${c.baseUrl}/api/v4/projects/$projectId/labels?per_page=100",
          authHeader(c))(_.as[JsArray].value.toSeq.map(label =>
          (label \ "name").as[String]))
      } yield ExternalProjectMetadata(labels.sorted, GitlabStates)
    }

  private def authHeader(config: GitlabConfig): (String, String) =
    "PRIVATE-TOKEN" -> config.auth.accessToken

  private def withGitlabConfig[T](config: IssueImporterConfig)(
      f: GitlabConfig => Future[T]): Future[T] =
    config match {
      case c: GitlabConfig => f(c)
      case _               =>
        Future.failed(
          new IllegalArgumentException(
            "GitlabProjectService requires GitlabConfig"))
    }
}
