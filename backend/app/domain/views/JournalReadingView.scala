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
import org.apache.pekko.NotUsed
import org.apache.pekko.actor.SupervisorStrategy.Restart
import org.apache.pekko.actor.{
  Actor,
  ActorLogging,
  ActorRef,
  OneForOneStrategy,
  Stash
}
import org.apache.pekko.pattern.pipe
import org.apache.pekko.persistence.query.PersistenceQuery
import org.apache.pekko.persistence.query.scaladsl.{
  CurrentEventsByPersistenceIdQuery,
  ReadJournal
}
import org.apache.pekko.stream.Materializer
import org.apache.pekko.stream.scaladsl.Source
import pekko.contrib.persistence.mongodb.MongoReadJournal

import scala.concurrent.{ExecutionContext, Future}
import scala.concurrent.duration.DurationInt
import scala.util.{Success, Try}

case object RestoreViewFromStateSuccess

case object JournalReadingViewIsLive

object JournalReadingView {
  private final case class ViewRestored(requester: ActorRef, result: Try[Unit])
}

/** A read model of one user time booking aggregate. At startup the aggregate
  * sends its restored state, and the view rebuilds from it. Later events reach
  * the view as messages from the aggregate.
  */
trait JournalReadingView extends Actor with Stash with ActorLogging {
  import JournalReadingView.ViewRestored

  val persistenceId: String

  private lazy val readJournal
      : ReadJournal with CurrentEventsByPersistenceIdQuery = {
    // Auto-detect journal based on configured persistence plugin
    val journalPlugin = context.system.settings.config
      .getString("pekko.persistence.journal.plugin")

    val journalPluginId = journalPlugin match {
      case "inmemory-journal" => "inmemory-read-journal"
      case _                  => MongoReadJournal.Identifier
    }

    PersistenceQuery(context.system)
      .readJournalFor[ReadJournal with CurrentEventsByPersistenceIdQuery](
        journalPluginId)
  }

  override val supervisorStrategy: OneForOneStrategy =
    OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1.minute) {
      case _ =>
        Restart
    }

  private def journalSource(fromSequenceNr: Long): Source[Any, NotUsed] =
    readJournal
      .currentEventsByPersistenceId(persistenceId,
                                    fromSequenceNr = fromSequenceNr,
                                    toSequenceNr = Long.MaxValue)
      .map(_.event)

  private def replayJournalSource(fromSequenceNr: Long): Unit = {
    implicit val materializer: Materializer =
      Materializer.matFromSystem(context.system)
    journalSource(fromSequenceNr).runForeach(event => context.self ! event)
  }

  val defaultReceive: Receive = {
    // The state holds every event up to `sequenceNr`, and the aggregate forwards
    // each later event. A journal replay therefore counts events twice.
    case RestoreViewFromState(userReference, sequenceNr, snapshot) =>
      log.debug(s"RestoreViewFromState: ${userReference.id}, $sequenceNr")
      implicit val executionContext: ExecutionContext = context.dispatcher
      val requester                                   = sender()
      restoreViewFromState(snapshot)
        .transform(result => Success(ViewRestored(requester, result)))
        .pipeTo(self)
      context.become(restoring)

    // Builds the view from the journal alone, from the given sequence number.
    case InitializeViewLive(userId, fromSequenceNr) =>
      log.debug(s"InitializeViewLive: $userId, $fromSequenceNr")
      context.become(live)
      replayJournalSource(fromSequenceNr)
      sender() ! JournalReadingViewIsLive
    case e: PersistedEvent =>
      log.debug(s"Received persistet event, need to switch to live mode")
      context.become(live)
      context.self ! e
    case e =>
      log.error(s"Unknown event: $e")
  }

  /** Holds every other message until the rebuild has written its result. */
  private def restoring: Receive = {
    case ViewRestored(requester, result) =>
      result.failed.foreach(cause =>
        log.error(cause, s"Failed to restore the view of $persistenceId"))
      requester ! RestoreViewFromStateSuccess
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
