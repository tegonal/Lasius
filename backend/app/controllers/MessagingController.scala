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

import actors.ClientMessagingWebsocketActor
import com.typesafe.config.Config
import core.SystemServices
import models._
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.stream.{Materializer, OverflowStrategy}
import org.apache.pekko.util.Timeout
import play.api.cache.SyncCacheApi
import play.api.libs.streams._
import play.api.mvc._
import play.modules.reactivemongo.ReactiveMongoApi
import play.sockjs.api._

import javax.inject.Inject
import scala.concurrent.Future
import scala.language.postfixOps

class MessagingController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val authConfig: AuthConfig,
    override val systemServices: SystemServices,
    override val jwkProviderCache: SyncCacheApi)(implicit
    override val reactiveMongoApi: ReactiveMongoApi)
    extends BaseLasiusController()
    with InjectedSockJSRouter {

  implicit val timeout: Timeout = systemServices.timeout

  implicit val system: ActorSystem        = systemServices.system
  implicit val materializer: Materializer = Materializer.matFromSystem

  implicit val sockJsMessageFlowTransformer
      : SockJS.MessageFlowTransformer[InEvent, OutEvent] =
    SockJS.MessageFlowTransformer.jsonMessageFlowTransformer[InEvent, OutEvent]

  def sockjs: SockJS = SockJS.acceptOrResult[InEvent, OutEvent](messageHandler)

  private val messageHandler = { _: RequestHeader =>
    Future.successful(Right({
      logger.debug(s"Create unauthenticated Websocket for client")
      ActorFlow.actorRef(
        ClientMessagingWebsocketActor.props(
          systemServices = systemServices,
          conf = conf,
          reactiveMongoApi = reactiveMongoApi,
          authConfig = authConfig,
          jwkProviderCache = jwkProviderCache
        ),
        1000,
        OverflowStrategy.dropNew
      )
    }))
  }
}
