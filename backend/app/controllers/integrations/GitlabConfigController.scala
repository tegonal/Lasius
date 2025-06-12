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

package controllers.integrations

import com.typesafe.config.Config
import controllers.{AuthConfig, BaseLasiusController}
import core.SystemServices
import models._
import play.api.libs.json.Json
import play.api.mvc.{Action, ControllerComponents}
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{
  GitlabConfigRepository,
  JiraConfigRepository,
  PlaneConfigRepository
}

import javax.inject.Inject
import scala.concurrent.ExecutionContext

class GitlabConfigController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val reactiveMongoApi: ReactiveMongoApi,
    gitlabConfigRepository: GitlabConfigRepository)(implicit
    ec: ExecutionContext)
    extends BaseLasiusController() {

  def list(orgId: OrganisationId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            configs <- gitlabConfigRepository
              .getGitlabConfigurationsByOrganisation(
                userOrg.organisationReference)
          } yield Ok(Json.toJson(configs))
        }
    }

  def create(orgId: OrganisationId,
             create: GitlabConfigCreate): Action[GitlabConfigCreate] =
    HasUserRole(FreeUser,
                validateJson[GitlabConfigCreate],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .createGitlabConfiguration(userOrg.organisationReference, create)
          } yield Ok(Json.toJson(config))
        }
    }

  def update(orgId: OrganisationId): Action[GitlabConfigUpdate] =
    HasUserRole(FreeUser,
                validateJson[GitlabConfigUpdate],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .updateGitlabConfiguration(userOrg.organisationReference,
                                         request.body)
          } yield Ok(Json.toJson(config))
        }
    }

  def remove(orgId: OrganisationId,
             gitlabConfigId: GitlabConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            result <- gitlabConfigRepository
              .removeGitlabConfiguration(userOrg.organisationReference,
                                         gitlabConfigId)
          } yield Ok(Json.toJson(result))
        }
    }

  def upsertProject(
      orgId: OrganisationId,
      gitlabConfigId: GitlabConfigId): Action[GitlabProjectMapping] =
    HasUserRole(FreeUser,
                validateJson[GitlabProjectMapping],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .addOrUpdateProjectGitlabConfig(userOrg.organisationReference,
                                              gitlabConfigId,
                                              request.body)
          } yield Ok(Json.toJson(config))
        }
    }

  def removeProject(orgId: OrganisationId,
                    gitlabConfigId: GitlabConfigId,
                    projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .removeProjectGitlabConfig(userOrg.organisationReference,
                                         gitlabConfigId,
                                         projectId)
          } yield Ok(Json.toJson(config))
        }
    }

}
