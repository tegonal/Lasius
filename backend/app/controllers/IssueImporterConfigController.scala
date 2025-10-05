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

package controllers

import com.typesafe.config.Config
import core.SystemServices
import models._
import play.api.libs.json.Json
import play.api.mvc.{Action, ControllerComponents}
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{GitlabConfigRepository, JiraConfigRepository, PlaneConfigRepository}

import javax.inject.Inject
import scala.concurrent.ExecutionContext

class IssueImporterConfigController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val reactiveMongoApi: ReactiveMongoApi,
    gitlabConfigRepository: GitlabConfigRepository,
    jiraConfigRepository: JiraConfigRepository,
    planeConfigRepository: PlaneConfigRepository
)(implicit ec: ExecutionContext)
    extends BaseLasiusController() {

  // ===== GitLab Config Endpoints =====

  def getGitlabConfigs(orgId: OrganisationId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          gitlabConfigRepository
            .findByOrganisation(userOrg.organisationReference.id)
            .map(configs =>
              Ok(Json.toJson(configs.map(GitlabConfigResponse.fromConfig))))
        }
    }

  def getGitlabConfig(orgId: OrganisationId,
                      id: GitlabConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          gitlabConfigRepository
            .findById(id)
            .map {
              case Some(config)
                  if config.organisationReference.id == userOrg.organisationReference.id =>
                Ok(Json.toJson(GitlabConfigResponse.fromConfig(config)))
              case Some(_) =>
                Forbidden(Json.obj("error" -> "Access denied"))
              case None => NotFound(Json.obj("error" -> "GitLab config not found"))
            }
        }
    }

  def getGitlabConfigForProject(orgId: OrganisationId,
                                  projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          gitlabConfigRepository
            .findByProjectId(projectId)
            .map {
              case Some(config)
                  if config.organisationReference.id == userOrg.organisationReference.id =>
                Ok(Json.toJson(GitlabConfigResponse.fromConfig(config)))
              case Some(_) =>
                Forbidden(Json.obj("error" -> "Access denied"))
              case None =>
                NotFound(
                  Json.obj("error" -> "No GitLab config found for project"))
            }
        }
    }

  def createGitlabConfig(
      orgId: OrganisationId): Action[CreateGitlabConfig] =
    HasUserRole(FreeUser,
                validateJson[CreateGitlabConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            _ <- validateNonBlankString("name", request.body.name)
            config <- gitlabConfigRepository.create(userOrg.organisationReference,
                                                     request.body)
          } yield Created(Json.toJson(GitlabConfigResponse.fromConfig(config)))
        }
    }

  def updateGitlabConfig(orgId: OrganisationId,
                          id: GitlabConfigId): Action[UpdateGitlabConfig] =
    HasUserRole(FreeUser,
                validateJson[UpdateGitlabConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .findById(id)
              .noneToFailed("GitLab config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            _ <- request.body.name.fold(success())(name =>
              validateNonBlankString("name", name))
            updated <- gitlabConfigRepository.update(id, request.body)
          } yield Ok(Json.toJson(GitlabConfigResponse.fromConfig(updated)))
        }
    }

  def deleteGitlabConfig(orgId: OrganisationId,
                          id: GitlabConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .findById(id)
              .noneToFailed("GitLab config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            _ <- gitlabConfigRepository.removeById(id)
          } yield Ok("")
        }
    }

  def addGitlabProjectMapping(
      orgId: OrganisationId,
      id: GitlabConfigId): Action[GitlabProjectMapping] =
    HasUserRole(FreeUser,
                validateJson[GitlabProjectMapping],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .findById(id)
              .noneToFailed("GitLab config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- gitlabConfigRepository
              .addProjectMapping(id, request.body)
          } yield Ok(Json.toJson(GitlabConfigResponse.fromConfig(updated)))
        }
    }

  def removeGitlabProjectMapping(orgId: OrganisationId,
                                  id: GitlabConfigId,
                                  projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .findById(id)
              .noneToFailed("GitLab config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- gitlabConfigRepository
              .removeProjectMapping(id, projectId)
          } yield Ok(Json.toJson(GitlabConfigResponse.fromConfig(updated)))
        }
    }

  def updateGitlabProjectMapping(
      orgId: OrganisationId,
      id: GitlabConfigId,
      projectId: ProjectId): Action[GitlabProjectSettings] =
    HasUserRole(FreeUser,
                validateJson[GitlabProjectSettings],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- gitlabConfigRepository
              .findById(id)
              .noneToFailed("GitLab config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- gitlabConfigRepository
              .updateProjectMapping(id, projectId, request.body)
          } yield Ok(Json.toJson(GitlabConfigResponse.fromConfig(updated)))
        }
    }

  // ===== Jira Config Endpoints =====

  def getJiraConfigs(orgId: OrganisationId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          jiraConfigRepository
            .findByOrganisation(userOrg.organisationReference.id)
            .map(configs =>
              Ok(Json.toJson(configs.map(JiraConfigResponse.fromConfig))))
        }
    }

  def getJiraConfig(orgId: OrganisationId, id: JiraConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          jiraConfigRepository
            .findById(id)
            .map {
              case Some(config)
                  if config.organisationReference.id == userOrg.organisationReference.id =>
                Ok(Json.toJson(JiraConfigResponse.fromConfig(config)))
              case Some(_) =>
                Forbidden(Json.obj("error" -> "Access denied"))
              case None => NotFound(Json.obj("error" -> "Jira config not found"))
            }
        }
    }

  def getJiraConfigForProject(orgId: OrganisationId,
                                projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          jiraConfigRepository
            .findByProjectId(projectId)
            .map {
              case Some(config)
                  if config.organisationReference.id == userOrg.organisationReference.id =>
                Ok(Json.toJson(JiraConfigResponse.fromConfig(config)))
              case Some(_) =>
                Forbidden(Json.obj("error" -> "Access denied"))
              case None =>
                NotFound(Json.obj("error" -> "No Jira config found for project"))
            }
        }
    }

  def createJiraConfig(orgId: OrganisationId): Action[CreateJiraConfig] =
    HasUserRole(FreeUser,
                validateJson[CreateJiraConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            _ <- validateNonBlankString("name", request.body.name)
            config <- jiraConfigRepository.create(userOrg.organisationReference,
                                                   request.body)
          } yield Created(Json.toJson(JiraConfigResponse.fromConfig(config)))
        }
    }

  def updateJiraConfig(orgId: OrganisationId,
                        id: JiraConfigId): Action[UpdateJiraConfig] =
    HasUserRole(FreeUser,
                validateJson[UpdateJiraConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- jiraConfigRepository
              .findById(id)
              .noneToFailed("Jira config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            _ <- request.body.name.fold(success())(name =>
              validateNonBlankString("name", name))
            updated <- jiraConfigRepository.update(id, request.body)
          } yield Ok(Json.toJson(JiraConfigResponse.fromConfig(updated)))
        }
    }

  def deleteJiraConfig(orgId: OrganisationId, id: JiraConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- jiraConfigRepository
              .findById(id)
              .noneToFailed("Jira config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            _ <- jiraConfigRepository.removeById(id)
          } yield Ok("")
        }
    }

  def addJiraProjectMapping(
      orgId: OrganisationId,
      id: JiraConfigId): Action[JiraProjectMapping] =
    HasUserRole(FreeUser,
                validateJson[JiraProjectMapping],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- jiraConfigRepository
              .findById(id)
              .noneToFailed("Jira config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- jiraConfigRepository
              .addProjectMapping(id, request.body)
          } yield Ok(Json.toJson(JiraConfigResponse.fromConfig(updated)))
        }
    }

  def removeJiraProjectMapping(orgId: OrganisationId,
                                id: JiraConfigId,
                                projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- jiraConfigRepository
              .findById(id)
              .noneToFailed("Jira config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- jiraConfigRepository
              .removeProjectMapping(id, projectId)
          } yield Ok(Json.toJson(JiraConfigResponse.fromConfig(updated)))
        }
    }

  def updateJiraProjectMapping(orgId: OrganisationId,
                                id: JiraConfigId,
                                projectId: ProjectId): Action[JiraProjectSettings] =
    HasUserRole(FreeUser,
                validateJson[JiraProjectSettings],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- jiraConfigRepository
              .findById(id)
              .noneToFailed("Jira config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- jiraConfigRepository
              .updateProjectMapping(id, projectId, request.body)
          } yield Ok(Json.toJson(JiraConfigResponse.fromConfig(updated)))
        }
    }

  // ===== Plane Config Endpoints =====

  def getPlaneConfigs(orgId: OrganisationId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          planeConfigRepository
            .findByOrganisation(userOrg.organisationReference.id)
            .map(configs =>
              Ok(Json.toJson(configs.map(PlaneConfigResponse.fromConfig))))
        }
    }

  def getPlaneConfig(orgId: OrganisationId, id: PlaneConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          planeConfigRepository
            .findById(id)
            .map {
              case Some(config)
                  if config.organisationReference.id == userOrg.organisationReference.id =>
                Ok(Json.toJson(PlaneConfigResponse.fromConfig(config)))
              case Some(_) =>
                Forbidden(Json.obj("error" -> "Access denied"))
              case None => NotFound(Json.obj("error" -> "Plane config not found"))
            }
        }
    }

  def getPlaneConfigForProject(orgId: OrganisationId,
                                 projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          planeConfigRepository
            .findByProjectId(projectId)
            .map {
              case Some(config)
                  if config.organisationReference.id == userOrg.organisationReference.id =>
                Ok(Json.toJson(PlaneConfigResponse.fromConfig(config)))
              case Some(_) =>
                Forbidden(Json.obj("error" -> "Access denied"))
              case None =>
                NotFound(
                  Json.obj("error" -> "No Plane config found for project"))
            }
        }
    }

  def createPlaneConfig(orgId: OrganisationId): Action[CreatePlaneConfig] =
    HasUserRole(FreeUser,
                validateJson[CreatePlaneConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            _ <- validateNonBlankString("name", request.body.name)
            config <- planeConfigRepository.create(userOrg.organisationReference,
                                                    request.body)
          } yield Created(Json.toJson(PlaneConfigResponse.fromConfig(config)))
        }
    }

  def updatePlaneConfig(orgId: OrganisationId,
                         id: PlaneConfigId): Action[UpdatePlaneConfig] =
    HasUserRole(FreeUser,
                validateJson[UpdatePlaneConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- planeConfigRepository
              .findById(id)
              .noneToFailed("Plane config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            _ <- request.body.name.fold(success())(name =>
              validateNonBlankString("name", name))
            updated <- planeConfigRepository.update(id, request.body)
          } yield Ok(Json.toJson(PlaneConfigResponse.fromConfig(updated)))
        }
    }

  def deletePlaneConfig(orgId: OrganisationId,
                         id: PlaneConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- planeConfigRepository
              .findById(id)
              .noneToFailed("Plane config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            _ <- planeConfigRepository.removeById(id)
          } yield Ok("")
        }
    }

  def addPlaneProjectMapping(
      orgId: OrganisationId,
      id: PlaneConfigId): Action[PlaneProjectMapping] =
    HasUserRole(FreeUser,
                validateJson[PlaneProjectMapping],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- planeConfigRepository
              .findById(id)
              .noneToFailed("Plane config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- planeConfigRepository
              .addProjectMapping(id, request.body)
          } yield Ok(Json.toJson(PlaneConfigResponse.fromConfig(updated)))
        }
    }

  def removePlaneProjectMapping(orgId: OrganisationId,
                                 id: PlaneConfigId,
                                 projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- planeConfigRepository
              .findById(id)
              .noneToFailed("Plane config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- planeConfigRepository
              .removeProjectMapping(id, projectId)
          } yield Ok(Json.toJson(PlaneConfigResponse.fromConfig(updated)))
        }
    }

  def updatePlaneProjectMapping(
      orgId: OrganisationId,
      id: PlaneConfigId,
      projectId: ProjectId): Action[PlaneProjectSettings] =
    HasUserRole(FreeUser,
                validateJson[PlaneProjectSettings],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- planeConfigRepository
              .findById(id)
              .noneToFailed("Plane config not found")
            _ <- validate(
              config.organisationReference.id == userOrg.organisationReference.id,
              "Access denied")
            updated <- planeConfigRepository
              .updateProjectMapping(id, projectId, request.body)
          } yield Ok(Json.toJson(PlaneConfigResponse.fromConfig(updated)))
        }
    }
}
