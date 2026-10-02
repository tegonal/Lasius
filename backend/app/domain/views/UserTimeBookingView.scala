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

package domain.views

import domain.AggregateRoot.{InitializeViewLive, RestoreViewFromState}
import domain.UserTimeBookingAggregate.UserTimeBooking
import models.PersistedEvent
import org.apache.pekko.actor.{Actor, ActorLogging, ActorRef, Stash}
import org.apache.pekko.pattern.pipe

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Success, Try}

case object RestoreViewFromStateSuccess

case object ViewIsLive

object UserTimeBookingView {
  private final case class ViewRestored(requester: ActorRef, result: Try[Unit])
}

/** A read model of the time bookings of one user. At startup the aggregate
  * sends its recovered state, and the view rebuilds from it. The aggregate then
  * forwards each later event.
  */
trait UserTimeBookingView extends Actor with Stash with ActorLogging {
  import UserTimeBookingView.ViewRestored

  val defaultReceive: Receive = {
    case RestoreViewFromState(userReference, snapshot) =>
      log.debug(s"RestoreViewFromState: ${userReference.id}")
      implicit val executionContext: ExecutionContext = context.dispatcher
      val requester                                   = sender()
      restoreViewFromState(snapshot)
        .transform(result => Success(ViewRestored(requester, result)))
        .pipeTo(self)
      context.become(restoring)

    // Switches the view to live without a rebuild. The specs use it for a view
    // without bookings.
    case InitializeViewLive(userReference) =>
      log.debug(s"InitializeViewLive: ${userReference.id}")
      context.become(live)
      sender() ! ViewIsLive

    case e: PersistedEvent =>
      log.debug(s"Received a persisted event, the view switches to live")
      context.become(live)
      self.forward(e)

    case e =>
      log.error(s"Unknown event: $e")
  }

  /** Holds every other message until the rebuild has written its result. A
    * failed rebuild gets no answer.
    */
  private def restoring: Receive = {
    case ViewRestored(requester, result) =>
      result.fold(
        cause => log.error(cause, s"Failed to restore the view of $self"),
        _ => requester ! RestoreViewFromStateSuccess)
      unstashAll()
      context.become(live)
    case _ => stash()
  }

  val receive: Receive = defaultReceive

  protected val live: Receive

  /** Rebuilds the view from the restored aggregate state. The view stays closed
    * for other messages until the returned future completes.
    */
  protected def restoreViewFromState(snapshot: UserTimeBooking): Future[Unit]
}
