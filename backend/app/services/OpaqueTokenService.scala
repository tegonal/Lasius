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
import models.{OpaqueTokenIssuerConfig, UserInfo}
import play.api.Logging
import play.api.libs.json.Json
import play.api.libs.ws.{WSAuthScheme, WSClient}

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
  override def introspectToken(config: OpaqueTokenIssuerConfig,
                               opaqueToken: String)(implicit
      ec: ExecutionContext): Future[Boolean] = {
    val request = ws.url(config.introspectionUri)
    val data = Json.obj(
      "token" -> opaqueToken
    )
    logger.debug(s"introspectToken: url=${config.introspectionUri}")
    request
      .addHttpHeaders("Accept" -> "application/json")
      .withAuth(config.clientId, config.clientSecret, WSAuthScheme.BASIC)
      .post(data)
      .flatMap { response =>
        response.status match {
          case 200 =>
            val active = (response.json \ "active").as[Boolean]
            logger.debug(s"introspectToken: request succeeded, active: $active")
            Future.successful(active)
          case code =>
            logger.debug(
              s"introspectToken: request failed, response code $code, ${response.body}")
            Future.failed(
              ExternalServiceCallFailed(
                s"introspectToken: request failed, response code $code"))
        }
      }
  }

  override def userInfo(config: OpaqueTokenIssuerConfig, opaqueToken: String)(
      implicit ec: ExecutionContext): Future[Option[UserInfo]] = {
    val request = ws.url(config.userInfoUri)
    logger.debug(s"userInfo: url=${config.userInfoUri}")
    request
      .addHttpHeaders("Accept" -> "application/json")
      // TODO: verify that other providers expect the token without base64 encoding. Otherwise introduce a configuration flag
      .addHttpHeaders("Authorization" -> s"Bearer $opaqueToken")
      .get()
      .map { response =>
        response.status match {
          case 200 =>
            logger.debug(
              s"userInfo: request succeeded, active: ${response.json}")
            Some(
              UserInfo(
                key = (response.json \ "email").as[String],
                email = (response.json \ "email").as[String],
                firstName = (response.json \ "given_name")
                  .asOpt[String]
                  .orElse((response.json \ "firstname").asOpt[String]),
                lastName = (response.json \ "family_name")
                  .asOpt[String]
                  .orElse((response.json \ "lastname").asOpt[String])
              ))
          case code =>
            logger.debug(
              s"userInfo: request failed, response code $code, ${response.body}")
            None
        }
      }
  }
}
