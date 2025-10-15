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
import controllers.AuthConfig
import controllers.security.{SecurityComponent, TokenSecurity}
import core.{DBSupport, SystemServices}
import models._
import org.apache.pekko.actor._
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
      .forEachRemaining { actor =>
        // Send message - let dead letter handling deal with terminated actors
        actor ! SendToClient(senderUserId, event)
      }
  }

  /** Send OutEvent to a list of receiving clients exclusing sender itself
    */
  def send(senderUserId: UserId,
           event: OutEvent,
           receivers: List[UserId]): Unit = {
    ClientMessagingWebsocketActor.actors
      .iterator()
      .forEachRemaining { actor =>
        // Send message - let dead letter handling deal with terminated actors
        actor ! SendToClient(senderUserId, event, receivers)
      }
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
            authConfig: AuthConfig)(out: ActorRef): Props =
    Props(
      new ClientMessagingWebsocketActor(systemServices = systemServices,
                                        conf = conf,
                                        reactiveMongoApi = reactiveMongoApi,
                                        authConfig = authConfig,
                                        out = out))
  var actors: ConcurrentLinkedQueue[ActorRef] = new ConcurrentLinkedQueue()
}

class ClientMessagingWebsocketActor(
    override val systemServices: SystemServices,
    override val conf: Config,
    override val reactiveMongoApi: ReactiveMongoApi,
    override val authConfig: AuthConfig,
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

  // Watch the output actor to detect early disconnection
  context.watch(out)

  private def default: Receive = {
    case Ping =>
      log.debug("Answer with pong")
      out ! Pong
    case Terminated(`out`) =>
      // Output actor terminated - clean up immediately
      log.debug(
        s"Output actor terminated for user ${userId.map(_.value).getOrElse("'Unauthenticated'")}")
      ClientMessagingWebsocketActor.actors.remove(self)
      context.stop(self)
  }

  private def unauthenticated: Receive = default.orElse {
    case HelloServer(client, token, tokenIssuer) =>
      log.debug(s"Received HelloServer($client)")
      withToken(tokenIssuer = tokenIssuer,
                token = token,
                withinTransaction = true,
                canCreateNewUser = false) {
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
        log.info(
          s"[WebSocket] Broadcasting ${event.getClass.getSimpleName} to user ${userId.get}")
        out ! event
      } else {
        log.debug(s"[WebSocket] Skipping broadcast to sender ${senderUserId}")
      }
    case SendToClient(_, event, receivers) =>
      // send to specific clients only
      if (userId.isDefined && receivers.contains(userId.get)) {
        log.info(
          s"[WebSocket] Sending ${event.getClass.getSimpleName} to user ${userId.get}")
        out ! event
      } else {
        log.debug(
          s"[WebSocket] User ${userId.getOrElse("unauthenticated")} not in receivers list")
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
