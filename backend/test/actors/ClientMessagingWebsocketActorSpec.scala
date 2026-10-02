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

import actors.ControlCommands.SendToClient
import com.typesafe.config.ConfigFactory
import controllers.AuthConfig
import core.SystemServices
import models._
import org.apache.pekko.actor.ActorRef
import org.apache.pekko.testkit.TestProbe
import org.specs2.mock.Mockito
import org.specs2.mutable.Specification
import pekko.ActorTestScope
import play.modules.reactivemongo.ReactiveMongoApi

import scala.concurrent.duration._

class ClientMessagingWebsocketActorSpec extends Specification with Mockito {

  private val user  = UserId()
  private val other = UserId()

  /** A websocket whose ticket store holds one ticket of the user. */
  private def websocket(scope: ActorTestScope, out: TestProbe): ActorRef = {
    val systemServices = mock[SystemServices]
    systemServices.consumeWsTicket(anyString).returns(None)
    systemServices
      .consumeWsTicket("ticket")
      .returns(Some(user -> EntityReference(user, "user")))
    scope.system.actorOf(
      ClientMessagingWebsocketActor.props(systemServices,
                                          ConfigFactory.empty(),
                                          mock[ReactiveMongoApi],
                                          mock[AuthConfig])(out.ref))
  }

  "ClientMessagingWebsocketActor" should {
    "authenticate a websocket with a ticket" in new ActorTestScope {
      private val out = TestProbe()

      websocket(this, out) ! HelloServer("client", "ticket", None)

      out.expectMsg(HelloClient)
    }

    "answer AuthenticationFailed to a token that is no ticket" in new ActorTestScope {
      private val out = TestProbe()

      websocket(this, out) ! HelloServer("client", "not-a-token", None)

      out.expectMsg(5.seconds, AuthenticationFailed)
    }

    "send an event only to the listed receivers" in new ActorTestScope {
      private val out    = TestProbe()
      private val socket = websocket(this, out)
      socket ! HelloServer("client", "ticket", None)
      out.expectMsg(HelloClient)

      socket ! SendToClient(other, Pong, List(other))
      socket ! SendToClient(other, Pong, Nil)
      out.expectNoMessage(200.millis)

      socket ! SendToClient(other, Pong, List(other, user))
      out.expectMsg(Pong)
    }
  }
}
