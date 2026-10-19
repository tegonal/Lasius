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

package repositories

import models.LocalDateTimeWithTimeZone.DateTimeHelper
import models.{EntityReference, _}
import mongo.EmbedMongo
import org.joda.time.{DateTime, LocalDateTime}
import org.joda.time.format.{DateTimeFormat, DateTimeFormatter}
import reactivemongo.api.bson._
import reactivemongo.api.{FailoverStrategy, ReadPreference}

import scala.concurrent.Await
import scala.concurrent.duration._
import scala.language.postfixOps

class BookingHistoryRepositorySpec extends EmbedMongo {
  val repository = new BookingHistoryMongoRepository()

  val dateTimeFormat: DateTimeFormatter =
    DateTimeFormat.forPattern("dd.MM.yyyy")

  def date(date: String): DateTime = {
    DateTime.parse(date, dateTimeFormat)
  }

  def testFindByUserAndRange[T](from: LocalDateTime,
                                to: LocalDateTime,
                                bookingDates: Seq[(DateTime, DateTime)],
                                limit: Option[Int] = None,
                                skip: Option[Int] = None)(
      test: Iterable[BookingV2] => T)(implicit
      evidence$1: org.specs2.execute.AsResult[T]): T = {
    val user = EntityReference(UserId(), "userBookingHistoryRepositorySpec")
    val org  = EntityReference(OrganisationId(), "team1")
    // initialize
    val bookings = {
      bookingDates.map { case (start, end) =>
        BookingV2(
          BookingId(),
          start.toLocalDateTimeWithZone(),
          Some(end.toLocalDateTimeWithZone()),
          user,
          org,
          EntityReference(ProjectId(), "p1"),
          Set()
        )
      }
    }

    val find = withDBSession() { implicit dbSession =>
      repository.bulkInsert(bookings.toList).flatMap { _ =>
        repository
          .findByUserAndRange(org.id, user, from, to, limit, skip)
      }
    }.awaitResult()
    test(find)
  }

  "findByUserIdAndRange" should {

    "find BookingHistory Within range" in {

      // initialize
      val from  = date("01.01.2000").toLocalDateTime
      val to    = date("01.01.2001").toLocalDateTime
      val start = date("01.02.2000")
      val end   = date("01.03.2000")

      testFindByUserAndRange(from, to, Seq((start, end))) { result =>
        result must have size 1
        result.head.start must equalTo(start.toLocalDateTimeWithZone())
        result.head.end must beSome(end.toLocalDateTimeWithZone())
      }
    }
  }

  "find BookingHistory starting in range" in {
    // initialize
    val from  = date("01.01.2000").toLocalDateTime
    val to    = date("01.01.2001").toLocalDateTime
    val start = date("01.02.2000")
    val end   = date("01.03.2002")

    testFindByUserAndRange(from, to, Seq((start, end))) { result =>
      result must have size 1
      result.head.start must equalTo(start.toLocalDateTimeWithZone())
      result.head.end must beSome(end.toLocalDateTimeWithZone())
    }
  }

  "find BookingHistory ending in range" in {
    // initialize
    val from  = date("01.01.2010").toLocalDateTime
    val to    = date("01.01.2011").toLocalDateTime
    val start = date("01.01.2009")
    val end   = date("01.03.2010")

    testFindByUserAndRange(from, to, Seq((start, end))) { result =>
      result.head.start must equalTo(start.toLocalDateTimeWithZone())
      result.head.end must beSome(end.toLocalDateTimeWithZone())
    }
  }
  "Not find BookingV2 outside of range" in {
    // initialize
    val from  = date("01.01.2000").toLocalDateTime
    val to    = date("01.01.2001").toLocalDateTime
    val start = date("01.02.2002")
    val end   = date("01.03.2003")

    testFindByUserAndRange(from, to, Seq((start, end))) { result =>
      result.find(b =>
        b.start.dateTime
          .isAfter(from) && b.end.get.dateTime
          .isBefore(to)) must beNone
    }
  }

  "cursoring" in {

    "find all result" in {
      val from  = date("01.01.2000").toLocalDateTime
      val to    = date("31.12.2000").toLocalDateTime
      val start = date("01.01.2000")
      val end   = date("02.01.2000")

      val bookingDates = (0 to 2).map { month =>
        (start.plusMonths(month), end.plusMonths(month))
      }

      testFindByUserAndRange(from, to, bookingDates) { result =>
        result must have size 3
      }
    }

    "limit result" in {
      val from  = date("01.01.2000").toLocalDateTime
      val to    = date("31.12.2000").toLocalDateTime
      val start = date("01.01.2000")
      val end   = date("02.01.2000")

      val bookingDates = (0 to 2).map { month =>
        (start.plusMonths(month), end.plusMonths(month))
      }

      testFindByUserAndRange(from, to, bookingDates, limit = Some(1)) {
        result =>
          result must have size 1
          result.head.start.dateTime === start.toLocalDateTime
      }
    }

    "skip records" in {
      val from  = date("01.01.2000").toLocalDateTime
      val to    = date("31.12.2000").toLocalDateTime
      val start = date("01.01.2000")
      val end   = date("02.01.2000")

      val bookingDates = (0 to 2).map { month =>
        (start.plusMonths(month), end.plusMonths(month))
      }

      testFindByUserAndRange(from, to, bookingDates, skip = Some(1)) { result =>
        result must have size 2
        result.head.start.dateTime === start.plusMonths(1).toLocalDateTime
      }
    }
  }

  "ensureIndexes" should {

    def indexNames(): Set[String] = withDBSession() { implicit dbSession =>
      repository.coll.indexesManager.list().map(_.flatMap(_.name).toSet)
    }.awaitResult()

    /** Returns the stage names and the index names of the winning plan.
      */
    def explainRangeQuery(sel: BSONDocument): (Seq[String], Seq[String]) =
      withDBSession() { implicit dbSession =>
        dbSession.db
          .runCommand(
            BSONDocument(
              "explain" -> BSONDocument(
                "find"   -> "BookingHistory",
                "filter" -> sel,
                "sort"   -> BSONDocument("start.dateTime" -> 1, "_id" -> 1)),
              "verbosity" -> "queryPlanner"
            ),
            FailoverStrategy.default
          )
          .one[BSONDocument](ReadPreference.primary)
          .map { explain =>
            def collect(value: BSONValue): Seq[(String, String)] =
              value match {
                case doc: BSONDocument =>
                  doc.elements.flatMap { element =>
                    (element.name, element.value) match {
                      case (key @ ("stage" | "indexName"), BSONString(v)) =>
                        Seq(key -> v)
                      case (_, nested) => collect(nested)
                    }
                  }
                case array: BSONArray => array.values.flatMap(collect)
                case _                => Seq.empty
              }
            val plan = collect(
              explain
                .getAsOpt[BSONDocument]("queryPlanner")
                .flatMap(_.getAsOpt[BSONDocument]("winningPlan"))
                .getOrElse(BSONDocument()))
            (plan.collect { case ("stage", v) => v },
             plan.collect { case ("indexName", v) => v })
          }
      }.awaitResult()

    "create the three range indexes, also on a second call" in {
      withDBSession() { implicit dbSession =>
        repository.ensureIndexes().flatMap(_ => repository.ensureIndexes())
      }.awaitResult()

      indexNames() must containAllOf(
        BookingHistoryMongoRepository.indexes.map(_._1))
    }

    "serve the user range query and its sort from an index" in {
      withDBSession() { implicit dbSession =>
        repository.ensureIndexes()
      }.awaitResult()

      val (stages, indexes) = explainRangeQuery(
        BSONDocument(
          "organisationReference.id" -> OrganisationId().value.toString,
          "userReference.id"         -> UserId().value.toString,
          "start.dateTime"           -> BSONDocument("$lte" -> "2000-12-31"),
          "end.dateTime"             -> BSONDocument("$gte" -> "2000-01-01")
        ))

      indexes must contain("organisation_user_start")
      stages must not(contain("SORT"))
      stages must not(contain("COLLSCAN"))
    }

    "serve the project range query and its sort from an index" in {
      withDBSession() { implicit dbSession =>
        repository.ensureIndexes()
      }.awaitResult()

      val (stages, indexes) = explainRangeQuery(
        BSONDocument(
          "projectReference.id" -> ProjectId().value.toString,
          "start.dateTime"      -> BSONDocument("$lte" -> "2000-12-31"),
          "end.dateTime"        -> BSONDocument("$gte" -> "2000-01-01")
        ))

      indexes must contain("project_start")
      stages must not(contain("SORT"))
    }
  }
}
