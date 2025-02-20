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

package models

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import controllers.UnauthorizedException
import models.LasiusJWT.{EMAIL_CLAIM, FAMILY_NAME_CLAIM, GIVEN_NAME_CLAIM}
import org.joda.time.DateTime
import com.typesafe.config.Config

import scala.util.Try

case class LasiusJWT(private val jwt: DecodedJWT) {
  def subject: String = Option(jwt.getSubject).getOrElse(
    throw UnauthorizedException(
      s"Missing claim 'subject', available claims: ${jwt.getClaims}"))
  def email: String = Option(jwt.getClaim(EMAIL_CLAIM))
    .map(_.asString())
    .getOrElse(subject)
  def givenName: Option[String] = Option(jwt.getClaim(GIVEN_NAME_CLAIM))
    .map(_.asString())
  def familyName: Option[String] = Option(jwt.getClaim(FAMILY_NAME_CLAIM))
    .map(_.asString())
}

object LasiusJWT {
  val EMAIL_CLAIM               = "email"
  private val GIVEN_NAME_CLAIM  = "given_name"
  private val FAMILY_NAME_CLAIM = "family_name"

  def REQUEST_HEADER_NAME(implicit conf: Config): String =
    if (conf.hasPath("play.http.session.jwtName"))
      conf.getString("play.http.session.jwtName")
    else "Authorization"

  def TOKEN_PREFIX(implicit conf: Config): String = {
    if (conf.hasPath("play.http.session.tokenPrefix"))
      conf.getString("play.http.session.tokenPrefix")
    else "Bearer "
  }

  def newJWT(user: OAuthUser)(implicit config: LasiusConfig): Try[String] = {

    Try(
      JWT
        .create()
        .withIssuer(config.security.oauth2Provider.jwtToken.issuer)
        .withJWTId(user.id.value.toString)
        .withIssuedAt(DateTime.now().toDate)
        .withSubject(user.email)
        .withAudience(config.security.oauth2Provider.jwtToken.issuer)
        .withExpiresAt(DateTime
          .now()
          .plus(config.security.oauth2Provider.jwtToken.lifespan.toMillis)
          .toDate)
        .withClaim(EMAIL_CLAIM, user.email)
        .withClaim(GIVEN_NAME_CLAIM, user.firstName.orNull)
        .withClaim(FAMILY_NAME_CLAIM, user.lastName.orNull)
        .sign(Algorithm.HMAC256(
          config.security.oauth2Provider.jwtToken.privateKey)))
  }
}
