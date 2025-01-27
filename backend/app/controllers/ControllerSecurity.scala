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

import core.Validation.ValidationFailedException
import core.{DBSession, DBSupport}
import models.ExtendedJwtSession
import models._
import pdi.jwt.JwtSession.RichRequestHeader
import play.api.{Configuration, Logging}
import play.api.libs.json.Reads
import play.api.mvc._
import com.typesafe.config.Config
import pdi.jwt.{JwtOptions, JwtSession}

import java.time.Clock
import scala.concurrent.Future.successful
import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps

/** Security actions that should be used by all controllers that need to protect
  * their actions. Can be composed to fine-tune access control.
  */

trait JWTSessionSupport {
  val conf: Config
  implicit val playConf: Configuration = Configuration(conf)

  implicit val clock: Clock = Clock.systemUTC
}

trait SecurityComponent extends JWTSessionSupport {
  val authConfig: AuthConfig
}

trait TokenSecurity extends Logging {
  self: SecurityComponent with DBSupport =>
  private def sanitizeHeader(header: String): String =
    if (header.startsWith(JwtSession.TOKEN_PREFIX)) {
      header.substring(JwtSession.TOKEN_PREFIX.length()).trim
    } else {
      header.trim
    }

  private def deserializeJwtSession(token: String) = {
    JwtSession.deserialize(token,
                           JwtOptions(
                             signature = true,
                             notBefore = true,
                             expiration = true,
                             leeway = 60
                           ))
  }

  /** Override extracting jwt session to be able to overrule validation
    * behaviour
    * @param request
    * @return
    */
  protected def extractJwtToken(
      request: RequestHeader
  ): Option[String] =
    request.headers
      .get(JwtSession.REQUEST_HEADER_NAME)
      .map(sanitizeHeader)

  def withToken[R](token: String,
                   withinTransaction: Boolean,
                   canCreateNewUser: Boolean)(failed: => Future[R])(
      success: DBSession => Subject => Future[R])(implicit
      context: ExecutionContext): Future[R] = {
    val jwtSession = deserializeJwtSession(token)
    if (jwtSession.claim.issuer.isEmpty) {
      failed
    } else {
      logger.debug(s"Got token: $jwtSession")
      // TODO: verify issuer based on configuration

      withDBSession(withinTransaction) { implicit dbSession =>
        authConfig
          .resolveOrCreateUserByJwt(jwt = ExtendedJwtSession(jwtSession),
                                    canCreateNewUser = canCreateNewUser)
          .flatMap { user =>
            success(dbSession)(Subject(jwtSession, user))
          }
      }
    }
  }
}

trait ControllerSecurity extends TokenSecurity {
  self: BaseController with SecurityComponent with DBSupport =>

  def HasToken[A](withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext,
      reader: Reads[A]): Action[A] = {
    HasToken(parse.json[A], withinTransaction)(f)
  }

  /** */
  def HasToken[A](p: BodyParser[A], withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] = {
    Action.async(p) { request =>
      if (request.hasJwtHeader) {
        extractJwtToken(request).fold {
          successful(Unauthorized("No JWT token found"))
        } { token =>
          withToken(token = token,
                    withinTransaction = withinTransaction,
                    canCreateNewUser = true) {
            successful(Unauthorized(s"Invalid JWT token provided $token"))
          } { dbSession => subject =>
            f(dbSession)(subject)(request)
          }
        }
      } else {
        successful(Unauthorized("No JWT token found"))
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
