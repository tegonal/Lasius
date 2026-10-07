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
import controllers.security.UnauthorizedException
import org.specs2.mutable._

class LasiusJWTSpec extends Specification {

  private def decode(
      build: com.auth0.jwt.JWTCreator.Builder => com.auth0.jwt.JWTCreator.Builder)
      : LasiusJWT =
    LasiusJWT(
      JWT.decode(build(JWT.create().withSubject("subject-1"))
        .sign(Algorithm.HMAC256("secret"))))

  "LasiusJWT.toUserInfo" should {
    "accept a token with a verified email" in {
      val jwt = decode(
        _.withClaim("email", "a@lasius.ch").withClaim("email_verified", true))
      jwt.toUserInfo.email === "a@lasius.ch"
    }

    "accept a token without the email_verified claim" in {
      val jwt = decode(_.withClaim("email", "a@lasius.ch"))
      jwt.toUserInfo.email === "a@lasius.ch"
    }

    "reject a token with an unverified email" in {
      val jwt = decode(
        _.withClaim("email", "a@lasius.ch").withClaim("email_verified", false))
      jwt.toUserInfo must throwA[UnauthorizedException]
    }

    "reject a token that sends email_verified as the string false" in {
      val jwt = decode(
        _.withClaim("email", "a@lasius.ch").withClaim("email_verified",
                                                      "false"))
      jwt.toUserInfo must throwA[UnauthorizedException]
    }

    "fall back to the subject when the email claim is missing" in {
      decode(identity).toUserInfo.email === "subject-1"
    }

    "return no names when the name claims are missing" in {
      val info = decode(identity).toUserInfo
      (info.firstName === None).and(info.lastName === None)
    }
  }
}
