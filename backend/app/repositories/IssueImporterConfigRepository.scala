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

package repositories

import com.google.inject.ImplementedBy
import core.DBSession
import models._
import play.api.Logging
import play.api.libs.json._
import reactivemongo.api.bson.{collection, BSONObjectID}
import reactivemongo.api.bson.collection.BSONCollection
import reactivemongo.play.json.compat._
import reactivemongo.play.json.compat.json2bson._

import javax.inject.Inject
import scala.concurrent._

@ImplementedBy(classOf[IssueImporterConfigMongoRepository])
trait IssueImporterConfigRepository
    extends BaseRepository[IssueImporterConfig, IssueImporterConfigId] {

  def findAllConfigs(importerType: Option[ImporterType] = None)(implicit
      dbSession: DBSession): Future[Seq[IssueImporterConfig]]

  def findByOrganisation(
      orgId: OrganisationId,
      importerType: Option[ImporterType] = None
  )(implicit dbSession: DBSession): Future[Seq[IssueImporterConfig]]

  def findByProjectId(projectId: ProjectId)(implicit
      dbSession: DBSession): Future[Option[IssueImporterConfig]]

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreateIssueImporterConfig,
             userId: UserId)(implicit
      dbSession: DBSession): Future[IssueImporterConfig]

  def update(id: IssueImporterConfigId,
             data: UpdateIssueImporterConfig,
             userId: UserId)(implicit
      dbSession: DBSession): Future[IssueImporterConfig]

  def addProjectMapping(id: IssueImporterConfigId,
                        mapping: CreateProjectMapping)(implicit
      dbSession: DBSession): Future[IssueImporterConfig]

  def updateProjectMapping(id: IssueImporterConfigId,
                           projectId: ProjectId,
                           mapping: UpdateProjectMapping)(implicit
      dbSession: DBSession): Future[IssueImporterConfig]

  def removeProjectMapping(id: IssueImporterConfigId, projectId: ProjectId)(
      implicit dbSession: DBSession): Future[IssueImporterConfig]
}

class IssueImporterConfigMongoRepository @Inject() (
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[IssueImporterConfig,
                                        IssueImporterConfigId]
    with IssueImporterConfigRepository
    with Logging {

  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("IssueImporterConfig")

  def findAllConfigs(importerType: Option[ImporterType] = None)(implicit
      dbSession: DBSession): Future[Seq[IssueImporterConfig]] = {
    val selector = importerType match {
      case Some(it) => Json.obj("importerType" -> it.value)
      case None     => Json.obj()
    }

    find(selector).map { results =>
      val configs = results.map(_._1).toSeq
      logger.debug(
        s"Loaded ${configs.size} importer configs, type filter: $importerType")
      configs
    }
  }

  def findByOrganisation(
      orgId: OrganisationId,
      importerType: Option[ImporterType] = None
  )(implicit dbSession: DBSession): Future[Seq[IssueImporterConfig]] = {
    val baseSelector = Json.obj("organisationReference.id" -> orgId)
    val selector     = importerType match {
      case Some(it) =>
        baseSelector ++ Json.obj("importerType" -> it.value)
      case None => baseSelector
    }

    find(selector).map { results =>
      val configs = results.map(_._1).toSeq
      logger.debug(
        s"Loaded ${configs.size} importer configs for org $orgId, type filter: $importerType")
      configs
    }
  }

  def findByProjectId(projectId: ProjectId)(implicit
      dbSession: DBSession): Future[Option[IssueImporterConfig]] = {
    find(Json.obj("projects.projectId" -> projectId))
      .map(_.headOption.map(_._1))
  }

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreateIssueImporterConfig,
             userId: UserId)(implicit
      dbSession: DBSession): Future[IssueImporterConfig] = {

    val audit = AuditInfo.initial(userId)

    val config: IssueImporterConfig = data.importerType match {
      case ImporterType.Gitlab =>
        GitlabConfig(
          id = IssueImporterConfigId(),
          organisationReference = orgRef,
          importerType = ImporterType.Gitlab,
          name = data.name,
          baseUrl = data.baseUrl,
          auth = GitlabAuth(data.accessToken.getOrElse("")),
          settings = GitlabSettings(data.checkFrequency),
          projects = Seq.empty,
          audit = audit
        )

      case ImporterType.Jira =>
        JiraConfig(
          id = IssueImporterConfigId(),
          organisationReference = orgRef,
          importerType = ImporterType.Jira,
          name = data.name,
          baseUrl = data.baseUrl,
          auth = JiraAuth(
            consumerKey = data.consumerKey.getOrElse(""),
            privateKey = data.privateKey.getOrElse(""),
            accessToken = data.accessToken.getOrElse("")
          ),
          settings = JiraSettings(data.checkFrequency),
          projects = Seq.empty,
          audit = audit
        )

      case ImporterType.Plane =>
        PlaneConfig(
          id = IssueImporterConfigId(),
          organisationReference = orgRef,
          importerType = ImporterType.Plane,
          name = data.name,
          baseUrl = data.baseUrl,
          auth = PlaneAuth(data.apiKey.getOrElse("")),
          settings = PlaneSettings(
            checkFrequency = data.checkFrequency,
            workspace = data.workspace.getOrElse("")
          ),
          projects = Seq.empty,
          audit = audit
        )

      case ImporterType.Github =>
        GithubConfig(
          id = IssueImporterConfigId(),
          organisationReference = orgRef,
          importerType = ImporterType.Github,
          name = data.name,
          baseUrl = data.baseUrl,
          auth = GithubAuth(
            accessToken = data.accessToken.getOrElse(""),
            resourceOwner = data.resourceOwner,
            resourceOwnerType = data.resourceOwnerType
          ),
          settings = GithubSettings(data.checkFrequency),
          projects = Seq.empty,
          audit = audit
        )
    }

    upsert(config).map(_ => config)
  }

  def update(id: IssueImporterConfigId,
             data: UpdateIssueImporterConfig,
             userId: UserId)(implicit
      dbSession: DBSession): Future[IssueImporterConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Config ${id.value} not found")

      updated = config match {
        case c: GitlabConfig =>
          c.copy(
            name = data.name.getOrElse(c.name),
            baseUrl = data.baseUrl.getOrElse(c.baseUrl),
            auth = data.accessToken
              .map(token => GitlabAuth(token))
              .getOrElse(c.auth),
            settings = data.checkFrequency
              .map(freq => GitlabSettings(freq))
              .getOrElse(c.settings),
            audit = AuditInfo.updated(c.audit, userId)
          )

        case c: JiraConfig =>
          c.copy(
            name = data.name.getOrElse(c.name),
            baseUrl = data.baseUrl.getOrElse(c.baseUrl),
            auth = JiraAuth(
              consumerKey = data.consumerKey.getOrElse(c.auth.consumerKey),
              privateKey = data.privateKey.getOrElse(c.auth.privateKey),
              accessToken = data.accessToken.getOrElse(c.auth.accessToken)
            ),
            settings = data.checkFrequency
              .map(freq => JiraSettings(freq))
              .getOrElse(c.settings),
            audit = AuditInfo.updated(c.audit, userId)
          )

        case c: PlaneConfig =>
          c.copy(
            name = data.name.getOrElse(c.name),
            baseUrl = data.baseUrl.getOrElse(c.baseUrl),
            auth = data.apiKey
              .map(key => PlaneAuth(key))
              .getOrElse(c.auth),
            settings =
              if (data.checkFrequency.isDefined || data.workspace.isDefined) {
                PlaneSettings(
                  checkFrequency =
                    data.checkFrequency.getOrElse(c.settings.checkFrequency),
                  workspace = data.workspace.getOrElse(c.settings.workspace)
                )
              } else {
                c.settings
              },
            audit = AuditInfo.updated(c.audit, userId)
          )

        case c: GithubConfig =>
          c.copy(
            name = data.name.getOrElse(c.name),
            baseUrl = data.baseUrl.getOrElse(c.baseUrl),
            auth =
              if (data.accessToken.isDefined || data.resourceOwner.isDefined || data.resourceOwnerType.isDefined) {
                GithubAuth(
                  accessToken = data.accessToken.getOrElse(c.auth.accessToken),
                  resourceOwner =
                    data.resourceOwner.orElse(c.auth.resourceOwner),
                  resourceOwnerType =
                    data.resourceOwnerType.orElse(c.auth.resourceOwnerType)
                )
              } else {
                c.auth
              },
            settings = data.checkFrequency
              .map(freq => GithubSettings(freq))
              .getOrElse(c.settings),
            audit = AuditInfo.updated(c.audit, userId)
          )
      }

      _ <- upsert(updated)
    } yield updated
  }

  def addProjectMapping(id: IssueImporterConfigId,
                        mapping: CreateProjectMapping)(implicit
      dbSession: DBSession): Future[IssueImporterConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Config ${id.value} not found")

      updated = config match {
        case c: GitlabConfig =>
          val gitlabMapping = GitlabProjectMapping(
            projectId = mapping.projectId,
            settings = GitlabProjectSettings(
              gitlabProjectId = mapping.gitlabProjectId.getOrElse(""),
              externalProjectName = mapping.externalProjectName,
              maxResults = mapping.maxResults,
              params = mapping.params,
              projectKeyPrefix = mapping.projectKeyPrefix,
              tagConfiguration = mapping.gitlabTagConfig.getOrElse(
                GitlabTagConfiguration(
                  useLabels = false,
                  labelFilter = Set.empty
                ))
            )
          )
          // Remove existing mapping for same project if any
          val filteredProjects =
            c.projects.filterNot(_.projectId == mapping.projectId)
          c.copy(projects = filteredProjects :+ gitlabMapping)

        case c: JiraConfig =>
          val jiraMapping = JiraProjectMapping(
            projectId = mapping.projectId,
            settings = JiraProjectSettings(
              jiraProjectKey = mapping.jiraProjectKey.getOrElse(""),
              externalProjectName = mapping.externalProjectName,
              maxResults = mapping.maxResults,
              jql = mapping.params
            )
          )
          val filteredProjects =
            c.projects.filterNot(_.projectId == mapping.projectId)
          c.copy(projects = filteredProjects :+ jiraMapping)

        case c: PlaneConfig =>
          val planeMapping = PlaneProjectMapping(
            projectId = mapping.projectId,
            settings = PlaneProjectSettings(
              planeProjectId = mapping.planeProjectId.getOrElse(""),
              externalProjectName = mapping.externalProjectName,
              maxResults = mapping.maxResults,
              params = mapping.params,
              tagConfiguration = mapping.planeTagConfig.getOrElse(
                PlaneTagConfiguration(
                  useLabels = false,
                  labelFilter = Set.empty
                ))
            )
          )
          val filteredProjects =
            c.projects.filterNot(_.projectId == mapping.projectId)
          c.copy(projects = filteredProjects :+ planeMapping)

        case c: GithubConfig =>
          val githubMapping = GithubProjectMapping(
            projectId = mapping.projectId,
            settings = GithubProjectSettings(
              githubRepoOwner = mapping.githubRepoOwner.getOrElse(""),
              githubRepoName = mapping.githubRepoName.getOrElse(""),
              externalProjectName = mapping.externalProjectName,
              maxResults = mapping.maxResults,
              params = mapping.params,
              projectKeyPrefix = mapping.projectKeyPrefix,
              tagConfiguration = mapping.githubTagConfig.getOrElse(
                GithubTagConfiguration(
                  useLabels = false,
                  labelFilter = Set.empty
                ))
            )
          )
          val filteredProjects =
            c.projects.filterNot(_.projectId == mapping.projectId)
          c.copy(projects = filteredProjects :+ githubMapping)
      }

      _ <- upsert(updated)
    } yield updated
  }

  def updateProjectMapping(id: IssueImporterConfigId,
                           projectId: ProjectId,
                           mapping: UpdateProjectMapping)(implicit
      dbSession: DBSession): Future[IssueImporterConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Config ${id.value} not found")

      updated = config match {
        case c: GitlabConfig =>
          c.copy(
            projects = c.projects.map {
              case m if m.projectId == projectId =>
                m.copy(
                  settings = m.settings.copy(
                    gitlabProjectId = mapping.gitlabProjectId.getOrElse(
                      m.settings.gitlabProjectId),
                    externalProjectName = mapping.externalProjectName.orElse(
                      m.settings.externalProjectName),
                    maxResults =
                      mapping.maxResults.orElse(m.settings.maxResults),
                    params = mapping.params.orElse(m.settings.params),
                    projectKeyPrefix = mapping.projectKeyPrefix.orElse(
                      m.settings.projectKeyPrefix),
                    tagConfiguration = mapping.gitlabTagConfig.getOrElse(
                      m.settings.tagConfiguration)
                  )
                )
              case m => m
            }
          )

        case c: JiraConfig =>
          c.copy(
            projects = c.projects.map {
              case m if m.projectId == projectId =>
                m.copy(
                  settings = m.settings.copy(
                    jiraProjectKey = mapping.jiraProjectKey.getOrElse(
                      m.settings.jiraProjectKey),
                    externalProjectName = mapping.externalProjectName.orElse(
                      m.settings.externalProjectName),
                    maxResults =
                      mapping.maxResults.orElse(m.settings.maxResults),
                    jql = mapping.params.orElse(m.settings.jql)
                  )
                )
              case m => m
            }
          )

        case c: PlaneConfig =>
          c.copy(
            projects = c.projects.map {
              case m if m.projectId == projectId =>
                m.copy(
                  settings = m.settings.copy(
                    planeProjectId = mapping.planeProjectId.getOrElse(
                      m.settings.planeProjectId),
                    externalProjectName = mapping.externalProjectName.orElse(
                      m.settings.externalProjectName),
                    maxResults =
                      mapping.maxResults.orElse(m.settings.maxResults),
                    params = mapping.params.orElse(m.settings.params),
                    tagConfiguration = mapping.planeTagConfig.getOrElse(
                      m.settings.tagConfiguration)
                  )
                )
              case m => m
            }
          )

        case c: GithubConfig =>
          c.copy(
            projects = c.projects.map {
              case m if m.projectId == projectId =>
                m.copy(
                  settings = m.settings.copy(
                    githubRepoOwner = mapping.githubRepoOwner.getOrElse(
                      m.settings.githubRepoOwner),
                    githubRepoName = mapping.githubRepoName.getOrElse(
                      m.settings.githubRepoName),
                    externalProjectName = mapping.externalProjectName.orElse(
                      m.settings.externalProjectName),
                    maxResults =
                      mapping.maxResults.orElse(m.settings.maxResults),
                    params = mapping.params.orElse(m.settings.params),
                    projectKeyPrefix = mapping.projectKeyPrefix.orElse(
                      m.settings.projectKeyPrefix),
                    tagConfiguration = mapping.githubTagConfig.getOrElse(
                      m.settings.tagConfiguration)
                  )
                )
              case m => m
            }
          )
      }

      _ <- upsert(updated)
    } yield updated
  }

  def removeProjectMapping(id: IssueImporterConfigId, projectId: ProjectId)(
      implicit dbSession: DBSession): Future[IssueImporterConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Config ${id.value} not found")

      updated = config match {
        case c: GitlabConfig =>
          c.copy(projects = c.projects.filterNot(_.projectId == projectId))
        case c: JiraConfig =>
          c.copy(projects = c.projects.filterNot(_.projectId == projectId))
        case c: PlaneConfig =>
          c.copy(projects = c.projects.filterNot(_.projectId == projectId))
        case c: GithubConfig =>
          c.copy(projects = c.projects.filterNot(_.projectId == projectId))
      }

      _ <- upsert(updated)
    } yield updated
  }
}
