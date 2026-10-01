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

import actors.scheduler._
import org.specs2.mutable._

import java.time.Duration

class LasiusConfigSpec extends Specification {
  "The text form of a config with a secret" should {
    "hide the client secret of an opaque token issuer" in {
      val config = OpaqueTokenIssuerConfig(
        issuer = "https://gitlab.test",
        clientId = Some("the-client"),
        clientSecret = Some("s3cret-value"),
        tokenValidatorType = TokenValidatorType.OIDC,
        introspectionPath = None,
        userInfoPath = None
      )
      config.toString must not(contain("s3cret-value"))
      config.toString must contain("clientSecret=<redacted>")
      config.toString must contain("the-client")
    }

    "hide the private key of a JWT issuer and of the internal provider" in {
      JWTIssuerConfig(issuer = "lasius",
                      privateKey = Some("hmac-key")).toString must not(
        contain("hmac-key"))
      JWTTokenConfig(issuer = "lasius",
                     lifespan = Duration.ofDays(1),
                     privateKey = "hmac-key").toString must not(
        contain("hmac-key"))
    }
  }

  "The text form of an importer credential" should {
    "hide the tokens, keys and passwords of every importer" in {
      val texts = Seq(
        GitlabAuth(accessToken = "gitlab-token"),
        GithubAuth(accessToken = "github-token",
                   resourceOwner = Some("tegonal")),
        PlaneAuth(apiKey = "plane-key"),
        JiraAuth(consumerKey = "jira-consumer",
                 privateKey = "jira-private",
                 accessToken = "jira-token"),
        OAuth2Authentication(token = "oauth2-token"),
        ApiKeyAuthentication(apiKey = "api-key"),
        BasicAuthentication(username = "the-user", password = "pass-word"),
        OAuthAuthentication(consumerKey = "oauth-consumer",
                            privateKey = "oauth-private",
                            token = "oauth-token",
                            tokenSecret = "oauth-token-secret")
      ).map(_.toString).mkString("\n")

      Seq("gitlab-token",
          "github-token",
          "plane-key",
          "jira-private",
          "jira-token",
          "oauth2-token",
          "api-key",
          "pass-word",
          "oauth-private",
          "oauth-token").foreach(secret => texts must not(contain(secret)))
      texts must contain("resourceOwner=Some(tegonal)")
      texts must contain("username=the-user")
    }

    "hide a credential inside an enclosing value" in {
      Some(GitlabAuth("gitlab-token")).toString must not(
        contain("gitlab-token"))
    }
  }
}
