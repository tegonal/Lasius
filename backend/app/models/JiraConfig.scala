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

import models.BaseFormat._
import play.api.libs.json._
import org.joda.time.DateTime

import java.net.URL

case class JiraSettings(checkFrequency: Long)

case class JiraProjectSettings(
    jiraProjectKey: String,
    externalProjectName: Option[String] = None,
    maxResults: Option[Int] = None,
    jql: Option[String] = None
)

case class JiraProjectMapping(
    projectId: ProjectId,
    settings: JiraProjectSettings
)

case class JiraAuth(
    consumerKey: String,
    privateKey: String,
    accessToken: String
)

case class JiraConfig(
    id: IssueImporterConfigId,
    organisationReference: OrganisationId.OrganisationReference,
    importerType: ImporterType = ImporterType.Jira,
    name: String,
    baseUrl: URL,
    auth: JiraAuth,
    settings: JiraSettings,
    projects: Seq[JiraProjectMapping],
    syncStatus: ConfigSyncStatus = ConfigSyncStatus.empty,
    audit: AuditInfo,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[JiraConfig].getSimpleName
) extends IssueImporterConfig {
  val checkFrequency: Long     = settings.checkFrequency
  val canListProjects: Boolean = true
}

object JiraProjectMapping {
  implicit val mappingFormat: Format[JiraProjectMapping] =
    Json.format[JiraProjectMapping]
}

object JiraSettings {
  implicit val jiraSettingsFormat: Format[JiraSettings] =
    Json.format[JiraSettings]
}

object JiraAuth {
  implicit val jiraAuthFormat: Format[JiraAuth] = Json.format[JiraAuth]
}

object JiraProjectSettings {
  implicit val settingsFormat: Format[JiraProjectSettings] =
    Json.format[JiraProjectSettings]
}

object JiraConfig {
  implicit val jiraConfigFormat: Format[JiraConfig] = Json.format[JiraConfig]
}
