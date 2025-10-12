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

// ===== Unified Create/Update DTOs =====

/** Unified DTO for creating issue importer configurations. Type-specific fields
  * are optional and validated based on importerType.
  *
  * Design note: This uses a unified approach with type discrimination,
  * diverging from the Invitation pattern (which uses separate endpoints per
  * type). This is intentional because:
  *   1. All importer types are created in the same context (organization)
  *   2. Type is configuration data, not a different resource paradigm
  *   3. Makes adding new types (GitHub, BitBucket) trivial
  */
case class CreateIssueImporterConfig(
    importerType: ImporterType,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    // GitLab & Plane auth
    accessToken: Option[String] = None,
    // Jira auth
    consumerKey: Option[String] = None,
    privateKey: Option[String] = None,
    // Plane auth
    apiKey: Option[String] = None,
    // GitHub-specific: resource owner for org-scoped tokens
    resourceOwner: Option[String] = None,
    resourceOwnerType: Option[String] = None // "User" or "Organization"
    // Note: GitHub uses accessToken (same as GitLab)
)

object CreateIssueImporterConfig {
  implicit val format: Format[CreateIssueImporterConfig] =
    Json.format[CreateIssueImporterConfig]
}

case class UpdateIssueImporterConfig(
    name: Option[String] = None,
    baseUrl: Option[URL] = None,
    checkFrequency: Option[Long] = None,
    // Type-specific auth (validated based on existing config type)
    accessToken: Option[String] = None,
    consumerKey: Option[String] = None,
    privateKey: Option[String] = None,
    apiKey: Option[String] = None,
    resourceOwner: Option[String] = None,    // GitHub resource owner login
    resourceOwnerType: Option[String] = None // "User" or "Organization"
)

object UpdateIssueImporterConfig {
  implicit val format: Format[UpdateIssueImporterConfig] =
    Json.format[UpdateIssueImporterConfig]
}

// ===== Project Mapping DTOs =====

/** Unified DTO for creating project mappings. Type-specific fields are
  * validated based on the parent config's importerType.
  */
case class CreateProjectMapping(
    projectId: ProjectId,
    // GitLab-specific
    gitlabProjectId: Option[String] = None,
    projectKeyPrefix: Option[String] = None,
    gitlabTagConfig: Option[GitlabTagConfiguration] = None,
    // Jira-specific
    jiraProjectKey: Option[String] = None,
    // Plane-specific
    planeProjectId: Option[String] = None,
    planeWorkspaceSlug: Option[String] = None,
    planeTagConfig: Option[PlaneTagConfiguration] = None,
    // GitHub-specific
    githubRepoOwner: Option[String] = None,
    githubRepoName: Option[String] = None,
    githubTagConfig: Option[GithubTagConfiguration] = None,
    // Common
    maxResults: Option[Int] = None,
    params: Option[String] = None
)

object CreateProjectMapping {
  implicit val format: Format[CreateProjectMapping] =
    Json.format[CreateProjectMapping]
}

case class UpdateProjectMapping(
    // GitLab-specific
    gitlabProjectId: Option[String] = None,
    projectKeyPrefix: Option[String] = None,
    gitlabTagConfig: Option[GitlabTagConfiguration] = None,
    // Jira-specific
    jiraProjectKey: Option[String] = None,
    // Plane-specific
    planeProjectId: Option[String] = None,
    planeWorkspaceSlug: Option[String] = None,
    planeTagConfig: Option[PlaneTagConfiguration] = None,
    // GitHub-specific
    githubRepoOwner: Option[String] = None,
    githubRepoName: Option[String] = None,
    githubTagConfig: Option[GithubTagConfiguration] = None,
    // Common
    maxResults: Option[Int] = None,
    params: Option[String] = None
)

object UpdateProjectMapping {
  implicit val format: Format[UpdateProjectMapping] =
    Json.format[UpdateProjectMapping]
}

// ===== Unified Response DTO =====

sealed trait IssueImporterConfigResponse {
  def id: IssueImporterConfigId
  def importerType: ImporterType
  def name: String
  def baseUrl: URL
  def checkFrequency: Long
  def projectCount: Int
  def syncStatus: ConfigSyncStatus
  def audit: AuditInfoResponse
}

object IssueImporterConfigResponse {
  import julienrf.json.derived

  private val writes: OWrites[IssueImporterConfigResponse] =
    derived.flat.owrites[IssueImporterConfigResponse](
      BaseFormat.defaultTypeFormat)

  private val reads: Reads[IssueImporterConfigResponse] =
    derived.flat.reads[IssueImporterConfigResponse](
      BaseFormat.defaultTypeFormat)

  implicit val format: Format[IssueImporterConfigResponse] =
    Format(reads, writes)
}

case class GitlabConfigResponse(
    id: IssueImporterConfigId,
    importerType: ImporterType = ImporterType.Gitlab,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[GitlabProjectMapping],
    syncStatus: ConfigSyncStatus,
    audit: AuditInfoResponse,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[GitlabConfigResponse].getSimpleName
) extends IssueImporterConfigResponse {
  val projectCount: Int = projects.size
}

object GitlabConfigResponse {
  implicit val format: Format[GitlabConfigResponse] =
    Json.format[GitlabConfigResponse]

  def fromConfig(config: GitlabConfig,
                 createdByUser: UserStub,
                 updatedByUser: UserStub): GitlabConfigResponse = {
    GitlabConfigResponse(
      id = IssueImporterConfigId(config.id.value),
      importerType = ImporterType.Gitlab,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects,
      syncStatus = config.syncStatus,
      audit = AuditInfoResponse(
        createdBy = createdByUser,
        createdAt = config.audit.createdAt,
        updatedBy = updatedByUser,
        updatedAt = config.audit.updatedAt
      )
    )
  }
}

case class JiraConfigResponse(
    id: IssueImporterConfigId,
    importerType: ImporterType = ImporterType.Jira,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[JiraProjectMapping],
    syncStatus: ConfigSyncStatus,
    audit: AuditInfoResponse,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[JiraConfigResponse].getSimpleName
) extends IssueImporterConfigResponse {
  val projectCount: Int = projects.size
}

object JiraConfigResponse {
  implicit val format: Format[JiraConfigResponse] =
    Json.format[JiraConfigResponse]

  def fromConfig(config: JiraConfig,
                 createdByUser: UserStub,
                 updatedByUser: UserStub): JiraConfigResponse = {
    JiraConfigResponse(
      id = IssueImporterConfigId(config.id.value),
      importerType = ImporterType.Jira,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects,
      syncStatus = config.syncStatus,
      audit = AuditInfoResponse(
        createdBy = createdByUser,
        createdAt = config.audit.createdAt,
        updatedBy = updatedByUser,
        updatedAt = config.audit.updatedAt
      )
    )
  }
}

case class PlaneConfigResponse(
    id: IssueImporterConfigId,
    importerType: ImporterType = ImporterType.Plane,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[PlaneProjectMapping],
    syncStatus: ConfigSyncStatus,
    audit: AuditInfoResponse,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[PlaneConfigResponse].getSimpleName
) extends IssueImporterConfigResponse {
  val projectCount: Int = projects.size
}

object PlaneConfigResponse {
  implicit val format: Format[PlaneConfigResponse] =
    Json.format[PlaneConfigResponse]

  def fromConfig(config: PlaneConfig,
                 createdByUser: UserStub,
                 updatedByUser: UserStub): PlaneConfigResponse = {
    PlaneConfigResponse(
      id = IssueImporterConfigId(config.id.value),
      importerType = ImporterType.Plane,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects,
      syncStatus = config.syncStatus,
      audit = AuditInfoResponse(
        createdBy = createdByUser,
        createdAt = config.audit.createdAt,
        updatedBy = updatedByUser,
        updatedAt = config.audit.updatedAt
      )
    )
  }
}

case class GithubConfigResponse(
    id: IssueImporterConfigId,
    importerType: ImporterType = ImporterType.Github,
    name: String,
    baseUrl: URL,
    checkFrequency: Long,
    projects: Seq[GithubProjectMapping],
    syncStatus: ConfigSyncStatus,
    audit: AuditInfoResponse,
    resourceOwner: Option[String] = None,
    resourceOwnerType: Option[String] = None, // "User" or "Organization"
    availableResourceOwners: Option[Seq[ExternalProject]] = None,
    // type attribute only needed to generate correct swagger definition
    `type`: String = classOf[GithubConfigResponse].getSimpleName
) extends IssueImporterConfigResponse {
  val projectCount: Int = projects.size
}

object GithubConfigResponse {
  implicit val format: Format[GithubConfigResponse] =
    Json.format[GithubConfigResponse]

  def fromConfig(config: GithubConfig,
                 createdByUser: UserStub,
                 updatedByUser: UserStub,
                 availableResourceOwners: Option[Seq[ExternalProject]] = None)
      : GithubConfigResponse = {
    GithubConfigResponse(
      id = IssueImporterConfigId(config.id.value),
      importerType = ImporterType.Github,
      name = config.name,
      baseUrl = config.baseUrl,
      checkFrequency = config.settings.checkFrequency,
      projects = config.projects,
      syncStatus = config.syncStatus,
      audit = AuditInfoResponse(
        createdBy = createdByUser,
        createdAt = config.audit.createdAt,
        updatedBy = updatedByUser,
        updatedAt = config.audit.updatedAt
      ),
      resourceOwner = config.auth.resourceOwner,
      resourceOwnerType = config.auth.resourceOwnerType,
      availableResourceOwners = availableResourceOwners
    )
  }
}

// ===== List Projects Response Models =====

case class ExternalProject(
    id: String,
    name: String,
    ownerType: Option[String] = None // "User" or "Organization" for GitHub
)

case class ExternalWorkspace(
    id: String,
    name: String,
    projects: Seq[ExternalProject]
)

case class ListProjectsResponse(
    projects: Option[Seq[ExternalProject]] = None,
    workspaces: Option[Seq[ExternalWorkspace]] = None
)

object ExternalProject {
  implicit val format: Format[ExternalProject] = Json.format[ExternalProject]
}

object ExternalWorkspace {
  implicit val format: Format[ExternalWorkspace] =
    Json.format[ExternalWorkspace]
}

object ListProjectsResponse {
  implicit val format: Format[ListProjectsResponse] =
    Json.format[ListProjectsResponse]
}
