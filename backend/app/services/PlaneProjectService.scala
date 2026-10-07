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

import actors.scheduler.plane.{PlaneApiService, PlaneApiServiceImpl}
import actors.scheduler.{
  ApiKeyAuthentication,
  ServiceAuthentication,
  ServiceConfiguration
}
import models._
import play.api.libs.ws.WSClient

import scala.concurrent.{ExecutionContext, Future}

/** Service for Plane API interactions.
  */
class PlaneProjectService(wsClient: WSClient)(implicit ec: ExecutionContext)
    extends ExternalProjectService {

  // Plane answers at most 100 items per page.
  private val PageSize = 100

  override def testConnectivity(
      config: CreateIssueImporterConfig): Future[ConnectivityTestResult] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val testUrl       = serviceConfig.baseUrl + "/api/v1/users/me/"

    handleConnectivityErrors("Plane") {
      wsClient
        .url(testUrl)
        .addHttpHeaders("X-API-Key" -> config.apiKey.get)
        .withRequestTimeout(ConnectivityTestTimeout)
        .get()
        .map { response =>
          response.status match {
            case 200       => successResult("Plane")
            case 401 | 403 => authenticationFailedResult("API key")
            case status => connectionFailedResult(status, response.statusText)
          }
        }
    }
  }

  override def listProjects(
      config: IssueImporterConfig): Future[ListProjectsResponse] =
    withPlaneApi(config) { (api, workspace, auth) =>
      // Plane configs have one workspace per config (stored at config level)
      api
        .getProjects(PageSize, workspace)(auth, ec)
        .map(projects =>
          ListProjectsResponse(projects = Some(
            projects.map(p => ExternalProject(p.id, p.name)).sortBy(_.name))))
    }

  override def getProjectMetadata(
      config: IssueImporterConfig,
      externalProjectId: String): Future[ExternalProjectMetadata] =
    withPlaneApi(config) { (api, workspace, auth) =>
      for {
        projectId <- validateExternalProjectId(externalProjectId,
                                               "[0-9a-fA-F-]+".r)
        labelsF = api.getLabels(PageSize, workspace, projectId)(auth, ec)
        statesF = api.getStates(PageSize, workspace, projectId)(auth, ec)
        labels <- labelsF
        states <- statesF
      } yield ExternalProjectMetadata(labels.toSeq.map(_.name).sorted,
                                      states.toSeq.map(_.name).sorted)
    }

  private def withPlaneApi[T](config: IssueImporterConfig)(
      f: (PlaneApiService, String, ServiceAuthentication) => Future[T])
      : Future[T] =
    config match {
      case c: PlaneConfig =>
        f(
          new PlaneApiServiceImpl(
            wsClient,
            ServiceConfiguration(c.baseUrl.toString),
            requestTimeout = Some(ProjectListTimeout),
            // The browser request closes before a wait for
            // the rate limit ends. The user retries instead.
            maxRateLimitRetries = 0
          ),
          c.settings.workspace,
          ApiKeyAuthentication(c.auth.apiKey)
        )
      case _ =>
        Future.failed(
          new IllegalArgumentException(
            "PlaneProjectService requires PlaneConfig"))
    }
}
