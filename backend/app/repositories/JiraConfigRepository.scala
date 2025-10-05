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

@ImplementedBy(classOf[JiraConfigMongoRepository])
trait JiraConfigRepository extends BaseRepository[JiraConfig, JiraConfigId] {

  def getJiraConfigurations(implicit
      dbSession: DBSession): Future[Seq[JiraConfig]]

  def findByOrganisation(orgId: OrganisationId)(implicit
      dbSession: DBSession): Future[Seq[JiraConfig]]

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreateJiraConfig)(implicit
      dbSession: DBSession): Future[JiraConfig]

  def update(id: JiraConfigId, data: UpdateJiraConfig)(implicit
      dbSession: DBSession): Future[JiraConfig]

  def addProjectMapping(id: JiraConfigId, mapping: JiraProjectMapping)(implicit
      dbSession: DBSession): Future[JiraConfig]

  def removeProjectMapping(id: JiraConfigId, projectId: ProjectId)(implicit
      dbSession: DBSession): Future[JiraConfig]

  def updateProjectMapping(id: JiraConfigId,
                           projectId: ProjectId,
                           settings: JiraProjectSettings)(implicit
      dbSession: DBSession): Future[JiraConfig]

  def findByProjectId(projectId: ProjectId)(implicit
      dbSession: DBSession): Future[Option[JiraConfig]]
}

class JiraConfigMongoRepository @Inject() (
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[JiraConfig, JiraConfigId]
    with JiraConfigRepository
    with Logging {
  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("JiraConfig")

  // Override for BSON ObjectID-based entities: use _id instead of id
  override def findById(id: JiraConfigId)(implicit
      fact: JiraConfigId => Json.JsValueWrapper,
      dbSession: DBSession): Future[Option[JiraConfig]] = {
    val sel = Json.obj("_id" -> fact(id))
    find(sel).map(_.headOption.map(_._1))
  }

  override def removeById(id: JiraConfigId)(implicit
      fact: JiraConfigId => Json.JsValueWrapper,
      dbSession: DBSession): Future[Boolean] = {
    remove(Json.obj("_id" -> id))
  }

  override def upsert(t: JiraConfig)(implicit
      writer: Writes[JiraConfigId],
      dbSession: DBSession): Future[Unit] = {
    import reactivemongo.play.json.compat.json2bson._
    val obj = JiraConfig.jiraConfigFormat.writes(t).as[JsObject]
    coll
      .update(ordered = true)
      .one(Json.obj("_id" -> t._id), obj, upsert = true)
      .map(_ => ())
  }

  def getJiraConfigurations(implicit
      dbSession: DBSession): Future[Seq[JiraConfig]] = {
    find(Json.obj()).map { configs =>
      logger.debug(s"Loaded jira configs:$configs")
      configs.map(_._1).toSeq
    }
  }

  def findByOrganisation(orgId: OrganisationId)(implicit
      dbSession: DBSession): Future[Seq[JiraConfig]] = {
    find(Json.obj("organisationReference.id" -> orgId)).map(_.map(_._1).toSeq)
  }

  def create(orgRef: OrganisationId.OrganisationReference,
             data: CreateJiraConfig)(implicit
      dbSession: DBSession): Future[JiraConfig] = {
    val config = JiraConfig(
      _id = JiraConfigId(),
      organisationReference = orgRef,
      name = data.name,
      baseUrl = data.baseUrl,
      auth = JiraAuth(data.consumerKey, data.privateKey, data.accessToken),
      settings = JiraSettings(data.checkFrequency),
      projects = data.projects
    )
    upsert(config).map(_ => config)
  }

  def update(id: JiraConfigId, data: UpdateJiraConfig)(implicit
      dbSession: DBSession): Future[JiraConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Jira config ${id.value} not found")
      updated = config.copy(
        name = data.name.getOrElse(config.name),
        baseUrl = data.baseUrl.getOrElse(config.baseUrl),
        auth = (data.consumerKey, data.privateKey, data.accessToken) match {
          case (Some(ck), Some(pk), Some(at)) => JiraAuth(ck, pk, at)
          case (Some(ck), Some(pk), None)     =>
            config.auth.copy(consumerKey = ck, privateKey = pk)
          case (Some(ck), None, Some(at)) =>
            config.auth.copy(consumerKey = ck, accessToken = at)
          case (None, Some(pk), Some(at)) =>
            config.auth.copy(privateKey = pk, accessToken = at)
          case (Some(ck), None, None) => config.auth.copy(consumerKey = ck)
          case (None, Some(pk), None) => config.auth.copy(privateKey = pk)
          case (None, None, Some(at)) => config.auth.copy(accessToken = at)
          case _                      => config.auth
        },
        settings = data.checkFrequency
          .map(freq => JiraSettings(freq))
          .getOrElse(config.settings),
        projects = data.projects.getOrElse(config.projects)
      )
      _ <- upsert(updated)
    } yield updated
  }

  def addProjectMapping(id: JiraConfigId, mapping: JiraProjectMapping)(implicit
      dbSession: DBSession): Future[JiraConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Jira config ${id.value} not found")
      filteredProjects = config.projects.filterNot(
        _.projectId == mapping.projectId)
      updated = config.copy(projects = filteredProjects :+ mapping)
      _ <- upsert(updated)
    } yield updated
  }

  def removeProjectMapping(id: JiraConfigId, projectId: ProjectId)(implicit
      dbSession: DBSession): Future[JiraConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Jira config ${id.value} not found")
      updated = config.copy(
        projects = config.projects.filterNot(_.projectId == projectId))
      _ <- upsert(updated)
    } yield updated
  }

  def updateProjectMapping(id: JiraConfigId,
                           projectId: ProjectId,
                           settings: JiraProjectSettings)(implicit
      dbSession: DBSession): Future[JiraConfig] = {
    for {
      config <- findById(id).noneToFailed(s"Jira config ${id.value} not found")
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
      dbSession: DBSession): Future[Option[JiraConfig]] = {
    find(Json.obj("projects.projectId" -> projectId))
      .map(_.headOption.map(_._1))
  }
}
