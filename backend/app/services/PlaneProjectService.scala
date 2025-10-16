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
      config: IssueImporterConfig): Future[ListProjectsResponse] = {
    config match {
      case c: PlaneConfig =>
        listPlaneProjects(c).map { projects =>
          // Return flat project list like GitLab/Jira (one workspace per config)
          ListProjectsResponse(projects = Some(projects))
        }
      case _ =>
        Future.failed(
          new IllegalArgumentException(
            "PlaneProjectService requires PlaneConfig"))
    }
  }

  private def listPlaneProjects(
      config: PlaneConfig): Future[Seq[ExternalProject]] = {
    // Plane configs have one workspace per config (stored at config level)
    val workspaceSlug = config.settings.workspace
    for {
      workspace <- fetchProjectsForWorkspace(config, workspaceSlug)
      // Enrich each project with available labels and states
      enrichedProjects <- Future.sequence(workspace.projects.map { project =>
        enrichProjectWithMetadata(config, workspaceSlug, project)
      })
    } yield enrichedProjects.sortBy(_.name)
  }

  private def fetchProjectsForWorkspace(
      config: PlaneConfig,
      workspaceSlug: String): Future[ExternalWorkspace] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val projectsUrl   =
      s"${serviceConfig.baseUrl}/api/v1/workspaces/$workspaceSlug/projects/"

    wsClient
      .url(projectsUrl)
      .addHttpHeaders("X-API-Key" -> config.auth.apiKey)
      .withRequestTimeout(ProjectListTimeout)
      .get()
      .map { response =>
        response.status match {
          case 200 =>
            val results  = (response.json \ "results").as[JsArray]
            val projects = results.value.map { project =>
              val id   = (project \ "id").as[String]
              val name = (project \ "name").as[String]
              ExternalProject(id, name)
            }
            ExternalWorkspace(
              id = workspaceSlug,
              name = workspaceSlug,
              projects = projects.toSeq
            )
          case _ =>
            throw new Exception(
              s"Failed to fetch Plane projects for workspace $workspaceSlug: HTTP ${response.status}")
        }
      }
  }

  private def enrichProjectWithMetadata(
      config: PlaneConfig,
      workspaceSlug: String,
      project: ExternalProject): Future[ExternalProject] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)

    // Fetch labels and states in parallel
    val labelsF = fetchProjectLabels(config, workspaceSlug, project.id)
    val statesF = fetchProjectStates(config, workspaceSlug, project.id)

    for {
      labels <- labelsF
      states <- statesF
    } yield project.copy(
      availableLabels = if (labels.nonEmpty) Some(labels) else None,
      availableStates = if (states.nonEmpty) Some(states) else None
    )
  }

  private def fetchProjectLabels(config: PlaneConfig,
                                 workspaceSlug: String,
                                 projectId: String): Future[Seq[String]] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val labelsUrl     =
      s"${serviceConfig.baseUrl}/api/v1/workspaces/$workspaceSlug/projects/$projectId/labels/"

    wsClient
      .url(labelsUrl)
      .addHttpHeaders("X-API-Key" -> config.auth.apiKey)
      .withRequestTimeout(ProjectListTimeout)
      .get()
      .map { response =>
        response.status match {
          case 200 =>
            // Response is wrapped in "results" like states
            val results = (response.json \ "results").as[JsArray]
            val labels  = results.value
              .map(label => (label \ "name").as[String])
              .toSeq
            play.api
              .Logger(getClass)
              .debug(
                s"Fetched ${labels.size} labels for project $projectId: ${labels.mkString(", ")}")
            labels
          case status =>
            play.api
              .Logger(getClass)
              .warn(
                s"Failed to fetch labels for project $projectId: HTTP $status - ${response.body}")
            Seq.empty
        }
      }
      .recover { case ex =>
        play.api
          .Logger(getClass)
          .error(s"Error fetching labels for project $projectId", ex)
        Seq.empty
      }
  }

  private def fetchProjectStates(config: PlaneConfig,
                                 workspaceSlug: String,
                                 projectId: String): Future[Seq[String]] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val statesUrl     =
      s"${serviceConfig.baseUrl}/api/v1/workspaces/$workspaceSlug/projects/$projectId/states/"

    wsClient
      .url(statesUrl)
      .addHttpHeaders("X-API-Key" -> config.auth.apiKey)
      .withRequestTimeout(ProjectListTimeout)
      .get()
      .map { response =>
        response.status match {
          case 200 =>
            val results = (response.json \ "results").as[JsArray]
            results.value.map(state => (state \ "name").as[String]).toSeq
          case _ => Seq.empty // Gracefully handle failures
        }
      }
      .recover { case _ => Seq.empty } // Gracefully handle errors
  }
}
