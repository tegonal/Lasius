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

@ImplementedBy(classOf[PlaneConfigMongoRepository])
trait PlaneConfigRepository extends BaseRepository[PlaneConfig, PlaneConfigId] {

  def getPlaneConfigurations(implicit
      dbSession: DBSession): Future[Seq[PlaneConfig]]

  def findByOrganisation(orgId: OrganisationId)(implicit
      dbSession: DBSession): Future[Seq[PlaneConfig]]

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreatePlaneConfig)(implicit
      dbSession: DBSession): Future[PlaneConfig]

  def update(id: PlaneConfigId, data: UpdatePlaneConfig)(implicit
      dbSession: DBSession): Future[PlaneConfig]

  def addProjectMapping(id: PlaneConfigId, mapping: PlaneProjectMapping)(
      implicit dbSession: DBSession): Future[PlaneConfig]

  def removeProjectMapping(id: PlaneConfigId, projectId: ProjectId)(implicit
      dbSession: DBSession): Future[PlaneConfig]

  def updateProjectMapping(id: PlaneConfigId,
                           projectId: ProjectId,
                           settings: PlaneProjectSettings)(implicit
      dbSession: DBSession): Future[PlaneConfig]

  def findByProjectId(projectId: ProjectId)(implicit
      dbSession: DBSession): Future[Option[PlaneConfig]]
}

class PlaneConfigMongoRepository @Inject() (
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[PlaneConfig, PlaneConfigId]
    with PlaneConfigRepository
    with Logging {
  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("PlaneConfig")

  // Override for BSON ObjectID-based entities: use _id instead of id
  override def findById(id: PlaneConfigId)(implicit
      fact: PlaneConfigId => Json.JsValueWrapper,
      dbSession: DBSession): Future[Option[PlaneConfig]] = {
    val sel = Json.obj("_id" -> fact(id))
    find(sel).map(_.headOption.map(_._1))
  }

  override def removeById(id: PlaneConfigId)(implicit
      fact: PlaneConfigId => Json.JsValueWrapper,
      dbSession: DBSession): Future[Boolean] = {
    remove(Json.obj("_id" -> id))
  }

  override def upsert(t: PlaneConfig)(implicit
      writer: Writes[PlaneConfigId],
      dbSession: DBSession): Future[Unit] = {
    import reactivemongo.play.json.compat.json2bson._
    val obj = PlaneConfig.PlaneConfigFormat.writes(t).as[JsObject]
    coll
      .update(ordered = true)
      .one(Json.obj("_id" -> t._id), obj, upsert = true)
      .map(_ => ())
  }

  def getPlaneConfigurations(implicit
      dbSession: DBSession): Future[Seq[PlaneConfig]] = {
    find(Json.obj()).map { configs =>
      logger.debug(s"Loaded plane configs:$configs")
      configs.map(_._1).toSeq
    }
  }

  def findByOrganisation(orgId: OrganisationId)(implicit
      dbSession: DBSession): Future[Seq[PlaneConfig]] = {
    find(Json.obj("organisationReference.id" -> orgId)).map(_.map(_._1).toSeq)
  }

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreatePlaneConfig)(implicit
      dbSession: DBSession): Future[PlaneConfig] = {
    val config = PlaneConfig(
      _id = PlaneConfigId(),
      organisationReference = orgRef,
      name = data.name,
      baseUrl = data.baseUrl,
      auth = PlaneAuth(data.apiKey),
      settings = PlaneSettings(data.checkFrequency),
      projects = data.projects
    )
    upsert(config).map(_ => config)
  }

  def update(id: PlaneConfigId, data: UpdatePlaneConfig)(implicit
      dbSession: DBSession): Future[PlaneConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Plane config ${id.value} not found")
      updated = config.copy(
        name = data.name.getOrElse(config.name),
        baseUrl = data.baseUrl.getOrElse(config.baseUrl),
        auth = data.apiKey
          .map(key => PlaneAuth(key))
          .getOrElse(config.auth),
        settings = data.checkFrequency
          .map(freq => PlaneSettings(freq))
          .getOrElse(config.settings),
        projects = data.projects.getOrElse(config.projects)
      )
      _ <- upsert(updated)
    } yield updated
  }

  def addProjectMapping(id: PlaneConfigId, mapping: PlaneProjectMapping)(
      implicit dbSession: DBSession): Future[PlaneConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Plane config ${id.value} not found")
      filteredProjects = config.projects.filterNot(
        _.projectId == mapping.projectId)
      updated = config.copy(projects = filteredProjects :+ mapping)
      _ <- upsert(updated)
    } yield updated
  }

  def removeProjectMapping(id: PlaneConfigId, projectId: ProjectId)(implicit
      dbSession: DBSession): Future[PlaneConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Plane config ${id.value} not found")
      updated = config.copy(
        projects = config.projects.filterNot(_.projectId == projectId))
      _ <- upsert(updated)
    } yield updated
  }

  def updateProjectMapping(id: PlaneConfigId,
                           projectId: ProjectId,
                           settings: PlaneProjectSettings)(implicit
      dbSession: DBSession): Future[PlaneConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Plane config ${id.value} not found")
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
      dbSession: DBSession): Future[Option[PlaneConfig]] = {
    find(Json.obj("projects.projectId" -> projectId))
      .map(_.headOption.map(_._1))
  }
}
