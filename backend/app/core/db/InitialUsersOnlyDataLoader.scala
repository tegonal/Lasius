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

package core.db

import core.{DBSession, DBSupport, SystemServices}
import models.UserId.UserReference
import models._
import org.mindrot.jbcrypt.BCrypt
import play.api.Logging
import play.modules.reactivemongo.ReactiveMongoApi
import repositories._

import javax.inject.Inject
import scala.annotation.unused
import scala.concurrent.{ExecutionContext, Future}

/*
 * Initialize database with users only - no prepopulated projects or bookings
 */
@unused
class InitialUsersOnlyDataLoader @Inject() (
    override val reactiveMongoApi: ReactiveMongoApi,
    oauthUserRepository: OAuthUserRepository,
    userRepository: UserRepository,
    organisationRepository: OrganisationRepository,
    systemServices: SystemServices)(implicit executionContext: ExecutionContext)
    extends Logging
    with DBSupport
    with InitialDataLoader {

  // gets overridden b the withinTransaction call
  override val supportTransaction = true

  private val user1Key: String   = sys.env.getOrElse("DEMO_USER1_KEY", "demo1")
  private val user1Email: String =
    sys.env.getOrElse("DEMO_USER1_EMAIL", "demo1@lasius.ch")
  private val user1PasswordHash: String = BCrypt.hashpw(
    sys.env.getOrElse("DEMO_USER1_PASSWORD", "demo"),
    BCrypt.gensalt())

  private val user2Key: String   = sys.env.getOrElse("DEMO_USER2_KEY", "demo2")
  private val user2Email: String =
    sys.env.getOrElse("DEMO_USER2_EMAIL", "demo2@lasius.ch")
  private val user2PasswordHash: String = BCrypt.hashpw(
    sys.env.getOrElse("DEMO_USER2_PASSWORD", "demo"),
    BCrypt.gensalt())

  override def initializeData(supportTransaction: Boolean)(implicit
      userReference: UserReference): Future[Unit] = {
    logger.debug(
      "Initialize users only (with private organizations, no projects/bookings)...")
    withDBSession(withTransaction = supportTransaction) { implicit dbSession =>
      for {
        _ <- initializeUser1()(userReference, dbSession)
        _ <- initializeUser2()(userReference, dbSession)
      } yield ()
    }
  }

  private def initializeUser1()(implicit
      userReference: UserReference,
      dbSession: DBSession): Future[Unit] = {
    for {
      // Create OAuth user
      oauthUser <- oauthUserRepository.upsert(
        OAuthUser(
          id = OAuthUserId(),
          email = user1Email,
          password = user1PasswordHash,
          firstName = Some("Demo"),
          lastName = Some("User 1"),
          active = true
        ))
      // Create private organisation for user
      org <- organisationRepository.create(user1Key, `private` = true)(
        systemServices.systemSubject,
        dbSession)
      // Create user with UserInfo similar to OAuth flow
      userInfo = UserInfo(key = user1Key,
                          firstName = Some("Demo"),
                          lastName = Some("User 1"),
                          email = user1Email)
      user <- userRepository.createInitialUserBasedOnProfile(
        userInfo,
        org,
        OrganisationAdministrator)
    } yield ()
  }

  private def initializeUser2()(implicit
      userReference: UserReference,
      dbSession: DBSession): Future[Unit] = {
    for {
      // Create OAuth user
      oauthUser <- oauthUserRepository.upsert(
        OAuthUser(
          id = OAuthUserId(),
          email = user2Email,
          password = user2PasswordHash,
          firstName = Some("Demo"),
          lastName = Some("User 2"),
          active = true
        ))
      // Create private organisation for user
      org <- organisationRepository.create(user2Key, `private` = true)(
        systemServices.systemSubject,
        dbSession)
      // Create user with UserInfo similar to OAuth flow
      userInfo = UserInfo(key = user2Key,
                          firstName = Some("Demo"),
                          lastName = Some("User 2"),
                          email = user2Email)
      user <- userRepository.createInitialUserBasedOnProfile(
        userInfo,
        org,
        OrganisationAdministrator)
    } yield ()
  }
}
