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

import core._
import models._
import mongo.EmbedMongo
import play.api.test._
import repositories.{OrganisationMongoRepository, UserMongoRepository}

import scala.concurrent.{ExecutionContext, Future}

class AuthConfigSpec
    extends PlaySpecification
    with EmbedMongo
    with TestApplication {

  "resolveOrCreateUserByUserInfo" should {
    // The first page of a new user sends several requests at once (review finding B13).
    "create one user and one private organisation for concurrent first requests" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val userInfo: UserInfo = UserInfo(key = "first.login@test.com",
                                        firstName = Some("First"),
                                        lastName = Some("Login"),
                                        email = "first.login@test.com")

      val references: Seq[UserId.UserReference] = withDBSession() {
        implicit dbSession =>
          Future.sequence((1 to 10).map(_ =>
            authConfig.resolveOrCreateUserByUserInfo(userInfo)))
      }.awaitResult()

      val users = withDBSession()(implicit dbSession =>
        new UserMongoRepository().findAll()).awaitResult()
      val organisations = withDBSession()(implicit dbSession =>
        new OrganisationMongoRepository().findAll()).awaitResult()

      references.map(_.id).distinct must haveSize(1)
      users.count(_.email == userInfo.email) must equalTo(1)
      organisations.count { case (organisation, _) =>
        organisation.key == userInfo.key
      } must equalTo(1)
    }
  }
}
