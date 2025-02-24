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

import com.auth0.jwk.JwkProviderBuilder
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import core.Validation.ValidationFailedException
import core.{ConfigAware, DBSession, DBSupport, SystemServices}
import models._
import play.api.Logging
import play.api.cache.SyncCacheApi
import play.api.libs.json.Reads
import play.api.mvc._

import java.security.interfaces.{ECPublicKey, RSAPublicKey}
import java.security.spec.X509EncodedKeySpec
import java.security.{KeyFactory, PublicKey}
import java.util.Base64
import java.util.concurrent.TimeUnit
import scala.concurrent.Future.successful
import scala.concurrent.{ExecutionContext, Future}
import scala.language.postfixOps
import scala.util.Try

/** Security actions that should be used by all controllers that need to protect
  * their actions. Can be composed to fine-tune access control.
  */
trait SecurityComponent {
  val systemServices: SystemServices
  val authConfig: AuthConfig
  val jwkProviderCache: SyncCacheApi
}

trait TokenSecurity extends Logging with ConfigAware {
  self: SecurityComponent with DBSupport =>

  private def decodeJWT(token: String) =
    Try(JWT.decode(token))

  private def evaluateSigningAlgorithm(token: DecodedJWT,
                                       config: JWTIssuerConfig) = {

    def algorithmFromPublicKey(pubKey: PublicKey) =
      (token.getAlgorithm, pubKey) match {
        case ("RS256", key: RSAPublicKey) => Some(Algorithm.RSA256(key))
        case ("RS384", key: RSAPublicKey) => Some(Algorithm.RSA384(key))
        case ("RS512", key: RSAPublicKey) => Some(Algorithm.RSA512(key))
        case ("ES256", key: ECPublicKey)  => Some(Algorithm.ECDSA256(key))
        case ("ES384", key: ECPublicKey)  => Some(Algorithm.ECDSA384(key))
        case ("ES512", key: ECPublicKey)  => Some(Algorithm.ECDSA512(key))
        case _                            => None
      }

    def loadJWKProvider(jwk: JWKConfig) = {
      val builder = new JwkProviderBuilder(jwk.url)
      jwk.cache.foreach { cache =>
        builder.cached(cache.cacheSize, cache.expiresIn)
      }
      jwk.rateLimit.foreach { rateLimit =>
        builder.rateLimited(rateLimit.bucketSize,
                            rateLimit.refillRate.toSeconds,
                            TimeUnit.SECONDS)
      }
      jwk.timeouts.foreach { timeouts =>
        builder.timeouts(timeouts.connectTimeout.toMillis.toInt,
                         timeouts.readTimeout.toMillis.toInt)
      }
      builder.build()
    }

    config match {
      // first prio validate by private key
      case JWTIssuerConfig(_, _, Some(pk), _) =>
        token.getAlgorithm match {
          case "HS256" => Some(Algorithm.HMAC256(pk))
          case "HS384" => Some(Algorithm.HMAC384(pk))
          case "HS512" => Some(Algorithm.HMAC512(pk))
          case _       => None
        }
      // second prio validate by static public key
      case JWTIssuerConfig(_, Some(pk), _, _) =>
        val kf = KeyFactory.getInstance(token.getAlgorithm match {
          case alg if alg.startsWith("RS") => "RSA"
          case alg if alg.startsWith("EC") => "EC"
        })
        val keySpecX509 = new X509EncodedKeySpec(Base64.getDecoder.decode(pk))
        val pubKey      = kf.generatePublic(keySpecX509)

        algorithmFromPublicKey(pubKey)

      // third prio validate by jwk
      case JWTIssuerConfig(issuer, _, _, Some(jwkConfig)) =>
        val provider = jwkProviderCache.getOrElseUpdate(issuer) {
          loadJWKProvider(jwkConfig)
        }
        val jwk = provider.get(token.getKeyId)
        algorithmFromPublicKey(jwk.getPublicKey)

      // else validate without a signing key
      case JWTIssuerConfig(_, _, _, _) =>
        Some(Algorithm.none())
    }
  }

  private def validateToken(token: DecodedJWT,
                            config: JWTIssuerConfig,
                            algorithm: Algorithm) =
    Try(
      JWT
        .require(algorithm)
        .withIssuer(config.issuer)
        // Maybe extract to config
        .acceptLeeway(10)
        .build()
        .verify(token))

  private def validateSubjectHasAccess(token: DecodedJWT) = {
    systemServices.lasiusConfig.security.accessRestriction.fold(true) {
      accessConfig =>
        logger.error(
          s"validateSubjectHasAccess: $accessConfig => ${token.getSubject} == ${accessConfig
            .canAccess(token.getSubject)}")
        accessConfig.canAccess(token.getSubject)
    }
  }

  private def resolveAndValidateToken(
      token: String): Either[Throwable, DecodedJWT] = {
    for {
      jwt <- decodeJWT(token).toEither
      _ <-
        if (validateSubjectHasAccess(jwt)) Right(true)
        else
          Left(
            UnauthorizedException(
              s"Access for subject '${jwt.getSubject}' not granted'"))
      config <- authConfig
        .resolveIssuerConfig(jwt.getIssuer)
        .toRight(UnauthorizedException("Could not resolve issuer"))
      algorithm <- evaluateSigningAlgorithm(jwt, config).toRight(
        UnauthorizedException("Could not evaluate signing algorithm"))
      validatedToken <- validateToken(jwt, config, algorithm).toEither
    } yield validatedToken
  }

  def withToken[R](token: String,
                   withinTransaction: Boolean,
                   canCreateNewUser: Boolean)(failed: => Future[R])(
      success: DBSession => Subject => Future[R])(implicit
      context: ExecutionContext): Future[R] = {
    resolveAndValidateToken(token).fold(
      { error =>
        logger.debug(s"Failed decoding JWT token: ${error.getMessage}")
        failed
      },
      { jwt =>
        logger.debug(s"Got validated token: $jwt")
        withDBSession(withinTransaction) { implicit dbSession =>
          authConfig
            .resolveOrCreateUserByJwt(jwt = LasiusJWT(jwt),
                                      canCreateNewUser = canCreateNewUser)
            .flatMap { user =>
              success(dbSession)(Subject(jwt, user))
            }
        }
      }
    )
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

  private def sanitizeHeader(header: String): String =
    if (header.startsWith(LasiusJWT.TOKEN_PREFIX)) {
      header.substring(LasiusJWT.TOKEN_PREFIX.length()).trim
    } else {
      header.trim
    }

  private def extractJwtToken(
      request: RequestHeader
  ): Option[String] =
    request.headers
      .get(LasiusJWT.REQUEST_HEADER_NAME)
      .map(sanitizeHeader)

  /** */
  def HasToken[A](p: BodyParser[A], withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] = {
    Action.async(p) { request =>
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
