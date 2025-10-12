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

import actors.scheduler.ServiceConfiguration
import models._
import play.api.libs.json.JsArray
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

/** Service for Plane API interactions.
  */
class PlaneProjectService(wsClient: WSClient)(implicit ec: ExecutionContext)
    extends ExternalProjectService {

  override def testConnectivity(
      config: CreateIssueImporterConfig): Future[ConnectivityTestResult] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val testUrl       = serviceConfig.baseUrl + "/api/users/me/"

    handleConnectivityErrors("Plane") {
      wsClient
        .url(testUrl)
        .addHttpHeaders("x-api-key" -> config.apiKey.get)
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
      config: IssueImporterConfig): Future[ListProjectsResponse] = {
    config match {
      case c: PlaneConfig =>
        listPlaneWorkspacesAndProjects(c).map { workspaces =>
          ListProjectsResponse(workspaces = Some(workspaces))
        }
      case _ =>
        Future.failed(
          new IllegalArgumentException(
            "PlaneProjectService requires PlaneConfig"))
    }
  }

  private def listPlaneWorkspacesAndProjects(
      config: PlaneConfig): Future[Seq[ExternalWorkspace]] = {
    // Plane API uses cursor-based pagination with 'next' and 'previous' URLs
    def fetchWorkspaces(url: String,
                        accumulated: Seq[(String, String)] = Seq.empty)
        : Future[Seq[(String, String)]] = {
      wsClient
        .url(url)
        .addHttpHeaders("x-api-key" -> config.auth.apiKey)
        .withRequestTimeout(ProjectListTimeout)
        .get()
        .flatMap { response =>
          response.status match {
            case 200 =>
              val json    = response.json
              val results =
                (json \ "results").asOpt[JsArray].getOrElse(json.as[JsArray])
              val workspaces = results.value.map { workspace =>
                val slug = (workspace \ "slug").as[String]
                val name = (workspace \ "name").as[String]
                (slug, name)
              }
              val allWorkspaces = accumulated ++ workspaces

              // Check for next page
              (json \ "next").asOpt[String] match {
                case Some(nextUrl) if nextUrl.nonEmpty =>
                  fetchWorkspaces(nextUrl, allWorkspaces)
                case _ =>
                  Future.successful(allWorkspaces)
              }

            case _ =>
              throw new Exception(
                s"Failed to fetch Plane workspaces: HTTP ${response.status}")
          }
        }
    }

    def fetchProjectsForWorkspace(
        slug: String): Future[Seq[ExternalProject]] = {
      def fetchProjectsPage(url: String,
                            accumulated: Seq[ExternalProject] = Seq.empty)
          : Future[Seq[ExternalProject]] = {
        wsClient
          .url(url)
          .addHttpHeaders("x-api-key" -> config.auth.apiKey)
          .withRequestTimeout(ProjectListTimeout)
          .get()
          .flatMap { response =>
            response.status match {
              case 200 =>
                val json    = response.json
                val results =
                  (json \ "results").asOpt[JsArray].getOrElse(json.as[JsArray])
                val projects = results.value.map { project =>
                  val id          = (project \ "id").as[String]
                  val projectName = (project \ "name").as[String]
                  ExternalProject(id, projectName)
                }
                val allProjects = accumulated ++ projects

                // Check for next page
                (json \ "next").asOpt[String] match {
                  case Some(nextUrl) if nextUrl.nonEmpty =>
                    fetchProjectsPage(nextUrl, allProjects)
                  case _ =>
                    Future.successful(allProjects)
                }

              case _ =>
                // Return empty projects on error
                Future.successful(Seq.empty)
            }
          }
      }

      val projectsUrl =
        config.baseUrl.toString + s"/api/v1/workspaces/$slug/projects/"
      fetchProjectsPage(projectsUrl)
    }

    // First, fetch all workspaces
    val workspacesUrl = config.baseUrl.toString + "/api/v1/workspaces/"
    fetchWorkspaces(workspacesUrl).flatMap { workspaces =>
      // For each workspace, fetch all its projects
      val workspaceFutures = workspaces.map { case (slug, name) =>
        fetchProjectsForWorkspace(slug).map { projects =>
          ExternalWorkspace(slug, name, projects)
        }
      }

      Future.sequence(workspaceFutures)
    }
  }
}
