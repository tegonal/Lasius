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

case class GithubSettings(checkFrequency: Long)

case class GithubTagConfiguration(
    useLabels: Boolean,
    labelFilter: Set[String] = Set(),
    useMilestone: Boolean = false,
    useTitle: Boolean = false,
    useAssignees: Boolean = false,
    includeOnlyIssuesWithLabels: Set[String] = Set(),
    includeOnlyIssuesWithState: Set[String] = Set("open")
)

case class GithubProjectSettings(
    githubRepoOwner: String,
    githubRepoName: String,
    externalProjectName: Option[String] = None,
    maxResults: Option[Int] = None,
    params: Option[String] = None,
    projectKeyPrefix: Option[String] = None,
    tagConfiguration: GithubTagConfiguration
)

case class GithubProjectMapping(
    projectId: ProjectId,
    settings: GithubProjectSettings
)

case class GithubAuth(
    accessToken: String,
    resourceOwner: Option[String] = None,    // Login name (user or org)
    resourceOwnerType: Option[String] = None // "User" or "Organization"
)

case class GithubConfig(
    id: IssueImporterConfigId,
    organisationReference: OrganisationId.OrganisationReference,
    importerType: ImporterType = ImporterType.Github,
    name: String,
    baseUrl: URL,
    auth: GithubAuth,
    settings: GithubSettings,
    projects: Seq[GithubProjectMapping],
    syncStatus: ConfigSyncStatus = ConfigSyncStatus.empty,
    audit: AuditInfo,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[GithubConfig].getSimpleName
) extends IssueImporterConfig {
  val checkFrequency: Long     = settings.checkFrequency
  val canListProjects: Boolean = true
}

object GithubProjectMapping {
  implicit val mappingFormat: Format[GithubProjectMapping] =
    Json.format[GithubProjectMapping]
}

object GithubSettings {
  implicit val githubSettingsFormat: Format[GithubSettings] =
    Json.format[GithubSettings]
}

object GithubAuth {
  implicit val githubAuthFormat: Format[GithubAuth] = Json.format[GithubAuth]
}

object GithubTagConfiguration {
  implicit val tagConfigFormat: Format[GithubTagConfiguration] =
    Json.format[GithubTagConfiguration]
}

object GithubProjectSettings {
  implicit val settingsFormat: Format[GithubProjectSettings] =
    Json.format[GithubProjectSettings]
}

object GithubConfig {
  implicit val githubConfigFormat: Format[GithubConfig] =
    Json.format[GithubConfig]
}
