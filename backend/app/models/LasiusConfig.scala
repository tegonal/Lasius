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

import java.time.Duration

case class LasiusConfig(
    initializeViewsOnStartup: Boolean,
    title: String,
    instance: String,
    security: LasiusSecurityConfig
) {

  def toApplicationConfig: ApplicationConfig =
    ApplicationConfig(
      title = title,
      instance = instance,
      lasiusOAuthProviderEnabled = security.oauth2Provider.enabled,
      lasiusOAuthProviderAllowUserRegistration =
        security.oauth2Provider.allowRegisterUsers,
      allowedIssuers = security.allowedIssuers.map(_.issuer)
    )
}

case class LasiusSecurityConfig(
    accessRestriction: Option[AccessRestrictionConfig],
    externalIssuers: Seq[JWTIssuerConfig],
    oauth2Provider: InternalOauth2ProviderConfig
) {
  lazy val allowedIssuers: Seq[IssuerConfig] =
    if (oauth2Provider.enabled)
      JWTIssuerConfig(
        issuer = oauth2Provider.jwtToken.issuer,
        privateKey = Some(oauth2Provider.jwtToken.privateKey)
      ) +: externalIssuers
    else externalIssuers

  lazy val allowedJWTIssuers: Seq[JWTIssuerConfig] =
    allowedIssuers
      .filter(_.isInstanceOf[JWTIssuerConfig])
      .map(_.asInstanceOf[JWTIssuerConfig])

  lazy val allowedOpaqueTokenIssuers: Seq[OpaqueTokenIssuerConfig] =
    allowedIssuers
      .filter(_.isInstanceOf[OpaqueTokenIssuerConfig])
      .map(_.asInstanceOf[OpaqueTokenIssuerConfig])
}

case class AccessRestrictionConfig(
    emailRegex: String
) {
  def canAccess(email: String): Boolean = email.matches(emailRegex)
}

case class InternalOauth2ProviderConfig(
    enabled: Boolean,
    allowRegisterUsers: Boolean,
    clientId: String,
    clientSecret: String,
    authorizationCode: AuthorizationCodeConfig,
    jwtToken: JWTTokenConfig
)

case class AuthorizationCodeConfig(
    lifespan: Duration
)

case class JWTTokenConfig(
    issuer: String,
    lifespan: Duration,
    privateKey: String
)

sealed trait IssuerConfig {
  val issuer: String
}

case class OpaqueTokenIssuerConfig(
    issuer: String,
    clientId: String,
    clientSecret: String,
    introspectionUri: String,
    userInfoUri: String
) extends IssuerConfig

case class JWTIssuerConfig(issuer: String,
                           publicKey: Option[String] = None,
                           privateKey: Option[String] = None,
                           jwk: Option[JWKConfig] = None)
    extends IssuerConfig

case class JWKConfig(url: String,
                     cache: Option[JWKProviderCacheConfig] = None,
                     rateLimit: Option[JWKProviderRateLimitConfig] = None,
                     timeouts: Option[JWKProviderTimeoutConfig] = None)

// For more details information about the configuration options see
// https://github.com/auth0/jwks-rsa-java/blob/master/EXAMPLES.md#provider-configuration
case class JWKProviderCacheConfig(cacheSize: Long, expiresIn: Duration)
case class JWKProviderRateLimitConfig(bucketSize: Long, refillRate: Duration)
case class JWKProviderTimeoutConfig(connectTimeout: Duration,
                                    readTimeout: Duration)
