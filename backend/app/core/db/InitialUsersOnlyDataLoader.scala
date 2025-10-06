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

import core.{DBSession, DBSupport}
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
    organisationRepository: OrganisationRepository)(implicit
    executionContext: ExecutionContext)
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
    logger.debug("Initialize users only (no projects/bookings)...")
    withDBSession(withTransaction = supportTransaction) { implicit dbSession =>
      for {
        (user1org, user2org, publicOrg) <- initializeOrganisations()
        _                               <- initializeUsers(user1org, user2org, publicOrg)
      } yield ()
    }
  }

  private def initializeOrganisations()(implicit
      dbSession: DBSession,
      userReference: UserReference)
      : Future[(Organisation, Organisation, Organisation)] = {

    val user1org =
      Organisation(OrganisationId(),
                   user1Key,
                   `private` = true,
                   active = true,
                   userReference,
                   None)

    val user2org =
      Organisation(OrganisationId(),
                   user2Key,
                   `private` = true,
                   active = true,
                   userReference,
                   None)

    val publicOrg =
      Organisation(OrganisationId(),
                   "DemoOrg",
                   `private` = false,
                   active = true,
                   userReference,
                   None)

    organisationRepository
      .bulkInsert(List(user1org, user2org, publicOrg))
      .map(_ => (user1org, user2org, publicOrg))
  }

  private def initializeUsers(user1Org: Organisation,
                              user2Org: Organisation,
                              publicOrg: Organisation)(implicit
      dbSession: DBSession): Future[Unit] = {

    val oauthUser1 = OAuthUser(
      id = OAuthUserId(),
      email = user1Email,
      password = user1PasswordHash,
      firstName = Some("Demo"),
      lastName = Some("User 1"),
      active = true,
    )

    val user1 = User(
      id = UserId(),
      key = user1Key,
      email = user1Email,
      firstName = "Demo",
      lastName = "User 1",
      active = true,
      role = FreeUser,
      organisations = Seq(
        UserOrganisation(
          user1Org.getReference,
          `private` = user1Org.`private`,
          OrganisationAdministrator,
          WorkingHours(),
          Seq()
        ),
        UserOrganisation(
          publicOrg.getReference,
          publicOrg.`private`,
          OrganisationAdministrator,
          WorkingHours(monday = 8, tuesday = 4, wednesday = 2),
          Seq() // No projects pre-assigned
        )
      ),
      settings = Some(
        UserSettings(lastSelectedOrganisation = Some(publicOrg.getReference))),
      acceptedTOS = None
    )

    val oauthUser2 = OAuthUser(
      id = OAuthUserId(),
      email = user2Email,
      password = user2PasswordHash,
      firstName = Some("Demo"),
      lastName = Some("User 2"),
      active = true,
    )

    val user2 = User(
      id = UserId(),
      key = user2Key,
      email = user2Email,
      firstName = "Demo",
      lastName = "User 2",
      active = true,
      role = FreeUser,
      organisations = Seq(
        UserOrganisation(
          user2Org.getReference,
          `private` = user2Org.`private`,
          OrganisationAdministrator,
          WorkingHours(),
          Seq()
        ),
        UserOrganisation(
          publicOrg.getReference,
          `private` = publicOrg.`private`,
          OrganisationAdministrator,
          WorkingHours(monday = 8, tuesday = 4, wednesday = 2),
          Seq() // No projects pre-assigned
        )
      ),
      settings = Some(
        UserSettings(lastSelectedOrganisation = Some(publicOrg.getReference))),
      acceptedTOS = None
    )

    oauthUserRepository.bulkInsert(List(oauthUser1, oauthUser2))
    userRepository.bulkInsert(List(user1, user2)).map(_ => ())
  }
}
