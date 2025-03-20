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

package core

import actors.LasiusSupervisorActor
import com.typesafe.config.ConfigFactory
import models.UserId.UserReference
import models._
import org.apache.pekko.actor.{ActorRef, ActorSystem}
import org.apache.pekko.stream.Materializer
import org.apache.pekko.testkit.TestProbe
import org.apache.pekko.util.Timeout
import org.specs2.mock.Mockito.mock
import play.api.Configuration
import play.api.cache.{AsyncCacheApi, SyncCacheApi}
import play.modules.reactivemongo.ReactiveMongoApi

import java.time.Clock
import javax.inject.{Inject, Provider, Singleton}
import scala.concurrent.duration._
import scala.language.postfixOps

@Singleton
class MockServicesProvider @Inject() (actorSystem: ActorSystem)
    extends Provider[SystemServices] {
  lazy val get: SystemServices =
    new MockServices(actorSystem)
}

class MockServices(actorSystem: ActorSystem) extends SystemServices {

  override val lasiusConfig: LasiusConfig = LasiusConfig(
    title = "Lasius",
    instance = "Test",
    initializeViewsOnStartup = false,
    security = LasiusSecurityConfig(
      accessRestriction = Some(
        AccessRestrictionConfig(
          emailRegex = ".*@lasius\\.com"
        )
      ),
      externalIssuers = Seq(),
      oauth2Provider = InternalOauth2ProviderConfig(
        enabled = true,
        allowRegisterUsers = true,
        clientId = "",
        clientSecret = "",
        authorizationCode = AuthorizationCodeConfig(
          lifespan = java.time.Duration.ofMinutes(1),
        ),
        jwtToken = JWTTokenConfig(
          issuer = "lasius",
          lifespan = java.time.Duration.ofDays(1),
          privateKey = "sadasdddfasddasd"
        )
      )
    )
  )
  val supervisor: ActorRef =
    actorSystem.actorOf(LasiusSupervisorActor.props, "lasius-test-supervisor")
  val reactiveMongoApi: ReactiveMongoApi   = mock[ReactiveMongoApi]
  override val supportTransaction: Boolean = false

  implicit val system: ActorSystem        = actorSystem
  override val materializer: Materializer = Materializer.matFromSystem
  val systemUser: UserId                  = UserId()
  override val systemUserReference: UserReference = {
    EntityReference(systemUser, "system")
  }

  implicit val clock: Clock              = Clock.systemUTC
  implicit val playConfig: Configuration = Configuration(ConfigFactory.load())
  val userInfo: UserInfo = UserInfo(
    key = "system",
    email = "system@lasius.ch",
    firstName = None,
    lastName = None
  )
  override val systemSubject: Subject =
    Subject(userInfo, systemUserReference)
  implicit val timeout: Timeout = Timeout(5 seconds) // needed for `?` below
  val duration: Duration        = Duration.create(5, SECONDS)
  val timeBookingViewService: ActorRef = TestProbe().ref

  val loginStateAggregate: ActorRef = TestProbe().ref

  val currentUserTimeBookingsViewService: ActorRef  = TestProbe().ref
  val currentOrganisationTimeBookingsView: ActorRef = TestProbe().ref
  val latestUserTimeBookingsViewService: ActorRef   = TestProbe().ref
  val timeBookingStatisticsViewService: ActorRef    = TestProbe().ref
  val tagCache: ActorRef                            = TestProbe().ref
  val pluginHandler: ActorRef                       = TestProbe().ref
  val loginHandler: ActorRef                        = TestProbe().ref

  override val jwkProviderCache: SyncCacheApi        = new MockSyncCache()
  override val opaqueTokenIssuerCache: AsyncCacheApi = new MockAsyncCache()
  override val userInfoCache: AsyncCacheApi          = new MockAsyncCache()

  override def initialize(): Unit = {}
}
