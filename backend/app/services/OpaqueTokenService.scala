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

class OpaqueTokenServiceImpl @Inject() (ws: WSClient)
    extends OpaqueTokenService {
  override def introspectToken(config: OpaqueTokenIssuerConfig,
                               opaqueToken: String)(implicit
      ec: ExecutionContext): Future[Boolean] = {
    val request = ws.url(config.introspectionUri)
    val data = Json.obj(
      "clientId"     -> config.clientId,
      "clientSecret" -> config.clientSecret,
      "token"        -> opaqueToken
    )
    request
      .addHttpHeaders("Accept" -> "application/json")
      .post(data)
      .map { response =>
        response.status match {
          case 200 => (response.json \ "active").as[Boolean]
          case _   => false
        }
      }
  }

  override def userInfo(config: OpaqueTokenIssuerConfig, opaqueToken: String)(
      implicit ec: ExecutionContext): Future[Option[UserInfo]] = {
    val request = ws.url(config.introspectionUri)
    request
      .addHttpHeaders("Accept" -> "application/json")
      .withAuth(opaqueToken, "", WSAuthScheme.BASIC)
      .get()
      .map { response =>
        response.status match {
          case 200 =>
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
          case _ => None
        }
      }
  }
}
