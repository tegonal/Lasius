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

import controllers.security.{ControllerSecurity, SecurityComponent}
import core.{DBSession, DBSupport}
import helpers.UserHelper
import models._
import org.specs2.mock.Mockito
import play.api.Logging
import play.api.mvc._
import repositories.{SecurityRepositoryComponent, UserRepository}
import util.MockAwaitable

import scala.concurrent.{ExecutionContext, Future}

trait SecurityControllerMock
    extends Logging
    with ControllerSecurity
    with UserHelper
    with SecurityRepositoryComponent
    with MockAwaitable
    with Mockito {
  self: BaseController with DBSupport with SecurityComponent =>
  val userRepository: UserRepository = mockAwaitable[UserRepository]

  val token: String                          = ""
  val userId: UserId                         = UserId()
  val userKey: String                        = "someUserId"
  val userReference: EntityReference[UserId] = EntityReference(userId, userKey)
  val organisationId: OrganisationId         = OrganisationId()
  val organisationRole: OrganisationRole     = OrganisationAdministrator
  val isOrganisationPrivate: Boolean         = false
  val organisationActive: Boolean            = true
  val organisation: Organisation             = Organisation(
    id = organisationId,
    key = "MyOrg",
    `private` = isOrganisationPrivate,
    active = organisationActive,
    createdBy = userReference,
    deactivatedBy = None
  )

  val userInfo: UserInfo = UserInfo(
    key = "system",
    email = "system@lasius.ch",
    firstName = None,
    lastName = None
  )

  val projectActive: Boolean = true
  val project: Project       =
    Project(
      id = ProjectId(),
      key = "project1",
      organisationReference = organisation.getReference,
      bookingCategories = Set(SimpleTag(TagId("tag1"))),
      active = projectActive,
      createdBy = userReference,
      deactivatedBy = None
    )
  val projectRole: ProjectRole = ProjectAdministrator
  val userProject: UserProject = UserProject(
    sharedByOrganisationReference = None,
    projectReference = project.getReference,
    role = projectRole
  )
  val userOrganisation: UserOrganisation = UserOrganisation(
    organisationReference = organisation.getReference,
    `private` = organisation.`private`,
    role = organisationRole,
    plannedWorkingHours = WorkingHours(),
    projects = Seq(userProject)
  )
  val userActive: Boolean = true
  val user: User          = User(
    userId,
    userKey,
    email = "user@user.com",
    firstName = "test",
    lastName = "user",
    active = userActive,
    role = Administrator,
    organisations = Seq(userOrganisation),
    settings = None,
    acceptedTOS = None
  )
  val authorizationFailedResult: Result = null

  override def HasToken[A](p: BodyParser[A], withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] = {
    Action.async(p) { implicit request =>
      withDBSession() { dbSession =>
        checked(f(dbSession)(Subject("", userInfo, userReference))(request))
      }
    }
  }

  override def HasUserRole[A, R <: UserRole](role: R,
                                             p: BodyParser[A],
                                             withinTransaction: Boolean)(
      f: DBSession => Subject => User => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] = {
    Action.async(p) { implicit request =>
      withDBSession() { dbSession =>
        checked(
          f(dbSession)(Subject("", userInfo, userReference))(user)(request))
      }
    }
  }
}
