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

package actors

import actors.ControlCommands._
import com.google.inject.ImplementedBy
import com.typesafe.config.Config
import controllers.{AuthConfig, SecurityComponent, TokenSecurity}
import core.{DBSupport, SystemServices}
import models._
import org.apache.pekko.actor._
import play.api.cache.SyncCacheApi
import play.modules.reactivemongo.ReactiveMongoApi

import java.util.concurrent.ConcurrentLinkedQueue
import scala.concurrent.{ExecutionContextExecutor, Future}

object ControlCommands {
  case class SendToClient(senderUserId: UserId,
                          event: OutEvent,
                          receivers: List[UserId] = Nil)
}

@ImplementedBy(classOf[ClientReceiverWebsocket])
trait ClientReceiver {
  def broadcast(senderUserId: UserId, event: OutEvent): Unit

  /** Send OutEvent to a list of receiving clients exclusing sender itself
    */
  def send(senderUserId: UserId, event: OutEvent, receivers: List[UserId]): Unit

  def !(senderUserId: UserId, event: OutEvent, receivers: List[UserId]): Unit
}

class ClientReceiverWebsocket extends ClientReceiver {

  /** Broadcast OutEvent to every client except sender itself
    */
  def broadcast(senderUserId: UserId, event: OutEvent): Unit = {
    ClientMessagingWebsocketActor.actors
      .iterator()
      .forEachRemaining(_ ! SendToClient(senderUserId, event))
  }

  /** Send OutEvent to a list of receiving clients exclusing sender itself
    */
  def send(senderUserId: UserId,
           event: OutEvent,
           receivers: List[UserId]): Unit = {
    ClientMessagingWebsocketActor.actors
      .iterator()
      .forEachRemaining(_ ! SendToClient(senderUserId, event, receivers))
  }

  def !(senderUserId: UserId,
        event: OutEvent,
        receivers: List[UserId]): Unit = {
    send(senderUserId, event, receivers)
  }
}

object ClientMessagingWebsocketActor {
  def props(systemServices: SystemServices,
            conf: Config,
            reactiveMongoApi: ReactiveMongoApi,
            authConfig: AuthConfig,
            jwkProviderCache: SyncCacheApi)(out: ActorRef): Props =
    Props(
      new ClientMessagingWebsocketActor(systemServices = systemServices,
                                        conf = conf,
                                        reactiveMongoApi = reactiveMongoApi,
                                        authConfig = authConfig,
                                        out = out,
                                        jwkProviderCache = jwkProviderCache))
  var actors: ConcurrentLinkedQueue[ActorRef] = new ConcurrentLinkedQueue()
}

class ClientMessagingWebsocketActor(
    systemServices: SystemServices,
    override val conf: Config,
    override val reactiveMongoApi: ReactiveMongoApi,
    override val authConfig: AuthConfig,
    override val jwkProviderCache: SyncCacheApi,
    out: ActorRef)
    extends Actor
    with ActorLogging
    with DBSupport
    with SecurityComponent
    with TokenSecurity {

  override val supportTransaction: Boolean = systemServices.supportTransaction
  implicit val executionContext: ExecutionContextExecutor =
    context.system.dispatcher
  private var userId: Option[UserId] = None
  // val (enumerator, channel) = Concurrent.broadcast[OutEvent]

  // append to map of active actors
  ClientMessagingWebsocketActor.actors.add(self)

  private def default: Receive = { case Ping =>
    log.debug("Answer with pong")
    out ! Pong
  }

  private def unauthenticated: Receive = default.orElse {
    case HelloServer(client, token) =>
      log.debug(s"Received HelloServer($client)")
      withToken(token, withinTransaction = true, canCreateNewUser = false) {
        out ! AuthenticationFailed
        userId = None
        context.become(unauthenticated)
        Future.successful(())
      } { _ => user =>
        userId = Some(user.userReference.id)
        log.debug(s"Successfully authenticated websocket for client ($client)")
        out ! HelloClient
        context.become(authenticated)
        Future.successful(())
      }
      ()
  }

  private def authenticated: Receive = unauthenticated.orElse {
    case SendToClient(senderUserId, event, Nil) =>
      // broadcast to all others
      if (userId.isDefined && !userId.contains(senderUserId)) {
        out ! event
      }
    case SendToClient(_, event, receivers) =>
      // send to specific clients only
      if (userId.isDefined && receivers.contains(userId.get)) {
        out ! event
      }
  }

  def receive: Receive = unauthenticated

  def broadcast(event: OutEvent): Unit = {
    ClientMessagingWebsocketActor.actors
      .iterator()
      .forEachRemaining(ref => ref ! event)
  }

  override def postStop(): Unit = {
    // remove from active actors
    ClientMessagingWebsocketActor.actors.remove(self)
    log.debug(
      s"Websocket connection closed for user ${userId.map(_.value).getOrElse("'Unauthenticated'")}")
    super.postStop()
  }
}
