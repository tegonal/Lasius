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

case class PlaneSettings(checkFrequency: Long)

case class PlaneTagConfiguration(
    useLabels: Boolean,
    labelFilter: Set[String],
    useMilestone: Boolean = false,
    useTitle: Boolean = false,
    includeOnlyIssuesWithLabels: Set[String] = Set(),
    includeOnlyIssuesWithState: Set[String] = Set()
)

case class PlaneProjectSettings(
    planeWorkspace: String,
    planeProjectId: String,
    maxResults: Option[Int] = None,
    params: Option[String] = None,
    tagConfiguration: PlaneTagConfiguration
)

case class PlaneProjectMapping(
    projectId: ProjectId,
    settings: PlaneProjectSettings
)

case class PlaneAuth(apiKey: String)

case class PlaneConfig(
    id: IssueImporterConfigId,
    organisationReference: OrganisationId.OrganisationReference,
    importerType: ImporterType = ImporterType.Plane,
    name: String,
    baseUrl: URL,
    auth: PlaneAuth,
    settings: PlaneSettings,
    projects: Seq[PlaneProjectMapping],
    syncStatus: ConfigSyncStatus = ConfigSyncStatus.empty,
    audit: AuditInfo,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[PlaneConfig].getSimpleName
) extends IssueImporterConfig {
  val checkFrequency: Long     = settings.checkFrequency
  val canListProjects: Boolean = true
}

object PlaneProjectMapping {
  implicit val mappingFormat: Format[PlaneProjectMapping] =
    Json.format[PlaneProjectMapping]
}

object PlaneSettings {
  implicit val PlaneSettingsFormat: Format[PlaneSettings] =
    Json.format[PlaneSettings]
}

object PlaneAuth {
  implicit val PlaneAuthFormat: Format[PlaneAuth] = Json.format[PlaneAuth]
}

object PlaneTagConfiguration {
  implicit val tagConfigFormat: Format[PlaneTagConfiguration] =
    Json.format[PlaneTagConfiguration]
}

object PlaneProjectSettings {
  implicit val settingsFormat: Format[PlaneProjectSettings] =
    Json.format[PlaneProjectSettings]
}

object PlaneConfig {
  implicit val PlaneConfigFormat: Format[PlaneConfig] =
    Json.format[PlaneConfig]
}
