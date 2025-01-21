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

import com.typesafe.config.Config
import core.{DBSession, MockCacheAware, TestApplication, TestDBSupport}
import models._
import mongo.EmbedMongo
import org.apache.http.HttpStatus
import org.specs2.mock.Mockito
import pdi.jwt.{JwtClaim, JwtSession}
import play.api.Configuration
import play.api.mvc._
import play.api.test._
import play.modules.reactivemongo.ReactiveMongoApi

import javax.inject.Inject
import scala.concurrent._
import scala.concurrent.duration._
import scala.language.postfixOps

class SecuritySpec
    extends PlaySpecification
    with Results
    with Mockito
    with MockCacheAware
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
          _ => subject => _ => implicit request =>
            Future.successful(Ok)
        }
        .apply(request)

      // return results & wait until future is complete for testing purposes
      Await.ready(result, 2 seconds)
    }

    "return unauthorized when user can't get resolved" in new WithTestApplication {
      // prepare
      val controller = new HasRoleSecurityMock(reactiveMongoApi, config)
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
      val controller = new HasRoleSecurityMock(reactiveMongoApi, config)
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
      val controller = new HasRoleSecurityMock(reactiveMongoApi, config)
      controller.authConfig
        .authorizeUser(any[User], any[UserRole])(any[ExecutionContext])
        .returns(Future.failed(new RuntimeException))
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(Some(UserMock.mock(FreeUser))))

      // execute
      val result = runHasRole(controller)

      // check results
      status(result) === HttpStatus.SC_INTERNAL_SERVER_ERROR
    }

    "Succeed if authorized" in new WithTestApplication {
      // prepare
      val controller = new HasRoleSecurityMock(reactiveMongoApi, config)
      controller.authConfig
        .authorizeUser(any[User], any[UserRole])(any[ExecutionContext])
        .returns(Future.successful(true))
      controller.authConfig
        .resolveUser(any[EntityReference[UserId]])(any[ExecutionContext],
                                                   any[DBSession])
        .returns(Future.successful(Some(UserMock.mock(FreeUser))))

      // execute
      val result = runHasRole(controller)

      // check results
      status(result) === HttpStatus.SC_OK
    }
  }
}

class SecurityMock(@Inject
                   override val conf: Config,
                   override val reactiveMongoApi: ReactiveMongoApi,
                   override val controllerComponents: ControllerComponents)
    extends BaseController
    with Security
    with SecurityComponentMock
    with MockCacheAware
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
    override val reactiveMongoApi: ReactiveMongoApi,
    override val conf: Config,
    override val controllerComponents: ControllerComponents =
      Helpers.stubControllerComponents())
    extends BaseController
    with Security
    with SecurityComponentMock
    with MockCacheAware
    with TestDBSupport {

  implicit val playConfig: Configuration = Configuration(conf)
  private val subject: Subject =
    Subject(JwtSession(JwtClaim()), EntityReference(UserId(), "123"))

  override def HasToken[A](p: BodyParser[A], withinTransaction: Boolean)(
      f: DBSession => Subject => Request[A] => Future[Result])(implicit
      context: ExecutionContext): Action[A] =
    Action.async(p) { implicit request =>
      withDBSession() { session =>
        f(session)(subject)(request)
      }
    }
}
