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
import controllers.security.UnauthorizedException
import models.LasiusJWT.{
  EMAIL_CLAIM,
  EMAIL_VERIFIED_CLAIM,
  FAMILY_NAME_CLAIM,
  GIVEN_NAME_CLAIM
}
import org.joda.time.DateTime

import scala.util.Try

case class LasiusJWT(private val jwt: DecodedJWT) {
  def subject: String = Option(jwt.getSubject).getOrElse(
    throw UnauthorizedException(
      s"Missing claim 'subject', available claims: ${jwt.getClaims}"))
  // getClaim never returns null. A missing claim returns null from asString and asBoolean.
  private def stringClaim(name: String): Option[String] =
    Option(jwt.getClaim(name).asString())
  def email: String = stringClaim(EMAIL_CLAIM).getOrElse(subject)
  // Some issuers send the claim as the string "false".
  private def emailUnverified: Boolean = {
    val claim = jwt.getClaim(EMAIL_VERIFIED_CLAIM)
    Option(claim.asBoolean()).contains(false) ||
    Option(claim.asString()).contains("false")
  }
  private def givenName: Option[String]  = stringClaim(GIVEN_NAME_CLAIM)
  private def familyName: Option[String] = stringClaim(FAMILY_NAME_CLAIM)

  /** Fails for an email that the issuer marks as unverified, because the
    * backend finds the user by email. A token without the claim, such as one
    * from the internal provider, stays valid.
    */
  def toUserInfo: UserInfo = {
    if (emailUnverified) {
      throw UnauthorizedException(
        "The email address of the token is not verified")
    }
    UserInfo(
      key = subject,
      email = email,
      firstName = givenName,
      lastName = familyName
    )
  }
}

object LasiusJWT {
  val EMAIL_CLAIM                  = "email"
  private val EMAIL_VERIFIED_CLAIM = "email_verified"
  private val GIVEN_NAME_CLAIM     = "given_name"
  private val FAMILY_NAME_CLAIM    = "family_name"

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
