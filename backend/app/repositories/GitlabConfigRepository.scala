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
import reactivemongo.api.bson.collection.BSONCollection

import javax.inject.Inject
import scala.concurrent._

@ImplementedBy(classOf[GitlabConfigMongoRepository])
trait GitlabConfigRepository
    extends BaseRepository[GitlabConfig, GitlabConfigId] {

  def getGitlabConfigurations(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]]

  def findByOrganisation(orgId: OrganisationId)(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]]

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreateGitlabConfig)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def update(id: GitlabConfigId, data: UpdateGitlabConfig)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def addProjectMapping(id: GitlabConfigId, mapping: GitlabProjectMapping)(
      implicit dbSession: DBSession): Future[GitlabConfig]

  def removeProjectMapping(id: GitlabConfigId, projectId: ProjectId)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def updateProjectMapping(id: GitlabConfigId,
                           projectId: ProjectId,
                           settings: GitlabProjectSettings)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def findByProjectId(projectId: ProjectId)(implicit
      dbSession: DBSession): Future[Option[GitlabConfig]]
}

class GitlabConfigMongoRepository @Inject() (
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[GitlabConfig, GitlabConfigId]
    with GitlabConfigRepository
    with Logging {
  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("GitlabConfig")

  // Override for BSON ObjectID-based entities: use _id instead of id
  override def findById(id: GitlabConfigId)(implicit
      fact: GitlabConfigId => Json.JsValueWrapper,
      dbSession: DBSession): Future[Option[GitlabConfig]] = {
    val sel = Json.obj("_id" -> fact(id))
    find(sel).map(_.headOption.map(_._1))
  }

  override def removeById(id: GitlabConfigId)(implicit
      fact: GitlabConfigId => Json.JsValueWrapper,
      dbSession: DBSession): Future[Boolean] = {
    remove(Json.obj("_id" -> id))
  }

  override def upsert(t: GitlabConfig)(implicit
      writer: Writes[GitlabConfigId],
      dbSession: DBSession): Future[Unit] = {
    import reactivemongo.play.json.compat.json2bson._
    val obj = GitlabConfig.GitlabConfigFormat.writes(t).as[JsObject]
    coll
      .update(ordered = true)
      .one(Json.obj("_id" -> t._id), obj, upsert = true)
      .map(_ => ())
  }

  def getGitlabConfigurations(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]] = {
    find(Json.obj()).map { configs =>
      logger.debug(s"Loaded gitlab configs:$configs")
      configs.map(_._1).toSeq
    }
  }

  def findByOrganisation(orgId: OrganisationId)(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]] = {
    find(Json.obj("organisationReference.id" -> orgId)).map(_.map(_._1).toSeq)
  }

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreateGitlabConfig)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    val config = GitlabConfig(
      _id = GitlabConfigId(),
      organisationReference = orgRef,
      name = data.name,
      baseUrl = data.baseUrl,
      auth = GitlabAuth(data.accessToken),
      settings = GitlabSettings(data.checkFrequency),
      projects = data.projects
    )
    upsert(config).map(_ => config)
  }

  def update(id: GitlabConfigId, data: UpdateGitlabConfig)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    for {
      config <- findById(id).noneToFailed(
        s"GitLab config ${id.value} not found")
      updated = config.copy(
        name = data.name.getOrElse(config.name),
        baseUrl = data.baseUrl.getOrElse(config.baseUrl),
        auth = data.accessToken
          .map(token => GitlabAuth(token))
          .getOrElse(config.auth),
        settings = data.checkFrequency
          .map(freq => GitlabSettings(freq))
          .getOrElse(config.settings),
        projects = data.projects.getOrElse(config.projects)
      )
      _ <- upsert(updated)
    } yield updated
  }

  def addProjectMapping(id: GitlabConfigId, mapping: GitlabProjectMapping)(
      implicit dbSession: DBSession): Future[GitlabConfig] = {
    for {
      config <- findById(id).noneToFailed(
        s"GitLab config ${id.value} not found")
      // Remove existing mapping for same project if any
      filteredProjects = config.projects.filterNot(
        _.projectId == mapping.projectId)
      updated = config.copy(projects = filteredProjects :+ mapping)
      _ <- upsert(updated)
    } yield updated
  }

  def removeProjectMapping(id: GitlabConfigId, projectId: ProjectId)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    for {
      config <- findById(id).noneToFailed(
        s"GitLab config ${id.value} not found")
      updated = config.copy(
        projects = config.projects.filterNot(_.projectId == projectId))
      _ <- upsert(updated)
    } yield updated
  }

  def updateProjectMapping(id: GitlabConfigId,
                           projectId: ProjectId,
                           settings: GitlabProjectSettings)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    for {
      config <- findById(id).noneToFailed(
        s"GitLab config ${id.value} not found")
      updated = config.copy(
        projects = config.projects.map {
          case mapping if mapping.projectId == projectId =>
            mapping.copy(settings = settings)
          case mapping => mapping
        }
      )
      _ <- upsert(updated)
    } yield updated
  }

  def findByProjectId(projectId: ProjectId)(implicit
      dbSession: DBSession): Future[Option[GitlabConfig]] = {
    find(Json.obj("projects.projectId" -> projectId))
      .map(_.headOption.map(_._1))
  }
}
