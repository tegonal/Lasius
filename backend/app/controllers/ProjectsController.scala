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

import core.{DBSession, SystemServices}
import models._
import org.joda.time.DateTime
import play.api.cache.AsyncCacheApi
import play.api.libs.json.Json
import play.api.mvc.{Action, ControllerComponents, Request, Result}
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{InvitationRepository, ProjectRepository, UserRepository}

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}

class ProjectsController @Inject() (
    controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    projectRepository: ProjectRepository,
    userRepository: UserRepository,
    invitationRepository: InvitationRepository,
    override val authConfig: AuthConfig,
    override val cache: AsyncCacheApi,
    override val reactiveMongoApi: ReactiveMongoApi)(implicit
    ec: ExecutionContext)
    extends BaseLasiusController(controllerComponents) {
  def getProjects(orgId: OrganisationId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          projectRepository
            .findByOrganisation(userOrg.organisationReference)
            .map(p => Ok(Json.toJson(p)))
        }
    }

  def createProject(orgId: OrganisationId): Action[CreateProject] =
    HasUserRole(FreeUser,
                validateJson[CreateProject],
                withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          for {
            _ <- validateNonBlankString("key", request.body.key)
            // create project
            project <- projectRepository
              .create(userOrg.organisationReference, request.body)
            // assign user as project administrator
            _ <- userRepository.assignUserToProject(
              subject.userReference.id,
              userOrg.organisationReference,
              project.getReference(),
              ProjectAdministrator)
          } yield Created(Json.toJson(project))
        }
    }

  def updateProject(orgId: OrganisationId,
                    projectId: ProjectId): Action[UpdateProject] = {
    HasUserRole(FreeUser,
                validateJson[UpdateProject],
                withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectAdministrator) {
          userOrg =>
            for {
              project <- projectRepository
                .findById(projectId)
                .noneToFailed(s"Project ${projectId.value} does not exist")
              _ <- validate(
                project.organisationReference.id == orgId,
                s"Project ${projectId.value} is not assigned to organisation ${orgId.value}")
              // update project
              updatedProject <- projectRepository
                .update(userOrg.organisationReference, projectId, request.body)
              // update key on referenced entities
              _ <- request.body.key.fold(success()) { newKey =>
                for {
                  _ <- userRepository.updateProjectKey(projectId, newKey)
                  _ <- invitationRepository.updateProjectKey(projectId, newKey)
                } yield play.api.mvc.Results.Ok
              }
            } yield Ok(Json.toJson(updatedProject))
        }
    }
  }

  def deactivateProject(orgId: OrganisationId,
                        projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectAdministrator) {
          userOrg =>
            for {
              project <- projectRepository
                .findById(projectId)
                .noneToFailed(s"Project ${projectId.value} does not exist")
              _ <- validate(
                project.organisationReference.id == orgId,
                s"Project ${projectId.value} is not assigned to organisation ${orgId.value}")
              // remove from all users
              _ <- userRepository.unassignAllUsersFromProject(projectId)
              // deactivate project
              _ <- projectRepository.deactivate(userOrg.organisationReference,
                                                projectId)
            } yield Ok("")
        }
    }

  def getUsers(orgId: OrganisationId, projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectMember) { _ =>
          userRepository
            .findByProject(projectId)
            .map(users => Ok(Json.toJson(users.map(_.toStub()))))
        }
    }

  def inviteUser(orgId: OrganisationId,
                 projectId: ProjectId): Action[UserToProjectAssignment] =
    HasUserRole(FreeUser,
                validateJson[UserToProjectAssignment],
                withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectAdministrator) {
          userOrg =>
            for {
              _ <- validateEmail(request.body.email)
              project <- projectRepository
                .findById(projectId)
                .noneToFailed(s"Project ${projectId.value} does not exist")
              _ <- validate(
                project.organisationReference.id == orgId,
                s"Project ${projectId.value} is not assigned to organisation ${orgId.value}")
              _ <- validate(
                project.active,
                s"Cannot invite to an inactive project ${project.key}")
              // create invitation
              invitationId = InvitationId()
              _ <- invitationRepository.upsert(
                JoinProjectInvitation(
                  id = invitationId,
                  invitedEmail = request.body.email,
                  createDate = DateTime.now(),
                  createdBy = subject.userReference,
                  expiration = DateTime.now().plusDays(7),
                  sharedByOrganisationReference = userOrg.organisationReference,
                  projectReference = project.getReference(),
                  role = request.body.role,
                  outcome = None
                ))
            } yield Created(
              Json.toJson(InvitationLink(invitationId, request.body.email)))
        }
    }

  def unassignUser(orgId: OrganisationId,
                   projectId: ProjectId,
                   userId: UserId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectAdministrator) { _ =>
          for {
            project <- projectRepository
              .findById(projectId)
              .noneToFailed(s"Project ${projectId.value} does not exist")
            _ <- userRepository.unassignUserFromProject(userId,
                                                        project.getReference())
          } yield Ok("")
        }
    }

  def unassignMyUser(orgId: OrganisationId,
                     projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          HasProjectRole(userOrg, projectId, ProjectMember) { userProject =>
            for {
              project <- projectRepository
                .findById(projectId)
                .noneToFailed(s"Project ${projectId.value} does not exist")
              _ <- validate(
                project.organisationReference.id == orgId,
                s"Project ${projectId.value} is not assigned to organisation ${orgId.value}")
              _ <- userRepository.unassignUserFromProject(
                subject.userReference.id,
                userProject.projectReference)
            } yield Ok("")
          }
        }
    }
}
