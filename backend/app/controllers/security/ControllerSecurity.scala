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

package controllers.security

import com.typesafe.config.Config
import controllers.AuthConfig
import core.Validation.ValidationFailedException
import core.{DBSession, DBSupport, SystemServices}
import models._
import play.api.libs.json.Reads
import play.api.mvc._

import scala.concurrent.Future.successful
import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps

/** Security actions that should be used by all controllers that need to protect
  * their actions. Can be composed to fine-tune access control.
  */
trait SecurityComponent {
  val systemServices: SystemServices
  val authConfig: AuthConfig
}

trait ControllerSecurity extends TokenSecurity {
  self: BaseController with SecurityComponent with DBSupport =>

  private def TOKEN_REQUEST_HEADER_NAME(implicit conf: Config): String =
    if (conf.hasPath("play.http.session.tokenHeaderName"))
      conf.getString("play.http.session.tokenHeaderName")
    else "Authorization"

  private def TOKEN_PREFIX(implicit conf: Config): String = {
    if (conf.hasPath("play.http.session.tokenPrefix"))
      conf.getString("play.http.session.tokenPrefix")
    else "Bearer "
  }

  private def TOKEN_ISSUER_REQUEST_HEADER_NAME(implicit conf: Config): String =
    if (conf.hasPath("play.http.session.tokenIssuerHeaderName"))
      conf.getString("play.http.session.tokenIssuerHeaderName")
    else "X-Token-Issuer"

  def HasToken[A](withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext,
      reader: Reads[A]): Action[A] = {
    HasToken(parse.json[A], withinTransaction)(f)
  }

  private def sanitizeHeader(header: String): String =
    if (header.startsWith(TOKEN_PREFIX)) {
      header.substring(TOKEN_PREFIX.length()).trim
    } else {
      header.trim
    }

  private def extractBearerToken(
      request: RequestHeader
  ): Option[String] =
    request.headers
      .get(TOKEN_REQUEST_HEADER_NAME)
      .map(sanitizeHeader)

  private def extractTokenIssuerHeader(
      request: RequestHeader
  ): Option[String] =
    request.headers
      .get(TOKEN_ISSUER_REQUEST_HEADER_NAME)
      .map(_.trim)

  /** */
  def HasToken[A](p: BodyParser[A], withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] = {
    Action.async(p) { request =>
      extractBearerToken(request).fold {
        successful(Unauthorized("No token found"))
      } { token =>
        withToken(tokenIssuer = extractTokenIssuerHeader(request),
                  token = token,
                  withinTransaction = withinTransaction,
                  canCreateNewUser = true) {
          successful(Unauthorized(s"Invalid token provided $token"))
        } { dbSession => subject =>
          f(dbSession)(subject)(request)
        }
      }
    }
  }

  def HasUserRole[A, R <: UserRole](role: R, withinTransaction: Boolean)(
      f: DBSession => Subject => User => Request[A] => Future[Result])(implicit
      context: ExecutionContext,
      reader: Reads[A]): Action[A] = {
    HasUserRole(role, parse.json[A], withinTransaction)(f)
  }

  def HasUserRole[A, R <: UserRole](role: R,
                                    p: BodyParser[A],
                                    withinTransaction: Boolean)(
      f: DBSession => Subject => User => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] = {
    HasToken(p, withinTransaction) {
      implicit dbSession => implicit subject => implicit request =>
        {
          checked(authConfig.resolveUser(subject.userReference).flatMap {
            case Some(user) if user.active =>
              authConfig
                .authorizeUser(user, role)
                .flatMap {
                  case true => f(dbSession)(subject)(user)(request)
                  case _    => authConfig.authorizationFailed(request)
                }
            case _ => authConfig.authorizationFailed(request)
          })
        }
    }
  }

  def HasOptionalOrganisationRole[A, R <: OrganisationRole](
      user: User,
      maybeOrganisation: Option[OrganisationId],
      role: R)(f: Option[UserOrganisation] => Future[Result])(implicit
      context: ExecutionContext,
      request: Request[A]): Future[Result] = {
    maybeOrganisation
      .fold(f(None))(orgId =>
        HasOrganisationRole(user, orgId, role)(userOrg => f(Some(userOrg))))
  }

  def HasOrganisationRole[A, R <: OrganisationRole](user: User,
                                                    orgId: OrganisationId,
                                                    role: R)(
      f: UserOrganisation => Future[Result])(implicit
      context: ExecutionContext,
      request: Request[A]): Future[Result] = {
    checked(user.organisations.find(_.organisationReference.id == orgId) match {
      case Some(userOrganisation) =>
        authConfig
          .authorizeUserOrganisation(userOrganisation, role)
          .flatMap {
            case true => f(userOrganisation)
            case _    => authConfig.authorizationFailed(request)
          }
      case _ => authConfig.authorizationFailed(request)
    })
  }

  def HasProjectRole[A, R <: ProjectRole](userOrganisation: UserOrganisation,
                                          projectId: ProjectId,
                                          role: R)(
      f: UserProject => Future[Result])(implicit
      context: ExecutionContext,
      request: Request[A]): Future[Result] = {
    checked(
      userOrganisation.projects.find(_.projectReference.id == projectId) match {
        case Some(userProject) =>
          authConfig
            .authorizeUserProject(userProject, role)
            .flatMap {
              case true => f(userProject)
              case _    => authConfig.authorizationFailed(request)
            }
        case _ => authConfig.authorizationFailed(request)
      })
  }

  /** This helper method checks if a user has at least the role
    * OrganisationMember and is either OrganisationAdministrator or has provided
    * project role
    */
  protected def isOrgAdminOrHasProjectRoleInOrganisation[A](
      user: User,
      orgId: OrganisationId,
      projectId: ProjectId,
      projectRole: ProjectRole)(f: UserOrganisation => Future[Result])(implicit
      context: ExecutionContext,
      request: Request[A]): Future[Result] = {
    HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
      // either org admin or project admin
      val projectToCheck = if (userOrg.role == OrganisationAdministrator) {
        None
      } else {
        Some(projectId)
      }
      HasOptionalProjectRole(userOrg, projectToCheck, projectRole) { _ =>
        f(userOrg)
      }
    }
  }

  def HasOptionalProjectRole[A, R <: ProjectRole](
      userOrganisation: UserOrganisation,
      maybeProjectId: Option[ProjectId],
      role: R)(f: Option[UserProject] => Future[Result])(implicit
      context: ExecutionContext,
      request: Request[A]): Future[Result] = {
    maybeProjectId
      .fold(f(None))(projectId =>
        HasProjectRole(userOrganisation, projectId, role)(userProject =>
          f(Some(userProject))))
  }

  def checked(f: => Future[Result])(implicit
      context: ExecutionContext): Future[Result] = {
    f.recoverWith {
      case e: ValidationFailedException =>
        logger.debug(s"Validation error", e)
        successful(
          BadRequest(Option(e.getMessage).getOrElse(e.getClass.getSimpleName)))
      case e: UnauthorizedException =>
        logger.debug(s"UnauthorizedException", e)
        successful(
          Unauthorized(
            Option(e.getMessage).getOrElse(e.getClass.getSimpleName)))
      case e =>
        logger.error(s"Unknown Error", e)
        successful(
          InternalServerError(
            Option(e.getMessage).getOrElse(e.getClass.getSimpleName)))
    }
  }
}

case class UnauthorizedException(message: String)
    extends RuntimeException(message)
