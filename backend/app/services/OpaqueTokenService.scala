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

package services

import com.google.inject.ImplementedBy
import models.{OpaqueTokenIssuerConfig, TokenValidatorType, UserInfo}
import play.api.Logging
import play.api.libs.json.{Format, JsObject, Json}
import play.api.libs.ws.{WSAuthScheme, WSClient, WSResponse}
import services.OpaqueTokenServiceImpl.VALIDATOR_MAP

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}

@ImplementedBy(classOf[OpaqueTokenServiceImpl])
trait OpaqueTokenService {
  def introspectToken(config: OpaqueTokenIssuerConfig, opaqueToken: String)(
      implicit ec: ExecutionContext): Future[Boolean]

  def userInfo(config: OpaqueTokenIssuerConfig, opaqueToken: String)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]]
}

case class ExternalServiceCallFailed(msg: String) extends Exception

class OpaqueTokenServiceImpl @Inject() (ws: WSClient)
    extends OpaqueTokenService
    with Logging {

  private def resolveTokenValidator(
      config: OpaqueTokenIssuerConfig): AuthTokenValidator =
    VALIDATOR_MAP.getOrElse(
      config.tokenValidatorType,
      throw new IllegalStateException(
        s"Missing token validator mapping for ${config.tokenValidatorType}"))

  override def introspectToken(config: OpaqueTokenIssuerConfig,
                               opaqueToken: String)(implicit
      ec: ExecutionContext): Future[Boolean] = {

    val tokenValidator   = resolveTokenValidator(config)
    val introspectionUri = tokenValidator.introspectionUri(config)

    logger.debug(s"introspectToken: url=$introspectionUri")
    val request = ws.url(introspectionUri)
    val data    = tokenValidator.createIntrospectionPayload(config, opaqueToken)

    request
      .addHttpHeaders("Accept" -> "application/json")
      .withAuth(config.clientId, config.clientSecret, WSAuthScheme.BASIC)
      .post(data)
      .flatMap(
        tokenValidator.handleIntrospectionResult(ws, config, opaqueToken, _))
  }

  override def userInfo(config: OpaqueTokenIssuerConfig, opaqueToken: String)(
      implicit ec: ExecutionContext): Future[Option[UserInfo]] = {
    val tokenValidator = resolveTokenValidator(config)
    val userInfoUri    = tokenValidator.userInfoUri(config)
    logger.debug(s"userInfo: url=${userInfoUri}")
    val request = ws.url(userInfoUri)
    request
      .addHttpHeaders("Accept" -> "application/json")
      // TODO: verify that other providers expect the token without base64 encoding. Otherwise introduce a configuration flag
      .addHttpHeaders("Authorization" -> s"Bearer $opaqueToken")
      .get()
      .flatMap(tokenValidator.handleUserInfoResult(ws, config, opaqueToken, _))
  }
}

object OpaqueTokenServiceImpl {
  val VALIDATOR_MAP: Map[TokenValidatorType, AuthTokenValidator] = Map(
    TokenValidatorType.OIDC   -> new OIDCTokenValidator(),
    TokenValidatorType.Github -> new GithubTokenValidator()
  )
}

sealed trait AuthTokenValidator extends Logging {
  def createIntrospectionPayload(config: OpaqueTokenIssuerConfig,
                                 token: String): JsObject

  def introspectionUri(config: OpaqueTokenIssuerConfig): String =
    s"${config.issuer}${config.introspectionPath.getOrElse("")}"

  def handleIntrospectionResult(wsClient: WSClient,
                                config: OpaqueTokenIssuerConfig,
                                token: String,
                                response: WSResponse)(implicit
      ec: ExecutionContext): Future[Boolean] = {
    response.status match {
      case 200 =>
        handleIntrospectionSuccessResult(wsClient, config, token, response)
      case code =>
        handleIntrospectionFailedResult(wsClient, config, token, response)
    }
  }

  protected def handleIntrospectionSuccessResult(
      wsClient: WSClient,
      config: OpaqueTokenIssuerConfig,
      token: String,
      response: WSResponse)(implicit ec: ExecutionContext): Future[Boolean]

  protected def handleIntrospectionFailedResult(wsClient: WSClient,
                                                config: OpaqueTokenIssuerConfig,
                                                token: String,
                                                response: WSResponse)(implicit
      ec: ExecutionContext): Future[Boolean] = {
    logger.debug(
      s"introspectToken: request failed, response code ${response.status}, ${response.body}")
    Future.failed(
      ExternalServiceCallFailed(
        s"introspectToken: request failed, response code  ${response.status}"))
  }

  def userInfoUri(config: OpaqueTokenIssuerConfig): String =
    s"${config.issuer}${config.userInfoPath.getOrElse("")}"

  def handleUserInfoResult(wsClient: WSClient,
                           config: OpaqueTokenIssuerConfig,
                           token: String,
                           response: WSResponse)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]] = {
    response.status match {
      case 200 =>
        handleUserInfoSuccessResult(wsClient, config, token, response)
      case _ =>
        handleUserInfoFailedResult(wsClient, config, token, response)
    }
  }

  protected def handleUserInfoSuccessResult(wsClient: WSClient,
                                            config: OpaqueTokenIssuerConfig,
                                            token: String,
                                            response: WSResponse)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]]

  protected def handleUserInfoFailedResult(wsClient: WSClient,
                                           config: OpaqueTokenIssuerConfig,
                                           token: String,
                                           response: WSResponse)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]] = {
    logger.debug(
      s"userInfo: request failed, response code ${response.status}, ${response.body}")
    Future.failed(
      ExternalServiceCallFailed(
        s"userInfo: request failed, response code  ${response.status}"))
  }
}

class OIDCTokenValidator extends AuthTokenValidator with Logging {
  override def createIntrospectionPayload(config: OpaqueTokenIssuerConfig,
                                          token: String): JsObject = Json.obj(
    "token" -> token
  )

  protected override def handleIntrospectionSuccessResult(
      wsClient: WSClient,
      config: OpaqueTokenIssuerConfig,
      token: String,
      response: WSResponse)(implicit ec: ExecutionContext): Future[Boolean] = {
    val active = (response.json \ "active").as[Boolean]
    logger.debug(s"introspectToken: request succeeded, active: $active")
    Future.successful(active)
  }

  override protected def handleUserInfoSuccessResult(
      wsClient: WSClient,
      config: OpaqueTokenIssuerConfig,
      token: String,
      response: WSResponse)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]] = {
    logger.debug(s"userInfo: request succeeded: ${response.json}")
    Future.successful(
      Some(
        UserInfo(
          key = (response.json \ "email").as[String],
          email = (response.json \ "email").as[String],
          firstName = (response.json \ "given_name")
            .asOpt[String]
            .orElse((response.json \ "firstname").asOpt[String])
            .orElse((response.json \ "name").asOpt[String]),
          lastName = (response.json \ "family_name")
            .asOpt[String]
            .orElse((response.json \ "lastname").asOpt[String])
        )))
  }
}

class GithubTokenValidator extends AuthTokenValidator {

  case class GithubEmail(email: String, primary: Boolean)
  object GithubEmail {
    implicit val format: Format[GithubEmail] = Json.format[GithubEmail]
  }

  override def createIntrospectionPayload(config: OpaqueTokenIssuerConfig,
                                          token: String): JsObject = Json.obj(
    "access_token" -> token
  )

  protected override def handleIntrospectionSuccessResult(
      wsClient: WSClient,
      config: OpaqueTokenIssuerConfig,
      token: String,
      response: WSResponse)(implicit ec: ExecutionContext): Future[Boolean] = {
    logger.debug(s"introspectToken: request succeeded")
    Future.successful(true)
  }

  override protected def handleUserInfoSuccessResult(
      wsClient: WSClient,
      config: OpaqueTokenIssuerConfig,
      token: String,
      response: WSResponse)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]] = {
    logger.debug(s"userInfo: request succeeded: ${response.json}")

    (response.json \ "email")
      .asOpt[String]
      .fold(requestEmailAddress(wsClient, config, token))(Future.successful)
      .map { email =>
        Some(
          UserInfo(
            key = email,
            email = email,
            firstName = (response.json \ "given_name")
              .asOpt[String]
              .orElse((response.json \ "firstname").asOpt[String])
              .orElse((response.json \ "name").asOpt[String])
              .orElse((response.json \ "login").asOpt[String]),
            lastName = (response.json \ "family_name")
              .asOpt[String]
              .orElse((response.json \ "lastname").asOpt[String])
          ))
      }
  }

  private def requestEmailAddress(wsClient: WSClient,
                                  config: OpaqueTokenIssuerConfig,
                                  token: String)(implicit
      ec: ExecutionContext): Future[String] = {
    val emailUrl = s"${config.issuer}user/emails"
    logger.debug(s"userInfoEmail: request : $emailUrl")
    wsClient
      .url(emailUrl)
      .addHttpHeaders("Accept" -> "application/json")
      .addHttpHeaders("Authorization" -> s"Bearer $token")
      .get()
      .flatMap { response =>
        response.status match {
          case 200 =>
            val emails = response.json.as[Seq[GithubEmail]]
            val email  = emails.find(_.primary).getOrElse(emails.head)
            Future.successful(email.email)
          case code =>
            logger.debug(
              s"userInfoEmail: request failed, response code $code, ${response.body}")
            Future.failed(
              ExternalServiceCallFailed(
                s"userInfoEmail: request failed, response code  $code"))
        }
      }
  }
}
