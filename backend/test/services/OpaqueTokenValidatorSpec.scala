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

import models.OpaqueTokenIssuerConfig
import org.specs2.mock.Mockito
import org.specs2.mutable._
import play.api.libs.json.Json
import play.api.libs.ws.{WSClient, WSResponse}
import services.GithubTokenValidator.{selectVerifiedEmail, GithubEmail}

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}

class OpaqueTokenValidatorSpec extends Specification with Mockito {
  implicit val ec: ExecutionContext = ExecutionContext.global

  "GithubTokenValidator.selectVerifiedEmail" should {
    "pick the verified primary address" in {
      selectVerifiedEmail(
        Seq(GithubEmail("other@x.ch", primary = false, verified = true),
            GithubEmail("main@x.ch", primary = true, verified = true))) ===
        Some("main@x.ch")
    }

    "skip an unverified primary address for a verified one" in {
      selectVerifiedEmail(
        Seq(GithubEmail("victim@x.ch", primary = true, verified = false),
            GithubEmail("own@x.ch", primary = false, verified = true))) ===
        Some("own@x.ch")
    }

    "return None when no address is verified" in {
      selectVerifiedEmail(
        Seq(GithubEmail("victim@x.ch", primary = true, verified = false))) ===
        None
    }
  }

  "OIDCTokenValidator user info" should {
    def userInfo(body: String) = {
      val response = mock[WSResponse]
      response.status.returns(200)
      response.json.returns(Json.parse(body))
      new OIDCTokenValidator().handleUserInfoResult(
        mock[WSClient],
        mock[OpaqueTokenIssuerConfig],
        "token",
        response)
    }

    "accept a verified email" in {
      Await
        .result(userInfo("""{"email":"a@x.ch","email_verified":true}"""),
                2.seconds)
        .email === "a@x.ch"
    }

    "accept a response without email_verified" in {
      Await.result(userInfo("""{"email":"a@x.ch"}"""), 2.seconds).email ===
        "a@x.ch"
    }

    "reject email_verified sent as the string false" in {
      Await.result(userInfo("""{"email":"a@x.ch","email_verified":"false"}"""),
                   2.seconds) must throwA[ExternalServiceCallFailed]
    }

    "reject an unverified email" in {
      Await.result(userInfo("""{"email":"a@x.ch","email_verified":false}"""),
                   2.seconds) must throwA[ExternalServiceCallFailed]
    }
  }
}
