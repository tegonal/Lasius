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

case class GitlabSettings(checkFrequency: Long)

case class GitlabTagConfiguration(
    useLabels: Boolean,
    labelFilter: Set[String],
    useMilestone: Boolean = false,
    useTitle: Boolean = false,
    includeOnlyIssuesWithLabels: Set[String] = Set(),
    includeOnlyIssuesWithState: Set[String] = Set()
)

case class GitlabProjectSettings(
    gitlabProjectId: String,
    externalProjectName: Option[String] = None,
    maxResults: Option[Int] = None,
    params: Option[String] = None,
    projectKeyPrefix: Option[String] = None,
    tagConfiguration: GitlabTagConfiguration
)

case class GitlabProjectMapping(
    projectId: ProjectId,
    settings: GitlabProjectSettings
)

case class GitlabAuth(accessToken: String)

case class GitlabConfig(
    id: IssueImporterConfigId,
    organisationReference: OrganisationId.OrganisationReference,
    importerType: ImporterType = ImporterType.Gitlab,
    name: String,
    baseUrl: URL,
    auth: GitlabAuth,
    settings: GitlabSettings,
    projects: Seq[GitlabProjectMapping],
    syncStatus: ConfigSyncStatus = ConfigSyncStatus.empty,
    audit: AuditInfo,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[GitlabConfig].getSimpleName
) extends IssueImporterConfig {
  val checkFrequency: Long     = settings.checkFrequency
  val canListProjects: Boolean = true
}

object GitlabProjectMapping {
  implicit val mappingFormat: Format[GitlabProjectMapping] =
    Json.format[GitlabProjectMapping]
}

object GitlabSettings {
  implicit val GitlabSettingsFormat: Format[GitlabSettings] =
    Json.format[GitlabSettings]
}

object GitlabAuth {
  implicit val GitlabAuthFormat: Format[GitlabAuth] = Json.format[GitlabAuth]
}

object GitlabTagConfiguration {
  implicit val tagConfigFormat: Format[GitlabTagConfiguration] =
    Json.format[GitlabTagConfiguration]
}

object GitlabProjectSettings {
  implicit val settingsFormat: Format[GitlabProjectSettings] =
    Json.format[GitlabProjectSettings]
}

object GitlabConfig {
  implicit val GitlabConfigFormat: Format[GitlabConfig] =
    Json.format[GitlabConfig]
}
