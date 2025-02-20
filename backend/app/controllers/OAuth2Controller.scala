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

import com.google.inject.Inject
import com.typesafe.config.Config
import core.SystemServices
import models._
import org.apache.pekko.http.scaladsl.model.StatusCodes
import play.api.cache.SyncCacheApi
import play.api.libs.json.Json
import play.api.mvc._
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{
  OAuthAccessTokenRepository,
  OAuthAuthorizationCodeRepository,
  OAuthUserRepository
}
import scalaoauth2.provider._

import java.net.URLEncoder
import scala.concurrent.{ExecutionContext, Future}

class OAuth2Controller @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val reactiveMongoApi: ReactiveMongoApi,
    private val oauthUserRepository: OAuthUserRepository,
    private val oauthAccessTokenRepository: OAuthAccessTokenRepository,
    private val oauthAuthorizationCodeRepository: OAuthAuthorizationCodeRepository,
    override val jwkProviderCache: SyncCacheApi)(implicit ec: ExecutionContext)
    extends BaseLasiusController()
    with OAuth2Provider {

  override val tokenEndpoint: TokenEndpoint = new OAuth2TokenEndpoint()

  private val dataHandler = new SimpleInternalDataHandler(
    supportTransaction = supportTransaction,
    reactiveMongoApi = reactiveMongoApi,
    oauthUserRepository = oauthUserRepository,
    oauthAccessTokenRepository = oauthAccessTokenRepository,
    oauthAuthorizationCodeRepository = oauthAuthorizationCodeRepository,
    config = systemServices.lasiusConfig
  )

  private def ifLasiusOAuth2ProviderEnabled(block: => Future[Result]) =
    ifFeatureEnabled(
      systemServices.lasiusConfig.security.oauth2Provider.enabled)(block)

  private def ifFeatureEnabled(featureEnabled: Boolean)(
      block: => Future[Result]) =
    if (featureEnabled) {
      block
    } else {
      Future.successful(NotFound)
    }

  def accessToken: Action[AnyContent] = Action.async { implicit request =>
    ifLasiusOAuth2ProviderEnabled {
      issueAccessToken(dataHandler)
    }
  }

  def login(): Action[OAuthAuthorizationCodeLoginRequest] =
    Action.async(validateJson[OAuthAuthorizationCodeLoginRequest]) { request =>
      ifLasiusOAuth2ProviderEnabled {
        checked {
          withinTransaction { implicit dbSession =>
            for {
              maybeUser <- oauthUserRepository.authenticate(
                request.body.email,
                request.body.password)
              result <- maybeUser.fold[Future[Result]](
                Future.successful(Unauthorized)) { user =>
                oauthAuthorizationCodeRepository
                  .register(request.body, user)
                  .map { code =>
                    Redirect(
                      s"${code.redirectUri}?state=${request.body.state
                        .map(URLEncoder.encode(_, "UTF-8"))
                        .getOrElse("")}&code=${URLEncoder.encode(code.code, "UTF-8")}",
                      StatusCodes.Found.intValue
                    )
                  }
              }
            } yield result
          }
        }
      }
    }

  def userProfile(): Action[Unit] =
    HasAccessToken(p = parse.empty) { _ => user =>
      ifLasiusOAuth2ProviderEnabled {
        Future.successful(Ok(Json.toJson(user.user.copy(password = ""))))
      }
    }

  def changePassword(): Action[PasswordChangeRequest] =
    HasToken(validateJson[PasswordChangeRequest], withinTransaction = false) {
      implicit dbSession => implicit subject => implicit request =>
        ifLasiusOAuth2ProviderEnabled {
          checked {
            for {
              _ <- oauthUserRepository.changePassword(
                subject.extendedJwtClaims.email,
                request.body)
            } yield Ok("")
          }
        }
    }

  def registerUser(): Action[OAuthUserRegistration] =
    Action.async(validateJson[OAuthUserRegistration]) { request =>
      ifFeatureEnabled(
        systemServices.lasiusConfig.security.oauth2Provider.enabled &&
          systemServices.lasiusConfig.security.oauth2Provider.allowRegisterUsers) {
        checked {
          withinTransaction { implicit dbSession =>
            for {
              // TODO: validate email address matches regex of allowed users to access lasius
              // Create new user
              user <- oauthUserRepository.create(request.body)
            } yield Ok(Json.toJson(user.id))
          }
        }
      }
    }

  private def HasAccessToken[A](p: BodyParser[A])(
      f: Request[A] => AuthInfo[OAuthUser] => Future[Result]): Action[A] = {
    Action.async(p) { implicit request =>
      val x = request.headers
        .get("Authorization")
        .map {
          case bearerRegex(token) =>
            for {
              accessToken <- dataHandler
                .findAccessToken(token)
                .noneToFailed("Could not find accessToken")
              user <- dataHandler
                .findAuthInfoByAccessToken(accessToken)
                .noneToFailed("Could not find authInfo for accessToken")
              result <- f(request)(user)
            } yield result
          case _ => Future.successful(Unauthorized("Invalid token"))
        }
        .getOrElse(Future.successful(Unauthorized("Missing token")))

      x
    }
  }

  private val bearerRegex = "Bearer (.*)".r
}
