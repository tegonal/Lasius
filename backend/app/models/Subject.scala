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
import models.Subject.ExtendedJwtSession
import models.UserId.UserReference
import pdi.jwt.JwtSession

case class Subject(jwt: JwtSession, userReference: UserReference) {
  def extendedJwtClaims: ExtendedJwtSession = ExtendedJwtSession(jwt)
}

object Subject {
  private val EMAIL_CLAIM       = "email"
  private val GIVEN_NAME_CLAIM  = "given_name"
  private val FAMILY_NAME_CLAIM = "family_name"

  case class ExtendedJwtSession(private val jwt: JwtSession) {
    def subject: String = jwt.claim.subject.getOrElse(
      throw UnauthorizedException("Missing claim 'subject'"))
    def email: String = jwt
      .getAs[String](EMAIL_CLAIM)
      .getOrElse(throw UnauthorizedException(s"Missing claim '$EMAIL_CLAIM'"))
    def givenName: Option[String]  = jwt.getAs[String](GIVEN_NAME_CLAIM)
    def familyName: Option[String] = jwt.getAs[String](FAMILY_NAME_CLAIM)
  }
}
