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

import actors.{ClientReceiver, LasiusSupervisorActor, TagCache}
import com.google.inject.ImplementedBy
import com.typesafe.config.Config
import core.db.InitialDataLoader
import domain.LoginStateAggregate
import domain.views.CurrentOrganisationTimeBookingsView
import models.UserId.UserReference
import models._
import org.apache.pekko.actor.{ActorRef, ActorSystem}
import org.apache.pekko.pattern.ask
import org.apache.pekko.stream.Materializer
import org.apache.pekko.util.Timeout
import play.api.cache.{AsyncCacheApi, SyncCacheApi}
import play.api.inject.Injector
import play.api.libs.ws.WSClient
import play.api.{Configuration, Logging}
import play.cache.NamedCache
import play.modules.reactivemongo.ReactiveMongoApi
import pureconfig._
import pureconfig.generic.auto._
import repositories._
import services.{
  CurrentUserTimeBookingsViewService,
  LatestUserTimeBookingsViewService,
  TimeBookingStatisticsViewService,
  TimeBookingViewService
}

import java.time.Clock
import java.util.UUID
import javax.inject.{Inject, Named, Singleton}
import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}
import scala.language.postfixOps

@ImplementedBy(classOf[DefaultSystemServices])
trait SystemServices {
  val systemUser: UserId
  val systemUserReference: UserReference
  val systemSubject: Subject
  val timeout: Timeout
  val duration: Duration
  val timeBookingViewService: ActorRef
  val loginStateAggregate: ActorRef
  val currentUserTimeBookingsViewService: ActorRef
  val currentOrganisationTimeBookingsView: ActorRef
  val latestUserTimeBookingsViewService: ActorRef
  val timeBookingStatisticsViewService: ActorRef
  val tagCache: ActorRef
  val pluginHandler: ActorRef
  val loginHandler: ActorRef
  val system: ActorSystem
  val materializer: Materializer
  val supportTransaction: Boolean
  val lasiusConfig: LasiusConfig
  val jwkProviderCache: SyncCacheApi
  val opaqueTokenIssuerCache: AsyncCacheApi
  val userInfoCache: AsyncCacheApi

  def initialize(): Unit
}

@Singleton
class DefaultSystemServices @Inject() (
    config: Config,
    @Named(LasiusSupervisorActor.name) supervisor: ActorRef,
    override val reactiveMongoApi: ReactiveMongoApi,
    userRepository: UserRepository,
    jiraConfigRepository: JiraConfigRepository,
    gitlabConfigRepository: GitlabConfigRepository,
    planeConfigRepository: PlaneConfigRepository,
    clientReceiver: ClientReceiver,
    bookingByProjectRepository: BookingByProjectRepository,
    bookingByTagRepository: BookingByTagRepository,
    bookingHistoryRepository: BookingHistoryRepository,
    wsClient: WSClient,
    injector: Injector,
    @NamedCache("jwk") override val jwkProviderCache: SyncCacheApi,
    @NamedCache("opaque-token-issuer")
    override val opaqueTokenIssuerCache: AsyncCacheApi,
    @NamedCache("user-info") override val userInfoCache: AsyncCacheApi)(implicit
    ec: ExecutionContext)
    extends SystemServices
    with DBSupport
    with Logging {
  // possibly:
  implicit val system: ActorSystem        = ActorSystem("lasius-actor-system")
  override val materializer: Materializer = Materializer.matFromSystem
  implicit val clock: Clock               = Clock.systemUTC
  implicit val playConfig: Configuration  = Configuration(config)

  override val supportTransaction: Boolean =
    config.getBoolean("db.support_transactions")

  lazy val lasiusConfig: LasiusConfig =
    ConfigSource
      .fromConfig(config.getConfig("lasius"))
      .loadOrThrow[LasiusConfig]

  private val systemUUID =
    UUID.fromString("0000000-0000-0000-0000-000000000000")
  val systemUser: UserId = UserId(systemUUID)
  implicit val systemUserReference: UserReference = {
    EntityReference(systemUser, "system")
  }
  private val systemUserInfo = UserInfo(
    key = "system",
    email = "system@lasius.ch",
    firstName = None,
    lastName = None
  )
  val systemSubject: Subject =
    Subject(systemUserInfo, systemUserReference)
  implicit val timeout: Timeout = Timeout(5 seconds) // needed for `?` below
  val duration: FiniteDuration  = Duration.create(30, SECONDS)
  override val timeBookingViewService: ActorRef = Await
    .result(supervisor ? TimeBookingViewService.props(this,
                                                      clientReceiver,
                                                      bookingHistoryRepository,
                                                      reactiveMongoApi),
            duration)
    .asInstanceOf[ActorRef]

  val loginStateAggregate: ActorRef = Await
    .result(supervisor ? LoginStateAggregate.props, duration)
    .asInstanceOf[ActorRef]

  val currentUserTimeBookingsViewService: ActorRef = Await
    .result(
      supervisor ? CurrentUserTimeBookingsViewService.props(clientReceiver),
      duration)
    .asInstanceOf[ActorRef]
  val currentOrganisationTimeBookingsView: ActorRef = Await
    .result(supervisor ? CurrentOrganisationTimeBookingsView
              .props(userRepository,
                     clientReceiver,
                     reactiveMongoApi,
                     supportTransaction),
            duration)
    .asInstanceOf[ActorRef]
  val latestUserTimeBookingsViewService: ActorRef = Await
    .result(
      supervisor ? LatestUserTimeBookingsViewService.props(clientReceiver),
      duration)
    .asInstanceOf[ActorRef]
  val timeBookingStatisticsViewService: ActorRef = Await
    .result(
      supervisor ? TimeBookingStatisticsViewService.props(
        clientReceiver,
        this,
        bookingByProjectRepository,
        bookingByTagRepository,
        reactiveMongoApi),
      duration
    )
    .asInstanceOf[ActorRef]
  val tagCache: ActorRef =
    Await
      .result(supervisor ? TagCache.props(this, clientReceiver), duration)
      .asInstanceOf[ActorRef]
  val pluginHandler: ActorRef = Await
    .result(
      supervisor ? PluginHandler
        .props(userRepository,
               jiraConfigRepository,
               gitlabConfigRepository,
               planeConfigRepository,
               this,
               wsClient,
               lasiusConfig,
               reactiveMongoApi),
      duration
    )
    .asInstanceOf[ActorRef]

  val loginHandler: ActorRef = Await
    .result(supervisor ? LoginHandler.props(this), duration)
    .asInstanceOf[ActorRef]

  // initialize login handler
  LoginHandler.subscribe(loginHandler, system.eventStream)

  override def initialize(): Unit = {

    val cleanData: Boolean = config.getBoolean("db.clean_database_on_startup")
    if (cleanData) {
      logger.info(s"Drop database on startup")
      Await.result(withDBSession()(implicit dbSession => dbSession.db.drop()),
                   20 seconds)
    }

    val hasUsers =
      Await.result(withDBSession()(implicit dbSession =>
                     userRepository.findAll(limit = 1).map(_.nonEmpty)),
                   10 seconds)

    val initData: Boolean = config.getBoolean("db.initialize_data")
    if (!hasUsers && initData) {
      val dataLoaderClassname = config.getString("db.data_loader")
      logger.info(s"Initialize data with: $dataLoaderClassname")
      val dataLoader = injector
        .instanceOf[InitialDataLoader](
          getClass.getClassLoader
            .loadClass(dataLoaderClassname)
            .asInstanceOf[Class[InitialDataLoader]])
      Await.result(dataLoader.initializeData(supportTransaction), 1 minute)
    }

    // start plugin-handler
    pluginHandler ! PluginHandler.Startup

    currentOrganisationTimeBookingsView ! CurrentOrganisationTimeBookingsView.Initialize

    if (lasiusConfig.security.oauth2Provider.enabled) {
      logger.info(
        s"You're running lasius with the internal oauth provider. Please be aware that this implementation is not meant to be used in production mode!")
    }
  }
}
