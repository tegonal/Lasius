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

import models.UserId
import models.UserId.UserReference

import java.time.{Clock, Instant}
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

object WsTicketStore {
  val TtlSeconds: Long = 60L

  private final case class WsTicket(userId: UserId,
                                    userReference: UserReference,
                                    createdAt: Instant) {
    def isExpiredAt(now: Instant): Boolean =
      now.getEpochSecond - createdAt.getEpochSecond > TtlSeconds
  }
}

/** Keeps the single-use tickets that authenticate a websocket connection.
  * `remove` redeems a ticket atomically, so a ticket opens one connection only.
  */
class WsTicketStore(clock: Clock) {
  import WsTicketStore._

  private val tickets = new ConcurrentHashMap[String, WsTicket]()

  def create(userId: UserId, userReference: UserReference): String = {
    val now = Instant.now(clock)
    tickets.values().removeIf(_.isExpiredAt(now))
    val ticket = UUID.randomUUID().toString
    tickets.put(ticket, WsTicket(userId, userReference, now))
    ticket
  }

  def consume(ticket: String): Option[(UserId, UserReference)] =
    Option(tickets.remove(ticket))
      .filterNot(_.isExpiredAt(Instant.now(clock)))
      .map(stored => (stored.userId, stored.userReference))
}
