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

package controllers

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.typesafe.config.Config
import controllers.security.ControllerSecurity
import core._
import models._
import mongo.EmbedMongo
import org.apache.http.HttpStatus
import org.joda.time.DateTime
import org.mockito.Mockito.{never, verify}
import org.specs2.mock.Mockito
import org.specs2.matcher.StringMatchers
import play.api.Configuration
import play.api.mvc._
import play.api.test._
import play.modules.reactivemongo.ReactiveMongoApi
import services.ExternalServiceCallFailed

import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.util.Base64
import javax.inject.Inject
import scala.concurrent._
import scala.concurrent.duration._
import scala.language.postfixOps

class SecuritySpec
    extends PlaySpecification
    with Results
    with Mockito
    with BodyParserUtils
    with TestApplication
    with EmbedMongo
    with StringMatchers {
  sequential =>

  private val userInfo = UserInfo(
    key = "system",
    email = "system@lasius.ch",
    firstName = None,
    lastName = None
  )

  "HasRole" should {
    def runHasRole(controller: HasRoleSecurityMock,
                   role: UserRole = Administrator) = {
      // prepare
      val request = FakeRequest().asInstanceOf[Request[Unit]]

      // execute
      val result: Future[Result] = controller
        .HasUserRole(role, controller.parse.empty, withinTransaction = false) {
          _ => _ => _ => _ =>
            Future.successful(Ok)
        }
        .apply(request)

      // return results & wait until future is complete for testing purposes
      Await.ready(result, 2 seconds)
    }

    "return unauthorized when user can't get resolved" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasRoleSecurityMock(systemServices, reactiveMongoApi, config)
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(None))

      // execute
      runHasRole(controller)

      // check results
      there.was(
        one(controller.authConfig)
          .authorizationFailed(any[RequestHeader])(any[ExecutionContext]))
    }

    "return unauthorized when authorization failed" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasRoleSecurityMock(systemServices, reactiveMongoApi, config)
      controller.authConfig
        .authorizeUser(any[User], any[UserRole])(any[ExecutionContext])
        .returns(Future.successful(false))
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(Some(UserMock.mock(FreeUser))))

      // execute
      runHasRole(controller)

      // check results
      there.was(
        one(controller.authConfig)
          .authorizationFailed(any[RequestHeader])(any[ExecutionContext]))
    }

    "return InternalServerError on any failure" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasRoleSecurityMock(systemServices, reactiveMongoApi, config)
      controller.authConfig
        .authorizeUser(any[User], any[UserRole])(any[ExecutionContext])
        .returns(Future.failed(new RuntimeException))
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(Some(UserMock.mock(FreeUser))))

      // execute
      private val result = runHasRole(controller)

      // check results
      status(result) === HttpStatus.SC_INTERNAL_SERVER_ERROR
    }

    "Succeed if authorized" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasRoleSecurityMock(systemServices, reactiveMongoApi, config)
      controller.authConfig
        .authorizeUser(any[User], any[UserRole])(any[ExecutionContext])
        .returns(Future.successful(true))
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(Some(UserMock.mock(FreeUser))))

      // execute
      private val result = runHasRole(controller)

      // check results
      status(result) === HttpStatus.SC_OK
    }
  }

  "HasToken" should {
    def runHasToken(controller: HasTokenSecurityMock,
                    token: Option[String] = None,
                    issuer: Option[String] = None) = {
      // prepare
      val request = FakeRequest()
        .withHeaders(
          Headers(
            Seq(token
                  .map { tokenString =>
                    "Authorization" -> s"Bearer $tokenString"
                  },
                issuer
                  .map { issuerString =>
                    "X-Token-Issuer" -> issuerString
                  }).flatten: _*
          )
        )
        .asInstanceOf[Request[Unit]]

      // execute
      val result: Future[Result] = controller
        .HasToken(controller.parse.empty, withinTransaction = false) {
          _ => _ => _ =>
            Future.successful(Ok)
        }
        .apply(request)

      // return results & wait until future is complete for testing purposes
      Await.ready(result, 2 seconds)
    }

    "return unauthorized when no token was found in request header" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(None))

      // execute
      private val result = runHasToken(controller)

      // check results
      status(result) === HttpStatus.SC_UNAUTHORIZED
      contentAsString(result) must startWith("No token found")
    }

    "with JWT Token" should {

      "return unauthorized when token in header expired longer than leeway time" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        controller.authConfig
          .resolveIssuerConfig(any[String])
          .returns(None)

        private val jwtToken =
          JWT
            .create()
            .withSubject("test_user@lasius.com")
            .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
            .withExpiresAt(DateTime.now().minusSeconds(60).toDate)
            .sign(Algorithm.none())

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "return unauthorized when token issuer is not configured" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        controller.authConfig
          .resolveIssuerConfig(any[String])
          .returns(None)

        private val jwtToken =
          JWT
            .create()
            .withSubject("test_user@lasius.com")
            .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
            .sign(Algorithm.none())

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "return unauthorized when token subject/email does not match restrictions" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey = None,
                              publicKey = None,
                              jwk = None)))

        private val jwtToken =
          JWT
            .create()
            .withIssuer("test")
            .withSubject("test_user@mydomain.com")
            .sign(Algorithm.none())

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "return unauthorized when token was not signed but signature was expected" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey = Some("some_random_key"),
                              publicKey = None,
                              jwk = None)))

        private val jwtToken =
          JWT
            .create()
            .withSubject("test_user@lasius.com")
            .withIssuer("test")
            .sign(Algorithm.none())

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "succeed with valid token without signature" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey = None,
                              publicKey = None,
                              jwk = None)))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        private val jwtToken = JWT
          .create()
          .withSubject("test_user@lasius.com")
          .withIssuer("test")
          .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
          .sign(Algorithm.none())

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        contentAsString(result) === ""
        status(result) === HttpStatus.SC_OK
      }

      "return unauthorized when token was signed with different symmetric private key" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey =
                                Some("dasddasdasfse32q1231231313eqdsasd"),
                              publicKey = None,
                              jwk = None)))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        private val jwtToken = JWT
          .create()
          .withSubject("test_user@lasius.com")
          .withIssuer("test")
          .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
          .sign(Algorithm.HMAC256("my_other_key"))

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results

        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "succeed with valid token with signature based on symmetric private key" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val randomString = "dasddasdasfse32q1231231313eqdsasd"
        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey = Some(randomString),
                              publicKey = None,
                              jwk = None)))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        private val jwtToken = JWT
          .create()
          .withSubject("test_user@lasius.com")
          .withIssuer("test")
          .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
          .sign(Algorithm.HMAC256(randomString))

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        contentAsString(result) === ""
        status(result) === HttpStatus.SC_OK
      }

      "return unauthorized when token was signed with different wrong public/private key" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)

        private val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
        private val keyPair1         = keyPairGenerator.generateKeyPair
        private val keyPair2         = keyPairGenerator.generateKeyPair

        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey = None,
                              publicKey = Some(Base64.getEncoder.encodeToString(
                                keyPair1.getPublic.getEncoded)),
                              jwk = None)))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        private val jwtToken = JWT
          .create()
          .withSubject("test_user@lasius.com")
          .withIssuer("test")
          .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
          .sign(
            Algorithm.RSA256(keyPair2.getPrivate.asInstanceOf[RSAPrivateKey]))

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results

        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "succeed with valid token with signature based on correct public/private key pair" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        private val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
        private val keyPair          = keyPairGenerator.generateKeyPair

        controller.authConfig
          .resolveIssuerConfig("test")
          .returns(
            Some(
              JWTIssuerConfig(issuer = "test",
                              privateKey = None,
                              publicKey = Some(Base64.getEncoder.encodeToString(
                                keyPair.getPublic.getEncoded)),
                              jwk = None)))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        private val jwtToken = JWT
          .create()
          .withSubject("test_user@lasius.com")
          .withIssuer("test")
          .withClaim(LasiusJWT.EMAIL_CLAIM, "test@lasius.com")
          .sign(
            Algorithm.RSA256(keyPair.getPrivate.asInstanceOf[RSAPrivateKey]))

        // execute
        private val result = runHasToken(controller, Some(jwtToken))

        // check results
        contentAsString(result) === ""
        status(result) === HttpStatus.SC_OK
      }
    }
    "With opaque token in header" should {
      "return unauthorized when token in header was not found through the introspection endpoint of one of the configured opaque token providers" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig, token)
          .returns(
            Future.failed(ExternalServiceCallFailed("Could not find token")))

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")

        // no provider was cached
        systemServices.opaqueTokenIssuerCache.sync.get(token) === None
      }

      "return unauthorized when token in header is not active, but cache issuer for introspection" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig, token)
          .returns(Future.successful(false))

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")

        // provider was cached
        systemServices.opaqueTokenIssuerCache.sync.get(token) === Some(
          tokenConfig)
      }
      "return unauthorized when userinfo could not get fetched with valid token and not cache provider" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig, token)
          .returns(Future.successful(true))
        controller.authConfig.opaqueTokenService
          .userInfo(tokenConfig, token)
          .returns(Future.failed(
            ExternalServiceCallFailed("Could not find user info")))

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")

        // provider was cached
        systemServices.opaqueTokenIssuerCache.sync.get(token) === Some(
          tokenConfig)
        systemServices.userInfoCache.sync.get(token) === None
      }
      "succeed with valid token and cache provider" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig, token)
          .returns(Future.successful(true))
        controller.authConfig.opaqueTokenService
          .userInfo(tokenConfig, token)
          .returns(Future.successful(userInfo))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_OK
        contentAsString(result) === ""

        // token issuer provider and user info where cached
        systemServices.opaqueTokenIssuerCache.sync.get(token) === Some(
          tokenConfig)
        systemServices.userInfoCache.sync.get(token) === Some(userInfo)
      }
      "succeed with valid token through inspection endpoint and lookup user info from cache" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig, token)
          .returns(Future.successful(true))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        systemServices.userInfoCache.sync.set(token, userInfo)

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_OK
        contentAsString(result) === ""

        // should not lookup user info from remote server
        verify(controller.authConfig.opaqueTokenService, never())
          .userInfo(tokenConfig, token)
      }

      "succeed with valid token through inspection endpoint and lookup user info from cache" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig, token)
          .returns(Future.successful(true))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        systemServices.userInfoCache.sync.set(token, userInfo)

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_OK
        contentAsString(result) === ""

        // should not lookup user info from remote server
        verify(controller.authConfig.opaqueTokenService, never())
          .userInfo(tokenConfig, token)
      }

      "don't loop through all issuers if issuerConfig is already in the cache" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig1 = OpaqueTokenIssuerConfig(
          issuer = "test-issuer1",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )
        val tokenConfig2 = OpaqueTokenIssuerConfig(
          issuer = "test-issuer2",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .issuerConfigs()
          .returns(Seq(tokenConfig1, tokenConfig2))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig1, token)
          .returns(Future.successful(false))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig2, token)
          .returns(Future.successful(true))
        controller.authConfig.opaqueTokenService
          .userInfo(tokenConfig2, token)
          .returns(Future.successful(userInfo))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        systemServices.opaqueTokenIssuerCache.sync.set(token, tokenConfig2)

        // execute
        private val result = runHasToken(controller, Some(token))

        // check results
        status(result) === HttpStatus.SC_OK
        contentAsString(result) === ""

        verify(controller.authConfig.opaqueTokenService, never())
          .userInfo(tokenConfig1, token)
      }

      "unauthorized if issuer provided in header doesn't exist" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)

        val tokenConfig = OpaqueTokenIssuerConfig(
          issuer = "test-issuer2",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .resolveIssuerConfig(tokenConfig.issuer)
          .returns(None)

        // execute
        private val result = runHasToken(controller,
                                         token = Some(token),
                                         issuer = Some(tokenConfig.issuer))

        // check results
        status(result) === HttpStatus.SC_UNAUTHORIZED
        contentAsString(result) must startWith("Invalid token provided")
      }

      "succeed if issuer is provided in header" in new WithTestApplication {
        // prepare
        val systemServices: SystemServices = inject[SystemServices]
        val controller =
          new HasTokenSecurityMock(systemServices, reactiveMongoApi, config)
        val tokenConfig2 = OpaqueTokenIssuerConfig(
          issuer = "test-issuer2",
          clientId = Some(""),
          clientSecret = Some(""),
          tokenValidatorType = TokenValidatorType.OIDC,
          introspectionPath = None,
          userInfoPath = None
        )

        private val token = "random_string_value"

        controller.authConfig
          .resolveIssuerConfig(tokenConfig2.issuer)
          .returns(Some(tokenConfig2))
        controller.authConfig.opaqueTokenService
          .introspectToken(tokenConfig2, token)
          .returns(Future.successful(true))
        controller.authConfig.opaqueTokenService
          .userInfo(tokenConfig2, token)
          .returns(Future.successful(userInfo))
        controller.authConfig
          .resolveOrCreateUserByUserInfo(any[UserInfo], any[Boolean])(
            any[ExecutionContext],
            any[DBSession])
          .returns(Future.successful(EntityReference[UserId](UserId(), "user")))

        // execute
        private val result = runHasToken(controller,
                                         token = Some(token),
                                         issuer = Some(tokenConfig2.issuer))

        // check results
        status(result) === HttpStatus.SC_OK
        contentAsString(result) === ""
      }
    }
  }
}

class SecurityMock(@Inject
                   override val systemServices: SystemServices,
                   override val conf: Config,
                   override val reactiveMongoApi: ReactiveMongoApi,
                   override val controllerComponents: ControllerComponents)
    extends BaseController
    with ControllerSecurity
    with SecurityComponentMock
    with TestDBSupport {}

object UserMock {
  def mock(role: UserRole): User =
    User(id = UserId(),
         key = "123",
         email = "email",
         firstName = "firstname",
         lastName = "lastname",
         active = true,
         role = role,
         organisations = Seq(),
         settings = None)
}

class HasRoleSecurityMock(
    override val systemServices: SystemServices,
    override val reactiveMongoApi: ReactiveMongoApi,
    override val conf: Config,
    override val controllerComponents: ControllerComponents =
      Helpers.stubControllerComponents())
    extends BaseController
    with ControllerSecurity
    with SecurityComponentMock
    with TestDBSupport {

  implicit val playConfig: Configuration = Configuration(conf)
  private val userInfo = UserInfo(
    key = "system",
    email = "system@lasius.ch",
    firstName = None,
    lastName = None
  )
  private val subject: Subject =
    Subject(userInfo, EntityReference(UserId(), "123"))

  override def HasToken[A](p: BodyParser[A], withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] =
    Action.async(p) { implicit request =>
      withDBSession() { session =>
        f(session)(subject)(request)
      }
    }
}

class HasTokenSecurityMock(
    override val systemServices: SystemServices,
    override val reactiveMongoApi: ReactiveMongoApi,
    override val conf: Config,
    override val controllerComponents: ControllerComponents =
      Helpers.stubControllerComponents())
    extends BaseController
    with ControllerSecurity
    with SecurityComponentMock
    with TestDBSupport {

  implicit val playConfig: Configuration = Configuration(conf)
}
