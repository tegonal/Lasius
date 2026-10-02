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
import org.apache.pekko.pattern.pipe
import play.modules.reactivemongo.ReactiveMongoApi

import java.util.concurrent.ConcurrentLinkedQueue
import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.Try
import scala.util.control.NonFatal

object ControlCommands {
  case class SendToClient(senderUserId: UserId,
                          event: OutEvent,
                          receivers: List[UserId])
}

@ImplementedBy(classOf[ClientReceiverWebsocket])
trait ClientReceiver {

  /** Sends the event to the open websockets of the receivers. An empty list
    * reaches nobody.
    */
  def send(senderUserId: UserId, event: OutEvent, receivers: List[UserId]): Unit

  def !(senderUserId: UserId, event: OutEvent, receivers: List[UserId]): Unit
}

class ClientReceiverWebsocket extends ClientReceiver {

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

  private sealed trait TokenValidated
  private final case class TokenAccepted(userId: UserId) extends TokenValidated
  private case object TokenRejected                      extends TokenValidated
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

  import ClientMessagingWebsocketActor._

  override val supportTransaction: Boolean = systemServices.supportTransaction
  implicit val executionContext: ExecutionContextExecutor =
    context.system.dispatcher
  private var userId: Option[UserId] = None

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
      systemServices.consumeWsTicket(token) match {
        case Some((uid, _)) =>
          authenticate(uid)
        case None =>
          // A client without a ticket can still send an access token.
          Future
            .fromTry(
              Try(
                withToken(tokenIssuer = tokenIssuer,
                          token = token,
                          withinTransaction = true,
                          canCreateNewUser = false) {
                  Future.successful[TokenValidated](TokenRejected)
                } { _ => subject =>
                  Future.successful(TokenAccepted(subject.userReference.id))
                }))
            .flatten
            .recover { case NonFatal(_) => TokenRejected }
            .pipeTo(self)
      }

    case TokenAccepted(uid) =>
      authenticate(uid)

    case TokenRejected =>
      userId = None
      out ! AuthenticationFailed
      context.become(unauthenticated)
  }

  private def authenticate(uid: UserId): Unit = {
    userId = Some(uid)
    log.debug(s"Authenticated the websocket of user ${uid.value}")
    out ! HelloClient
    context.become(authenticated)
  }

  private def authenticated: Receive = unauthenticated.orElse {
    case SendToClient(_, event, receivers) =>
      if (userId.exists(receivers.contains)) out ! event
  }

  def receive: Receive = unauthenticated

  override def postStop(): Unit = {
    // remove from active actors
    ClientMessagingWebsocketActor.actors.remove(self)
    log.debug(
      s"Websocket connection closed for user ${userId.map(_.value).getOrElse("'Unauthenticated'")}")
    super.postStop()
  }
}
