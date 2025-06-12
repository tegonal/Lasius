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
import core.{DBSession, Validation}
import models.OrganisationId.OrganisationReference
import models._
import play.api.Logging
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._
import reactivemongo.api.bson.collection.BSONCollection
import models.BaseFormat._
import repositories.MongoDBCommandSet.{Pull, Push}

import javax.inject.Inject
import scala.concurrent._

@ImplementedBy(classOf[GitlabConfigMongoRepository])
trait GitlabConfigRepository
    extends BaseRepository[GitlabConfig, GitlabConfigId] {

  def getGitlabConfigurations(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]]

  def getGitlabConfigurationsByOrganisation(
      organisationReference: OrganisationReference)(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]]

  def updateGitlabConfiguration(organisationReference: OrganisationReference,
                                update: GitlabConfigUpdate)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def createGitlabConfiguration(organisationReference: OrganisationReference,
                                update: GitlabConfigCreate)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def removeGitlabConfiguration(organisationReference: OrganisationReference,
                                gitlabConfigId: GitlabConfigId)(implicit
      dbSession: DBSession): Future[Boolean]

  def addOrUpdateProjectGitlabConfig(
      organisationReference: OrganisationReference,
      gitlabConfigId: GitlabConfigId,
      projectConfig: GitlabProjectMapping)(implicit
      dbSession: DBSession): Future[GitlabConfig]

  def removeProjectGitlabConfig(organisationReference: OrganisationReference,
                                gitlabConfigId: GitlabConfigId,
                                projectId: ProjectId)(implicit
      dbSession: DBSession): Future[GitlabConfig]
}

class GitlabConfigMongoRepository @Inject() (
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[GitlabConfig, GitlabConfigId]
    with GitlabConfigRepository
    with Logging
    with Validation {
  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("GitlabConfig")

  def getGitlabConfigurations(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]] = {
    find(Json.obj()).map { configs =>
      logger.debug(s"Loaded gitlab configs:$configs")
      configs.map(_._1).toSeq
    }
  }

  def getGitlabConfigurationsByOrganisation(
      organisationReference: OrganisationReference)(implicit
      dbSession: DBSession): Future[Seq[GitlabConfig]] = {
    find(Json.obj("organisationReference" -> organisationReference)).map {
      configs =>
        configs.map(_._1).toSeq
    }
  }

  def updateGitlabConfiguration(organisationReference: OrganisationReference,
                                update: GitlabConfigUpdate)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    val updateObject: Seq[(String, JsValueWrapper)] = Seq(
      update.name.map(key => "name" -> Json.toJsFieldJsValueWrapper(key)),
      update.baseUrl.map(key => "baseUrl" -> Json.toJsFieldJsValueWrapper(key)),
      update.auth.map(key => "auth" -> Json.toJsFieldJsValueWrapper(key)),
      update.settings.map(key =>
        "settings" -> Json.toJsFieldJsValueWrapper(key))
    ).flatten
    for {
      existingConfig <- findById(update.id).noneToFailed(
        s"Cannot find gitlab config with id ${update.id}")
      _ <- validate(
        existingConfig.organisationReference == organisationReference,
        s"Cannot update gitlab config of another organisation ${update.id}")
      _ <- validate(
        updateObject.nonEmpty,
        s"cannot update gitlab config ${update.id}, at least one field must be specified")
      _             <- updateFields(Json.obj("id" -> update.id), updateObject)
      updatedConfig <- findById(update.id).noneToFailed(
        s"Failed loading updated gitlab config ${update.id}")
    } yield updatedConfig
  }

  def createGitlabConfiguration(organisationReference: OrganisationReference,
                                gitlabConfig: GitlabConfigCreate)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    val config = gitlabConfig.buildConfig(organisationReference)
    for {
      _ <- upsert(config)
    } yield config
  }

  def removeGitlabConfiguration(organisationReference: OrganisationReference,
                                gitlabConfigId: GitlabConfigId)(implicit
      dbSession: DBSession): Future[Boolean] = {
    remove(
      Json.obj("id"                    -> gitlabConfigId,
               "organisationReference" -> organisationReference))
  }

  def addOrUpdateProjectGitlabConfig(
      organisationReference: OrganisationReference,
      gitlabConfigId: GitlabConfigId,
      projectConfig: GitlabProjectMapping)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    val modifier = Json.obj(Push -> Json.obj("projects" -> projectConfig))
    modifyProjectGitlabConfig(organisationReference = organisationReference,
                              gitlabConfigId = gitlabConfigId,
                              modifier = modifier)
  }

  def removeProjectGitlabConfig(organisationReference: OrganisationReference,
                                gitlabConfigId: GitlabConfigId,
                                projectId: ProjectId)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    val modifier = Json.obj(Pull -> Json.obj("projects.id" -> projectId))
    modifyProjectGitlabConfig(organisationReference = organisationReference,
                              gitlabConfigId = gitlabConfigId,
                              modifier = modifier)
  }

  private def modifyProjectGitlabConfig(
      organisationReference: OrganisationReference,
      gitlabConfigId: GitlabConfigId,
      modifier: JsObject)(implicit
      dbSession: DBSession): Future[GitlabConfig] = {
    update(Json.obj("id"                    -> gitlabConfigId,
                    "organisationReference" -> organisationReference),
           modifier,
           upsert = false)
      .flatMap {
        case true =>
          findById(gitlabConfigId).noneToFailed(
            s"Couldn't find gitlab config $gitlabConfigId")
        case _ =>
          throw new RuntimeException(
            "Couldn't remove gitlab config"
          )
      }
  }
}
