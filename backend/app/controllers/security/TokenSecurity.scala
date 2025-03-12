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

package controllers.security

import com.auth0.jwk.JwkProviderBuilder
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import core.{ConfigAware, DBSession, DBSupport}
import helpers.FutureHelper
import models._
import play.api.Logging

import java.security.interfaces.{ECPublicKey, RSAPublicKey}
import java.security.spec.X509EncodedKeySpec
import java.security.{KeyFactory, PublicKey}
import java.util.Base64
import java.util.concurrent.TimeUnit
import scala.concurrent.Future.{failed, successful}
import scala.concurrent.{ExecutionContext, Future}
import scala.util.Try

trait TokenSecurity extends Logging with ConfigAware with FutureHelper {
  self: SecurityComponent with DBSupport =>

  private def decodeJWT(token: String) =
    Try(JWT.decode(token))

  private def evaluateSigningAlgorithm(token: DecodedJWT,
                                       config: JWTIssuerConfig) = {

    def algorithmFromPublicKey(pubKey: PublicKey) =
      (token.getAlgorithm, pubKey) match {
        case ("RS256", key: RSAPublicKey) => Some(Algorithm.RSA256(key))
        case ("RS384", key: RSAPublicKey) => Some(Algorithm.RSA384(key))
        case ("RS512", key: RSAPublicKey) => Some(Algorithm.RSA512(key))
        case ("ES256", key: ECPublicKey)  => Some(Algorithm.ECDSA256(key))
        case ("ES384", key: ECPublicKey)  => Some(Algorithm.ECDSA384(key))
        case ("ES512", key: ECPublicKey)  => Some(Algorithm.ECDSA512(key))
        case _                            => None
      }

    def loadJWKProvider(jwk: JWKConfig) = {
      val builder = new JwkProviderBuilder(jwk.url)
      jwk.cache.foreach { cache =>
        builder.cached(cache.cacheSize, cache.expiresIn)
      }
      jwk.rateLimit.foreach { rateLimit =>
        builder.rateLimited(rateLimit.bucketSize,
                            rateLimit.refillRate.toSeconds,
                            TimeUnit.SECONDS)
      }
      jwk.timeouts.foreach { timeouts =>
        builder.timeouts(timeouts.connectTimeout.toMillis.toInt,
                         timeouts.readTimeout.toMillis.toInt)
      }
      builder.build()
    }

    config match {
      // first priority validate by private key
      case JWTIssuerConfig(_, _, Some(pk), _) =>
        token.getAlgorithm match {
          case "HS256" => Some(Algorithm.HMAC256(pk))
          case "HS384" => Some(Algorithm.HMAC384(pk))
          case "HS512" => Some(Algorithm.HMAC512(pk))
          case _       => None
        }
      // second priority validate by static public key
      case JWTIssuerConfig(_, Some(pk), _, _) =>
        val kf = KeyFactory.getInstance(token.getAlgorithm match {
          case alg if alg.startsWith("RS") => "RSA"
          case alg if alg.startsWith("EC") => "EC"
        })
        val keySpecX509 = new X509EncodedKeySpec(Base64.getDecoder.decode(pk))
        val pubKey      = kf.generatePublic(keySpecX509)

        algorithmFromPublicKey(pubKey)

      // third priority validate by jwk
      case JWTIssuerConfig(issuer, _, _, Some(jwkConfig)) =>
        val provider = jwkProviderCache.getOrElseUpdate(issuer) {
          loadJWKProvider(jwkConfig)
        }
        val jwk = provider.get(token.getKeyId)
        algorithmFromPublicKey(jwk.getPublicKey)

      // else validate without a signing key
      case JWTIssuerConfig(_, _, _, _) =>
        Some(Algorithm.none())
    }
  }

  private def validateDecodedJWTToken(token: DecodedJWT,
                                      config: JWTIssuerConfig,
                                      algorithm: Algorithm) =
    Try(
      JWT
        .require(algorithm)
        .withIssuer(config.issuer)
        // Maybe extract to config
        .acceptLeeway(10)
        .build()
        .verify(token))

  private def validateSubjectHasAccess(token: DecodedJWT): Boolean = {
    systemServices.lasiusConfig.security.accessRestriction.fold(true) {
      accessConfig =>
        logger.debug(
          s"validateSubjectHasAccess: $accessConfig => ${token.getSubject} == ${accessConfig
            .canAccess(token.getSubject)}")
        accessConfig.canAccess(token.getSubject)
    }
  }

  private def validateJWTToken(jwt: DecodedJWT)(implicit
      ec: ExecutionContext): Future[UserInfo] = {
    for {
      _ <-
        if (validateSubjectHasAccess(jwt)) successful(true)
        else
          failed(
            UnauthorizedException(
              s"Access for subject '${jwt.getSubject}' not granted'"))
      config <- authConfig
        .resolveIssuerConfig(jwt.getIssuer)
        .filter(_.isInstanceOf[JWTIssuerConfig])
        .map(_.asInstanceOf[JWTIssuerConfig])
        .noneToFailed("Could not resolve jwt issuer")
      algorithm <- evaluateSigningAlgorithm(jwt, config).noneToFailed(
        "Could not evaluate signing algorithm")
      validatedToken: DecodedJWT <- validateDecodedJWTToken(jwt,
                                                            config,
                                                            algorithm)
        .fold(failed, successful)
    } yield LasiusJWT(validatedToken).toUserInfo
  }

  private def introspectOpaqueToken(
      issuer: OpaqueTokenIssuerConfig,
      opaqueToken: String
  )(implicit
      ec: ExecutionContext): Future[(OpaqueTokenIssuerConfig, Boolean)] = {
    authConfig.opaqueTokenService
      .introspectToken(issuer, opaqueToken)
      .map(result => (issuer, result))
  }

  private def resolveUserInfoFromOpaqueToken(issuer: OpaqueTokenIssuerConfig,
                                             opaqueToken: String)(implicit
      ec: ExecutionContext): Future[Option[UserInfo]] = {
    userInfoCache.getOrElseUpdate(opaqueToken) {
      authConfig.opaqueTokenService
        .userInfo(issuer, opaqueToken)
    }
  }

  /** resolving and verifying applies to following steps:
    *   - resolve accepting issuer by sequentially checking token against
    *     introspection endpoint, read issuer from header or from cache for
    *     faster lookups
    *   - fetch user info of issuing authorisation server or from cache
    *
    * @param opaqueToken
    * @return
    */
  private def resolveAndValidateOpaqueToken(tokenIssuer: Option[String],
                                            opaqueToken: String)(implicit
      ec: ExecutionContext): Future[UserInfo] =
    for {
      validTokenIssuer <- tokenIssuer
        .fold {
          opaqueTokenIssuerCache.getOrElseUpdate(opaqueToken) {
            // iterate through all issuers
            Future
              .find(
                authConfig
                  .issuerConfigs()
                  .filter(_.isInstanceOf[OpaqueTokenIssuerConfig])
                  .map(issuer =>
                    introspectOpaqueToken(
                      issuer.asInstanceOf[OpaqueTokenIssuerConfig],
                      opaqueToken)))(_._2)
              .map(_.map(_._1))
          }
        } { issuer =>
          authConfig
            .resolveIssuerConfig(issuer)
            .filter(_.isInstanceOf[OpaqueTokenIssuerConfig])
            .fold(Future.successful[Option[OpaqueTokenIssuerConfig]](None)) {
              issuer =>
                introspectOpaqueToken(
                  issuer.asInstanceOf[OpaqueTokenIssuerConfig],
                  opaqueToken).map {
                  case (issuer, true) => Some(issuer)
                  case _              => None
                }
            }
        }
        .noneToFailed("No valid opaque token provided")
      userInfo <- resolveUserInfoFromOpaqueToken(validTokenIssuer, opaqueToken)
        .noneToFailed("Could not load userInfo")
    } yield userInfo

  /** Resolve and validate token. Token might be either a JWT token or an
    * opaque_token. To improve performance token validation and reduce lookup,
    * validated user info per token gets cached
    * @param token
    * @return
    */
  private def resolveAndValidateToken(tokenIssuer: Option[String],
                                      token: String)(implicit
      ec: ExecutionContext): Future[UserInfo] =
    decodeJWT(token)
      .fold(_ => resolveAndValidateOpaqueToken(tokenIssuer, token),
            validateJWTToken)

  def withToken[R](tokenIssuer: Option[String],
                   token: String,
                   withinTransaction: Boolean,
                   canCreateNewUser: Boolean)(failed: => Future[R])(
      success: DBSession => Subject => Future[R])(implicit
      context: ExecutionContext): Future[R] = {
    resolveAndValidateToken(tokenIssuer, token)
      .flatMap { userInfo =>
        logger.debug(s"Got validated userInfo: $userInfo")
        withDBSession(withinTransaction) { implicit dbSession =>
          authConfig
            .resolveOrCreateUserByUserInfo(userInfo = userInfo,
                                           canCreateNewUser = canCreateNewUser)
            .flatMap { user =>
              success(dbSession)(Subject(userInfo, user))
            }
        }
      }
      .recoverWith { error =>
        logger.debug(s"Failed decoding token: ${error.getMessage}")
        failed
      }
  }
}
