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

import com.google.inject.ImplementedBy
import controllers.security.UnauthorizedException
import core.{DBSession, SystemServices}
import helpers.UserHelper
import models.UserId.UserReference
import models._
import play.api.libs.json.Json.toJsFieldJsValueWrapper
import play.api.libs.json._
import play.api.mvc._
import repositories.{
  OrganisationRepository,
  SecurityRepositoryComponent,
  UserRepository
}
import services.OpaqueTokenService

import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future, Promise}

@ImplementedBy(classOf[DefaultAuthConfig])
trait AuthConfig {

  val opaqueTokenService: OpaqueTokenService

  def resolveIssuerConfig(issuer: String): Option[IssuerConfig]

  def issuerConfigs(): Seq[IssuerConfig]

  /** Map usertype to permission role.
    */
  def authorizeUser(user: User, role: UserRole)(implicit
      ctx: ExecutionContext): Future[Boolean]

  def authorizeUserOrganisation(userOrganisation: UserOrganisation,
                                role: OrganisationRole)(implicit
      ctx: ExecutionContext): Future[Boolean]

  def authorizeUserProject(userProject: UserProject, role: ProjectRole)(implicit
      ctx: ExecutionContext): Future[Boolean]

  /** Resolve user based on bson object id
    */
  def resolveUser(userReference: UserReference)(implicit
      context: ExecutionContext,
      dbSession: DBSession): Future[Option[User]]

  /** Lookup user by token
    */
  def resolveOrCreateUserByUserInfo(userInfo: UserInfo,
                                    canCreateNewUser: Boolean = true)(implicit
      context: ExecutionContext,
      dbSession: DBSession): Future[UserReference]

  /** Defined handling of authorizationfailed
    */
  def authorizationFailed(request: RequestHeader)(implicit
      context: ExecutionContext): Future[Result]
}

class DefaultAuthConfig @Inject() (
    controllerComponents: ControllerComponents,
    systemServices: SystemServices,
    override val userRepository: UserRepository,
    override val opaqueTokenService: OpaqueTokenService,
    val organisationRepository: OrganisationRepository)
    extends AbstractController(controllerComponents)
    with AuthConfig
    with UserHelper
    with SecurityRepositoryComponent {

  override def resolveIssuerConfig(issuer: String): Option[IssuerConfig] =
    systemServices.lasiusConfig.security.allowedIssuers.find(_.issuer == issuer)

  override def issuerConfigs(): Seq[IssuerConfig] =
    systemServices.lasiusConfig.security.allowedIssuers

  /** Map usertype to permission role.
    */
  override def authorizeUser(user: User, role: UserRole)(implicit
      ctx: ExecutionContext): Future[Boolean] =
    Future.successful((user.role, role) match {
      case (x, y) => x == y || x == Administrator
      case _      => false
    })

  override def authorizeUserOrganisation(userOrganisation: UserOrganisation,
                                         role: OrganisationRole)(implicit
      ctx: ExecutionContext): Future[Boolean] =
    Future.successful((userOrganisation.role, role) match {
      case (x, y) => x == y || x == OrganisationAdministrator
      case _      => false
    })

  override def authorizeUserProject(userProject: UserProject,
                                    role: ProjectRole)(implicit
      ctx: ExecutionContext): Future[Boolean] =
    Future.successful((userProject.role, role) match {
      case (x, y) => x == y || x == ProjectAdministrator
      case _      => false
    })

  override def resolveUser(userReference: UserReference)(implicit
      context: ExecutionContext,
      dbSession: DBSession): Future[Option[User]] =
    userRepository.findByUserReference(userReference)

  override def resolveOrCreateUserByUserInfo(
      userInfo: UserInfo,
      canCreateNewUser: Boolean = true)(implicit
      context: ExecutionContext,
      dbSession: DBSession): Future[UserReference] = {

    userRepository.findByEmail(userInfo.email).flatMap {
      case Some(user)               => Future.successful(user.getReference)
      case None if canCreateNewUser =>
        DefaultAuthConfig.createOnce(userInfo.email)(createUser(userInfo))
      case None =>
        Future.failed(
          UnauthorizedException("Cannot find user for provided jwt token"))
    }
  }

  private def createUser(userInfo: UserInfo)(implicit
      context: ExecutionContext,
      dbSession: DBSession): Future[UserReference] =
    // Another request can create the user between the first lookup and the lock.
    userRepository.findByEmail(userInfo.email).flatMap {
      case Some(user) => Future.successful(user.getReference)
      case None       =>
        for {
          // Create new private organisation
          newOrg <- organisationRepository.create(
            userInfo.key,
            `private` = true)(systemServices.systemSubject, dbSession)
          // Create new user and assign to private organisation
          user <- userRepository.createInitialUserBasedOnProfile(
            userInfo,
            newOrg,
            OrganisationAdministrator)
        } yield user.getReference
    }

  override def authorizationFailed(request: RequestHeader)(implicit
      context: ExecutionContext): Future[Result] =
    Future.successful(Forbidden(Json.obj("message" -> "Unauthorized")))
}

object DefaultAuthConfig {

  // The first page of a new user sends several requests at once, and each one created a user.
  // The map lives in the JVM, so it covers one backend instance, as the operator runbook requires.
  private val pendingCreations =
    new ConcurrentHashMap[String, Future[UserReference]]()

  /** Runs `create` once per email; a concurrent call for the same email waits
    * for that result.
    */
  private[controllers] def createOnce(email: String)(
      create: => Future[UserReference])(implicit
      context: ExecutionContext): Future[UserReference] = {
    val promise = Promise[UserReference]()
    Option(pendingCreations.putIfAbsent(email, promise.future)).getOrElse {
      promise.completeWith(Future.delegate(create))
      promise.future.onComplete(_ =>
        pendingCreations.remove(email, promise.future))
      promise.future
    }
  }
}
