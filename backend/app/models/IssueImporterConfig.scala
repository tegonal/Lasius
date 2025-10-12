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

package models

import models.OrganisationId.OrganisationReference
import play.api.libs.json._

import java.net.URL

/** Base trait for all issue importer configurations.
  *
  * Design note: This uses a unified approach with type discrimination,
  * diverging from the Invitation pattern (which uses separate endpoints per
  * type). This is intentional because:
  *   1. All importer types are created in the same context (organization)
  *   2. Type is configuration data, not a different resource paradigm
  *   3. Makes adding new types (GitHub, BitBucket) trivial - just add to
  *      ImporterType enum
  */
trait IssueImporterConfig extends BaseEntity[IssueImporterConfigId] {
  val id: IssueImporterConfigId
  def organisationReference: OrganisationReference
  def importerType: ImporterType
  def name: String
  def baseUrl: URL
  def checkFrequency: Long
  def syncStatus: ConfigSyncStatus
}

object IssueImporterConfig {
  implicit val writes: Writes[IssueImporterConfig] = Writes {
    case config: GitlabConfig =>
      Json.toJson(config)(GitlabConfig.GitlabConfigFormat)
    case config: JiraConfig  => Json.toJson(config)(JiraConfig.jiraConfigFormat)
    case config: PlaneConfig =>
      Json.toJson(config)(PlaneConfig.PlaneConfigFormat)
    case config: GithubConfig =>
      Json.toJson(config)(GithubConfig.githubConfigFormat)
  }

  implicit val reads: Reads[IssueImporterConfig] = Reads { json =>
    (json \ "importerType").asOpt[ImporterType] match {
      case Some(ImporterType.Gitlab) =>
        json.validate[GitlabConfig](GitlabConfig.GitlabConfigFormat)
      case Some(ImporterType.Jira) =>
        json.validate[JiraConfig](JiraConfig.jiraConfigFormat)
      case Some(ImporterType.Plane) =>
        json.validate[PlaneConfig](PlaneConfig.PlaneConfigFormat)
      case Some(ImporterType.Github) =>
        json.validate[GithubConfig](GithubConfig.githubConfigFormat)
      case None => JsError("Missing or invalid importerType field")
    }
  }

  implicit val format: Format[IssueImporterConfig] =
    Format(reads, writes)
}
