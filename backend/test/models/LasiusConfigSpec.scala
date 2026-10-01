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

import org.specs2.mutable._

import java.time.Duration

class LasiusConfigSpec extends Specification {
  "The text form of a config with a secret" should {
    "hide the client secret of an opaque token issuer" in {
      val config = OpaqueTokenIssuerConfig(issuer = "https://gitlab.test",
                                           clientId = Some("the-client"),
                                           clientSecret = Some("s3cret-value"),
                                           tokenValidatorType =
                                             TokenValidatorType.OIDC,
                                           introspectionPath = None,
                                           userInfoPath = None)
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
}
