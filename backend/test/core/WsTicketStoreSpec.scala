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

import models.{EntityReference, UserId}
import org.specs2.mutable.Specification

import java.time.{Clock, Instant, ZoneId, ZoneOffset}

class WsTicketStoreSpec extends Specification {

  private class SettableClock(var now: Instant) extends Clock {
    override def getZone: ZoneId               = ZoneOffset.UTC
    override def withZone(zone: ZoneId): Clock = this
    override def instant(): Instant            = now
    def advanceSeconds(seconds: Long): Unit    = now = now.plusSeconds(seconds)
  }

  private val userId    = UserId()
  private val reference = EntityReference(userId, "user")

  private def store() = {
    val clock = new SettableClock(Instant.parse("2026-10-03T10:00:00Z"))
    (new WsTicketStore(clock), clock)
  }

  "WsTicketStore" should {
    "redeem a ticket once" in {
      val (tickets, _) = store()
      val ticket       = tickets.create(userId, reference)

      tickets.consume(ticket) must beSome((userId, reference))
      tickets.consume(ticket) must beNone
    }

    "redeem a ticket at the end of its lifetime" in {
      val (tickets, clock) = store()
      val ticket           = tickets.create(userId, reference)
      clock.advanceSeconds(WsTicketStore.TtlSeconds)

      tickets.consume(ticket) must beSome((userId, reference))
    }

    "reject a ticket after its lifetime" in {
      val (tickets, clock) = store()
      val ticket           = tickets.create(userId, reference)
      clock.advanceSeconds(WsTicketStore.TtlSeconds + 1)

      tickets.consume(ticket) must beNone
    }

    "reject an unknown ticket" in {
      val (tickets, _) = store()

      tickets.consume("unknown") must beNone
    }
  }
}
