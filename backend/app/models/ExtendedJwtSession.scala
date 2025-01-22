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

import controllers.UnauthorizedException
import models.ExtendedJwtSession.{
  EMAIL_CLAIM,
  FAMILY_NAME_CLAIM,
  GIVEN_NAME_CLAIM
}
import org.joda.time.DateTime
import pdi.jwt.{JwtClaim, JwtSession}
import play.api.Configuration

import java.time.Clock

case class ExtendedJwtSession(private val jwt: JwtSession) {
  def subject: String = jwt.claim.subject.getOrElse(
    throw UnauthorizedException(
      s"Missing claim 'subject', available claims: ${jwt.claimData}"))
  def email: String = jwt
    .getAs[String](EMAIL_CLAIM)
    .getOrElse(throw UnauthorizedException(
      s"Missing claim '$EMAIL_CLAIM', available claims: ${jwt}"))
  def givenName: Option[String]  = jwt.getAs[String](GIVEN_NAME_CLAIM)
  def familyName: Option[String] = jwt.getAs[String](FAMILY_NAME_CLAIM)
}

object ExtendedJwtSession {
  private val EMAIL_CLAIM       = "email"
  private val GIVEN_NAME_CLAIM  = "given_name"
  private val FAMILY_NAME_CLAIM = "family_name"

  def newSession(user: OAuthUser)(implicit
      configuration: Configuration,
      clock: Clock): JwtSession = {
    val session = JwtSession()
    val issuer =
      configuration.underlying.getString("lasius.oauth2_provider.issuer")
    val tokenLifespan = configuration.underlying.getDuration(
      "lasius.oauth2_provider.jwt_token_lifespan")

    session.withClaim(
      JwtClaim(
        jwtId = Some(user.id.value.toString),
        issuer = Some(issuer),
        issuedAt = Some(DateTime.now().getMillis),
        subject = Some(user.email),
        audience = Some(Set(issuer)),
        expiration =
          Some(DateTime.now().plus(tokenLifespan.toMillis).getMillis),
        notBefore = Some(DateTime.now().getMillis),
      )) ++ (
      EMAIL_CLAIM       -> user.email,
      GIVEN_NAME_CLAIM  -> user.firstName,
      FAMILY_NAME_CLAIM -> user.lastName,
    )
  }
}
