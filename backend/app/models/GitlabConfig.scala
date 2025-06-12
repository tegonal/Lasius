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
import models.OrganisationId.OrganisationReference
import play.api.libs.json._
import reactivemongo.api.bson.BSONObjectID

import java.net.URL

case class GitlabConfigId(value: BSONObjectID = BSONObjectID.generate())
    extends BaseBSONObjectId

case class GitlabSettings(checkFrequency: Long)

case class GitlabTagConfiguration(useLabels: Boolean,
                                  labelFilter: Set[String],
                                  useMilestone: Boolean = false,
                                  useTitle: Boolean = false)

case class GitlabProjectSettings(gitlabProjectId: String,
                                 maxResults: Option[Int] = None,
                                 params: Option[String] = None,
                                 projectKeyPrefix: Option[String] = None,
                                 tagConfiguration: GitlabTagConfiguration)

case class GitlabProjectMapping(projectId: ProjectId,
                                settings: GitlabProjectSettings)

case class GitlabAuth(accessToken: String)

case class GitlabConfig(id: GitlabConfigId,
                        organisationReference: OrganisationReference,
                        name: String,
                        baseUrl: URL,
                        auth: GitlabAuth,
                        settings: GitlabSettings,
                        projects: Seq[GitlabProjectMapping])
    extends BaseEntity[GitlabConfigId]

case class GitlabConfigCreate(name: String,
                              baseUrl: URL,
                              auth: GitlabAuth,
                              settings: GitlabSettings) {
  def buildConfig(organisationReference: OrganisationReference): GitlabConfig =
    GitlabConfig(
      id = GitlabConfigId(),
      organisationReference = organisationReference,
      name = name,
      baseUrl = baseUrl,
      auth = auth,
      settings = settings,
      projects = Seq()
    )
}

case class GitlabConfigUpdate(id: GitlabConfigId,
                              name: Option[String],
                              baseUrl: Option[URL],
                              auth: Option[GitlabAuth],
                              settings: Option[GitlabSettings])
    extends BaseEntity[GitlabConfigId]

object GitlabConfigId {
  implicit val idFormat: Format[GitlabConfigId] =
    BaseFormat.idformat[GitlabConfigId](GitlabConfigId.apply)
}

object GitlabProjectMapping {
  implicit val mappingFormat: Format[GitlabProjectMapping] =
    Json.format[GitlabProjectMapping]
}

object GitlabSettings {
  implicit val gitlabSettingsFormat: Format[GitlabSettings] =
    Json.format[GitlabSettings]
}

object GitlabAuth {
  implicit val gitlabAuthFormat: Format[GitlabAuth] = Json.format[GitlabAuth]
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
  implicit val gitlabConfigFormat: Format[GitlabConfig] =
    Json.format[GitlabConfig]
}

object GitlabConfigCreate {
  implicit val gitlabConfigCreateFormat: Format[GitlabConfigCreate] =
    Json.format[GitlabConfigCreate]
}

object GitlabConfigUpdate {
  implicit val gitlabConfigUpdateFormat: Format[GitlabConfigUpdate] =
    Json.format[GitlabConfigUpdate]
}
