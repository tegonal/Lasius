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
import java.net.URL

// ===== GitLab DTOs =====

case class CreateGitlabConfig(
    name: String,
    baseUrl: URL,
    accessToken: String,
    checkFrequency: Long,
    projects: Seq[GitlabProjectMapping] = Seq.empty
)

object CreateGitlabConfig {
  implicit val format: Format[CreateGitlabConfig] =
    Json.format[CreateGitlabConfig]
}

case class UpdateGitlabConfig(
    name: Option[String],
    baseUrl: Option[URL],
    accessToken: Option[String],
    checkFrequency: Option[Long],
    projects: Option[Seq[GitlabProjectMapping]]
)

object UpdateGitlabConfig {
  implicit val format: Format[UpdateGitlabConfig] =
    Json.format[UpdateGitlabConfig]
}

// ===== Jira DTOs =====

case class CreateJiraConfig(
    name: String,
    baseUrl: URL,
    consumerKey: String,
    privateKey: String,
    accessToken: String,
    checkFrequency: Long,
    projects: Seq[JiraProjectMapping] = Seq.empty
)

object CreateJiraConfig {
  implicit val format: Format[CreateJiraConfig] = Json.format[CreateJiraConfig]
}

case class UpdateJiraConfig(
    name: Option[String],
    baseUrl: Option[URL],
    consumerKey: Option[String],
    privateKey: Option[String],
    accessToken: Option[String],
    checkFrequency: Option[Long],
    projects: Option[Seq[JiraProjectMapping]]
)

object UpdateJiraConfig {
  implicit val format: Format[UpdateJiraConfig] = Json.format[UpdateJiraConfig]
}

// ===== Plane DTOs =====

case class CreatePlaneConfig(
    name: String,
    baseUrl: URL,
    apiKey: String,
    checkFrequency: Long,
    projects: Seq[PlaneProjectMapping] = Seq.empty
)

object CreatePlaneConfig {
  implicit val format: Format[CreatePlaneConfig] =
    Json.format[CreatePlaneConfig]
}

case class UpdatePlaneConfig(
    name: Option[String],
    baseUrl: Option[URL],
    apiKey: Option[String],
    checkFrequency: Option[Long],
    projects: Option[Seq[PlaneProjectMapping]]
)

object UpdatePlaneConfig {
  implicit val format: Format[UpdatePlaneConfig] =
    Json.format[UpdatePlaneConfig]
}

// ===== Unified Response DTO =====

sealed trait IssueImporterConfigResponse {
  def name: String
  def importerType: String
  def baseUrl: URL
  def checkFrequency: Long
  def projectCount: Int
}

case class GitlabConfigResponse(
    id: GitlabConfigId,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[GitlabProjectMapping]
) extends IssueImporterConfigResponse {
  val importerType: String = "gitlab"
  val projectCount: Int = projects.size
}

object GitlabConfigResponse {
  implicit val format: Format[GitlabConfigResponse] =
    Json.format[GitlabConfigResponse]

  def fromConfig(config: GitlabConfig): GitlabConfigResponse = {
    GitlabConfigResponse(
      id = config._id,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects
    )
  }
}

case class JiraConfigResponse(
    id: JiraConfigId,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[JiraProjectMapping]
) extends IssueImporterConfigResponse {
  val importerType: String = "jira"
  val projectCount: Int = projects.size
}

object JiraConfigResponse {
  implicit val format: Format[JiraConfigResponse] =
    Json.format[JiraConfigResponse]

  def fromConfig(config: JiraConfig): JiraConfigResponse = {
    JiraConfigResponse(
      id = config._id,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects
    )
  }
}

case class PlaneConfigResponse(
    id: PlaneConfigId,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[PlaneProjectMapping]
) extends IssueImporterConfigResponse {
  val importerType: String = "plane"
  val projectCount: Int = projects.size
}

object PlaneConfigResponse {
  implicit val format: Format[PlaneConfigResponse] =
    Json.format[PlaneConfigResponse]

  def fromConfig(config: PlaneConfig): PlaneConfigResponse = {
    PlaneConfigResponse(
      id = config._id,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects
    )
  }
}
