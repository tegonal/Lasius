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

package controllers.errors

import models._
import play.api.libs.json.{JsObject, Json}

/** Centralized error response builders for IssueImporterConfig operations.
  * Eliminates magic JSON strings and ensures consistent error format.
  */
object ConfigErrorResponses {

  /** Config not found error (404). */
  def configNotFound(configId: IssueImporterConfigId): String = {
    Json.stringify(
      Json.obj(
        "error"    -> "config_not_found",
        "message"  -> "No configuration found with the provided ID",
        "configId" -> configId.value.toString
      ))
  }

  /** Config not found for project (404). */
  def configNotFoundForProject(projectId: ProjectId): JsObject = {
    Json.obj(
      "error"     -> "config_not_found",
      "message"   -> "No importer configuration found for this project",
      "projectId" -> projectId.value.toString
    )
  }

  /** Access denied - config belongs to different organisation (403). */
  def accessDenied(configId: IssueImporterConfigId): String = {
    Json.stringify(
      Json.obj(
        "error"    -> "access_denied",
        "message"  -> "Configuration belongs to a different organisation",
        "configId" -> configId.value.toString
      ))
  }

  /** Config has project dependencies and cannot be deleted (500). */
  def hasDependencies(config: IssueImporterConfig): String = {
    val projectCount = config match {
      case c: GitlabConfig => c.projects.size
      case c: JiraConfig   => c.projects.size
      case c: PlaneConfig  => c.projects.size
      case c: GithubConfig => c.projects.size
    }

    val projectIds = config match {
      case c: GitlabConfig => c.projects.map(_.projectId.value).mkString(", ")
      case c: JiraConfig   => c.projects.map(_.projectId.value).mkString(", ")
      case c: PlaneConfig  => c.projects.map(_.projectId.value).mkString(", ")
      case c: GithubConfig => c.projects.map(_.projectId.value).mkString(", ")
    }

    Json.stringify(
      Json.obj(
        "error" -> "has_dependencies",
        "message" -> "Cannot delete configuration that still has project mappings. Remove all project mappings first.",
        "configId"     -> config.id.value.toString,
        "projectCount" -> projectCount,
        "projectIds"   -> projectIds
      ))
  }

  /** Validation failed for config creation/update. */
  def validationFailed(field: String,
                       message: String,
                       importerType: ImporterType): String = {
    Json.stringify(
      Json.obj(
        "error"        -> "validation_failed",
        "message"      -> message,
        "field"        -> field,
        "importerType" -> importerType.value
      ))
  }

  /** External service errors (connectivity, list projects, etc.). */
  object External {
    def notFound(configId: IssueImporterConfigId): JsObject = {
      Json.obj(
        "status"  -> "error",
        "message" -> s"Configuration not found: ${configId.value}",
        "error"   -> "not_found"
      )
    }

    def listProjectsFailed(e: Exception): JsObject = {
      Json.obj(
        "status"  -> "error",
        "message" -> e.getMessage,
        "error"   -> "list_projects_failed"
      )
    }

    def connectionFailed(e: Exception): JsObject = {
      Json.obj(
        "status"  -> "error",
        "message" -> e.getMessage,
        "error"   -> "connection_failed"
      )
    }
  }
}
