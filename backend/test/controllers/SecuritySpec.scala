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
import com.auth0.jwt.interfaces.DecodedJWT
import com.typesafe.config.Config
import core._
import models._
import mongo.EmbedMongo
import org.apache.http.HttpStatus
import org.joda.time.DateTime
import org.specs2.mock.Mockito
import play.api.Configuration
import play.api.cache.SyncCacheApi
import play.api.mvc._
import play.api.test._
import play.modules.reactivemongo.ReactiveMongoApi

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
    with EmbedMongo {
  sequential =>

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
        new HasRoleSecurityMock(systemServices,
                                reactiveMongoApi,
                                config,
                                jwkProviderCache)
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
        new HasRoleSecurityMock(systemServices,
                                reactiveMongoApi,
                                config,
                                jwkProviderCache)
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
        new HasRoleSecurityMock(systemServices,
                                reactiveMongoApi,
                                config,
                                jwkProviderCache)
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
        new HasRoleSecurityMock(systemServices,
                                reactiveMongoApi,
                                config,
                                jwkProviderCache)
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
                    token: Option[String] = None) = {
      // prepare
      val request = FakeRequest()
        .withHeaders(
          Headers(
            Seq(
              token
                .map { tokenString =>
                  "Authorization" -> s"Bearer $tokenString"
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
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(None))

      // execute
      private val result = runHasToken(controller)

      // check results
      status(result) === HttpStatus.SC_UNAUTHORIZED
      contentAsString(result) === "No JWT token found"
    }

    "return unauthorized when token in header expired longer than leeway time" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
      contentAsString(result).startsWith("Invalid JWT token provided")
    }

    "return unauthorized when token issuer is not configured" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
      contentAsString(result).startsWith("Invalid JWT token provided")
    }

    "return unauthorized when token subject/email does not match restrictions" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
      contentAsString(result).startsWith("Invalid JWT token provided")
    }

    "return unauthorized when token was not signed but signature was expected" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
      contentAsString(result).startsWith("Invalid JWT token provided")
    }

    "succeed with valid token without signature" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
      contentAsString(result).startsWith("Invalid JWT token provided")
    }

    "succeed with valid token with signature based on symmetric private key" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)

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
        .sign(Algorithm.RSA256(keyPair2.getPrivate.asInstanceOf[RSAPrivateKey]))

      // execute
      private val result = runHasToken(controller, Some(jwtToken))

      // check results

      status(result) === HttpStatus.SC_UNAUTHORIZED
      contentAsString(result).startsWith("Invalid JWT token provided")
    }

    "succeed with valid token with signature based on correct public/private key pair" in new WithTestApplication {
      // prepare
      val systemServices: SystemServices = inject[SystemServices]
      val controller =
        new HasTokenSecurityMock(systemServices,
                                 reactiveMongoApi,
                                 config,
                                 jwkProviderCache)
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
        .sign(Algorithm.RSA256(keyPair.getPrivate.asInstanceOf[RSAPrivateKey]))

      // execute
      private val result = runHasToken(controller, Some(jwtToken))

      // check results
      contentAsString(result) === ""
      status(result) === HttpStatus.SC_OK
    }
  }
}

class SecurityMock(@Inject
                   override val systemServices: SystemServices,
                   override val conf: Config,
                   override val reactiveMongoApi: ReactiveMongoApi,
                   override val controllerComponents: ControllerComponents,
                   override val jwkProviderCache: SyncCacheApi)
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
    override val jwkProviderCache: SyncCacheApi,
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
    override val jwkProviderCache: SyncCacheApi,
    override val controllerComponents: ControllerComponents =
      Helpers.stubControllerComponents())
    extends BaseController
    with ControllerSecurity
    with SecurityComponentMock
    with TestDBSupport {

  implicit val playConfig: Configuration = Configuration(conf)
}
