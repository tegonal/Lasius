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
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._
import reactivemongo.api.bson.collection.BSONCollection
import reactivemongo.play.json.compat._
import reactivemongo.play.json.compat.json2bson._
import repositories.IssueImporterConfigRepository.SavedProjectMapping

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

  /** Writes the name, the URL, the credentials and the settings of a config.
    * The mappings and the sync status stay as other writes left them.
    */
  def update(id: IssueImporterConfigId,
             data: UpdateIssueImporterConfig,
             userId: UserId)(implicit
      dbSession: DBSession): Future[IssueImporterConfig]

  /** Saves the mapping of a pair of projects. A mapping of the same pair gets
    * the new settings and keeps its id.
    */
  def addProjectMapping(id: IssueImporterConfigId,
                        mapping: CreateProjectMapping)(implicit
      dbSession: DBSession): Future[SavedProjectMapping]

  /** Changes the settings of one mapping. None means that the config has no
    * mapping with this id.
    */
  def updateProjectMapping(id: IssueImporterConfigId,
                           mappingId: ProjectMappingId,
                           mapping: UpdateProjectMapping)(implicit
      dbSession: DBSession): Future[Option[IssueImporterConfig]]

  /** None means that the config has no mapping with this id. */
  def removeProjectMapping(id: IssueImporterConfigId,
                           mappingId: ProjectMappingId)(implicit
      dbSession: DBSession): Future[Option[IssueImporterConfig]]

  /** Writes only the sync status, so a concurrent edit of the other fields
    * stays. False means that no config has this id.
    */
  def updateSyncStatus(id: IssueImporterConfigId, syncStatus: ConfigSyncStatus)(
      implicit dbSession: DBSession): Future[Boolean]

  def migrateProjectMappingIds()(implicit dbSession: DBSession): Future[Int]
}

object IssueImporterConfigRepository {
  final case class SavedProjectMapping(config: IssueImporterConfig,
                                       mappingId: ProjectMappingId)
}

/** Each write changes only its own part of a config document, so concurrent
  * edits of the config, of its mappings and of its sync status all stay.
  */
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
      dbSession: DBSession): Future[IssueImporterConfig] =
    for {
      config <- findById(id).noneToFailed(s"Config ${id.value} not found")
      updated = Json
        .toJson(withUpdatedFields(config, data, userId))
        .as[JsObject]
      _ <- updateFields(Json.obj("id" -> id),
                        Seq("name", "baseUrl", "auth", "settings", "audit").map(
                          field => field -> (updated(field): JsValueWrapper)))
      saved <- findById(id).noneToFailed(s"Config ${id.value} not found")
    } yield saved

  def addProjectMapping(id: IssueImporterConfigId,
                        mapping: CreateProjectMapping)(implicit
      dbSession: DBSession): Future[SavedProjectMapping] =
    for {
      config <- findById(id).noneToFailed(s"Config ${id.value} not found")
      added = newMapping(config, mapping)
      _         <- saveMapping(id, added)
      saved     <- findById(id).noneToFailed(s"Config ${id.value} not found")
      mappingId <- Future
        .successful(saved.projects.find(isSamePair(added)).map(_.id))
        .noneToFailed(s"Config ${id.value} lost the mapping it just saved")
    } yield SavedProjectMapping(saved, mappingId)

  def updateProjectMapping(id: IssueImporterConfigId,
                           mappingId: ProjectMappingId,
                           mapping: UpdateProjectMapping)(implicit
      dbSession: DBSession): Future[Option[IssueImporterConfig]] =
    for {
      config  <- findById(id).noneToFailed(s"Config ${id.value} not found")
      matched <- config.mapping(mappingId).fold(Future.successful(0)) {
        current =>
          val updated = mappingJson(withUpdatedSettings(current, mapping))
          updateFirst(
            Json.obj("id" -> id, "projects.id" -> mappingId),
            Json.obj(
              "$set" -> Json.obj("projects.$.settings" -> updated("settings"))))
      }
      saved <- if (matched == 0) Future.successful(None) else findById(id)
    } yield saved

  def removeProjectMapping(id: IssueImporterConfigId,
                           mappingId: ProjectMappingId)(implicit
      dbSession: DBSession): Future[Option[IssueImporterConfig]] =
    updateFirst(
      Json.obj("id"    -> id, "projects.id" -> mappingId),
      Json.obj("$pull" -> Json.obj("projects" -> Json.obj("id" -> mappingId))))
      .flatMap(matched =>
        if (matched == 0) Future.successful(None) else findById(id))

  def updateSyncStatus(id: IssueImporterConfigId, syncStatus: ConfigSyncStatus)(
      implicit dbSession: DBSession): Future[Boolean] =
    updateFirst(Json.obj("id"   -> id),
                Json.obj("$set" -> Json.obj("syncStatus" -> syncStatus)))
      .map(_ > 0)

  def migrateProjectMappingIds()(implicit dbSession: DBSession): Future[Int] = {
    val selector = Json.obj(
      "projects" -> Json.obj(
        "$elemMatch" -> Json.obj("id" -> Json.obj("$exists" -> false))
      )
    )
    find(selector).flatMap { configs =>
      // The read fills each missing mapping id from the case class default.
      Future
        .traverse(configs.toSeq) { case (config, _) =>
          updateFields(Json.obj("id" -> config.id),
                       Seq(
                         "projects" -> (Json
                           .toJson(config)
                           .as[JsObject]
                           .apply("projects"): JsValueWrapper)))
        }
        .map(_.size)
    }
  }

  /** Replaces the settings of the mapping of the same pair, or appends the
    * mapping. Each write checks the pair in the database, so two concurrent
    * adds of one pair store one mapping.
    */
  private def saveMapping(id: IssueImporterConfigId, mapping: ProjectMapping)(
      implicit dbSession: DBSession): Future[Unit] = {
    val json     = mappingJson(mapping)
    val samePair = Json.obj("$elemMatch" -> pairSelector(mapping))

    def replace(): Future[Int] =
      updateFirst(
        Json.obj("id"   -> id, "projects" -> samePair),
        Json.obj("$set" -> Json.obj("projects.$.settings" -> json("settings"))))

    def append(): Future[Int] =
      updateFirst(
        Json.obj("id"    -> id, "projects" -> Json.obj("$not" -> samePair)),
        Json.obj("$push" -> Json.obj("projects" -> json)))

    replace().flatMap {
      case 0 =>
        append().flatMap {
          // Another add stored the pair between the two writes.
          case 0 => replace().map(_ => ())
          case _ => Future.unit
        }
      case _ => Future.unit
    }
  }

  private def isSamePair(mapping: ProjectMapping)(other: ProjectMapping) =
    other.projectId == mapping.projectId &&
      other.externalProjectId == mapping.externalProjectId

  private def pairSelector(mapping: ProjectMapping): JsObject =
    Json.obj("projectId" -> mapping.projectId) ++ (mapping match {
      case m: GitlabProjectMapping =>
        Json.obj("settings.gitlabProjectId" -> m.settings.gitlabProjectId)
      case m: JiraProjectMapping =>
        Json.obj("settings.jiraProjectKey" -> m.settings.jiraProjectKey)
      case m: PlaneProjectMapping =>
        Json.obj("settings.planeProjectId" -> m.settings.planeProjectId)
      case m: GithubProjectMapping =>
        Json.obj("settings.githubRepoOwner" -> m.settings.githubRepoOwner,
                 "settings.githubRepoName"  -> m.settings.githubRepoName)
    })

  private def mappingJson(mapping: ProjectMapping): JsObject =
    (mapping match {
      case m: GitlabProjectMapping => Json.toJson(m)
      case m: JiraProjectMapping   => Json.toJson(m)
      case m: PlaneProjectMapping  => Json.toJson(m)
      case m: GithubProjectMapping => Json.toJson(m)
    }).as[JsObject]

  private def newMapping(config: IssueImporterConfig,
                         mapping: CreateProjectMapping): ProjectMapping =
    config match {
      case _: GitlabConfig =>
        GitlabProjectMapping(
          projectId = mapping.projectId,
          settings = GitlabProjectSettings(
            gitlabProjectId = mapping.gitlabProjectId.getOrElse(""),
            externalProjectName = mapping.externalProjectName,
            maxResults = mapping.maxResults,
            params = mapping.params,
            projectKeyPrefix = mapping.projectKeyPrefix,
            tagConfiguration = mapping.gitlabTagConfig.getOrElse(
              GitlabTagConfiguration(useLabels = false,
                                     labelFilter = Set.empty))
          )
        )

      case _: JiraConfig =>
        JiraProjectMapping(
          projectId = mapping.projectId,
          settings = JiraProjectSettings(
            jiraProjectKey = mapping.jiraProjectKey.getOrElse(""),
            externalProjectName = mapping.externalProjectName,
            maxResults = mapping.maxResults,
            jql = mapping.params
          )
        )

      case _: PlaneConfig =>
        PlaneProjectMapping(
          projectId = mapping.projectId,
          settings = PlaneProjectSettings(
            planeProjectId = mapping.planeProjectId.getOrElse(""),
            externalProjectName = mapping.externalProjectName,
            maxResults = mapping.maxResults,
            params = mapping.params,
            tagConfiguration = mapping.planeTagConfig.getOrElse(
              PlaneTagConfiguration(useLabels = false, labelFilter = Set.empty))
          )
        )

      case _: GithubConfig =>
        GithubProjectMapping(
          projectId = mapping.projectId,
          settings = GithubProjectSettings(
            githubRepoOwner = mapping.githubRepoOwner.getOrElse(""),
            githubRepoName = mapping.githubRepoName.getOrElse(""),
            externalProjectName = mapping.externalProjectName,
            maxResults = mapping.maxResults,
            params = mapping.params,
            projectKeyPrefix = mapping.projectKeyPrefix,
            tagConfiguration = mapping.githubTagConfig.getOrElse(
              GithubTagConfiguration(useLabels = false,
                                     labelFilter = Set.empty))
          )
        )
    }

  /** A field of the request replaces the stored value, and an absent field
    * keeps it.
    */
  private def withUpdatedSettings(
      current: ProjectMapping,
      update: UpdateProjectMapping): ProjectMapping =
    current match {
      case m: GitlabProjectMapping =>
        m.copy(settings =
          m.settings.copy(
            gitlabProjectId =
              update.gitlabProjectId.getOrElse(m.settings.gitlabProjectId),
            externalProjectName =
              update.externalProjectName.orElse(m.settings.externalProjectName),
            maxResults = update.maxResults.orElse(m.settings.maxResults),
            params = update.params.orElse(m.settings.params),
            projectKeyPrefix =
              update.projectKeyPrefix.orElse(m.settings.projectKeyPrefix),
            tagConfiguration =
              update.gitlabTagConfig.getOrElse(m.settings.tagConfiguration)
          ))

      case m: JiraProjectMapping =>
        m.copy(settings =
          m.settings.copy(
            jiraProjectKey =
              update.jiraProjectKey.getOrElse(m.settings.jiraProjectKey),
            externalProjectName =
              update.externalProjectName.orElse(m.settings.externalProjectName),
            maxResults = update.maxResults.orElse(m.settings.maxResults),
            jql = update.params.orElse(m.settings.jql)
          ))

      case m: PlaneProjectMapping =>
        m.copy(settings =
          m.settings.copy(
            planeProjectId =
              update.planeProjectId.getOrElse(m.settings.planeProjectId),
            externalProjectName =
              update.externalProjectName.orElse(m.settings.externalProjectName),
            maxResults = update.maxResults.orElse(m.settings.maxResults),
            params = update.params.orElse(m.settings.params),
            tagConfiguration =
              update.planeTagConfig.getOrElse(m.settings.tagConfiguration)
          ))

      case m: GithubProjectMapping =>
        m.copy(settings =
          m.settings.copy(
            githubRepoOwner =
              update.githubRepoOwner.getOrElse(m.settings.githubRepoOwner),
            githubRepoName =
              update.githubRepoName.getOrElse(m.settings.githubRepoName),
            externalProjectName =
              update.externalProjectName.orElse(m.settings.externalProjectName),
            maxResults = update.maxResults.orElse(m.settings.maxResults),
            params = update.params.orElse(m.settings.params),
            projectKeyPrefix =
              update.projectKeyPrefix.orElse(m.settings.projectKeyPrefix),
            tagConfiguration =
              update.githubTagConfig.getOrElse(m.settings.tagConfiguration)
          ))
    }

  /** A field of the request replaces the stored value, and an absent field
    * keeps it.
    */
  private def withUpdatedFields(config: IssueImporterConfig,
                                data: UpdateIssueImporterConfig,
                                userId: UserId): IssueImporterConfig =
    config match {
      case c: GitlabConfig =>
        c.copy(
          name = data.name.getOrElse(c.name),
          baseUrl = data.baseUrl.getOrElse(c.baseUrl),
          auth = data.accessToken.map(GitlabAuth(_)).getOrElse(c.auth),
          settings =
            data.checkFrequency.map(GitlabSettings(_)).getOrElse(c.settings),
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
          settings =
            data.checkFrequency.map(JiraSettings(_)).getOrElse(c.settings),
          audit = AuditInfo.updated(c.audit, userId)
        )

      case c: PlaneConfig =>
        c.copy(
          name = data.name.getOrElse(c.name),
          baseUrl = data.baseUrl.getOrElse(c.baseUrl),
          auth = data.apiKey.map(PlaneAuth(_)).getOrElse(c.auth),
          settings = PlaneSettings(
            checkFrequency =
              data.checkFrequency.getOrElse(c.settings.checkFrequency),
            workspace = data.workspace.getOrElse(c.settings.workspace)
          ),
          audit = AuditInfo.updated(c.audit, userId)
        )

      case c: GithubConfig =>
        c.copy(
          name = data.name.getOrElse(c.name),
          baseUrl = data.baseUrl.getOrElse(c.baseUrl),
          auth = GithubAuth(
            accessToken = data.accessToken.getOrElse(c.auth.accessToken),
            resourceOwner = data.resourceOwner.orElse(c.auth.resourceOwner),
            resourceOwnerType =
              data.resourceOwnerType.orElse(c.auth.resourceOwnerType)
          ),
          settings =
            data.checkFrequency.map(GithubSettings(_)).getOrElse(c.settings),
          audit = AuditInfo.updated(c.audit, userId)
        )
    }
}
