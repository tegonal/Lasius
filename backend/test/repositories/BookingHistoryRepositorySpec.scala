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
import org.joda.time.{DateTime, LocalDate, LocalDateTime}
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

  private val rangeFrom = date("01.01.2000").toLocalDateTime
  private val rangeTo   = date("01.02.2000").toLocalDateTime

  private def booking(user: EntityReference[UserId],
                      org: EntityReference[OrganisationId],
                      project: EntityReference[ProjectId],
                      start: DateTime,
                      hours: Int): BookingV2 =
    BookingV2(BookingId(),
              start.toLocalDateTimeWithZone(),
              Some(start.plusHours(hours).toLocalDateTimeWithZone()),
              user,
              org,
              project,
              Set())

  private def insert(bookings: BookingV2*): Unit =
    withDBSession() { implicit dbSession =>
      repository.bulkInsert(bookings.toList)
    }.awaitResult()

  "pageByRange" should {
    val noFilter = BookingPageFilter(None, None, Nil)

    def page(user: Option[EntityReference[UserId]],
             org: OrganisationId,
             filter: BookingPageFilter,
             limit: Int = 100,
             skip: Int = 0,
             withSummary: Boolean = true): BookingPage =
      withDBSession() { implicit dbSession =>
        repository.pageByRange(user,
                               org,
                               filter,
                               rangeFrom,
                               rangeTo,
                               limit,
                               skip,
                               withSummary)
      }.awaitResult()

    def tagged(base: BookingV2, tags: Tag*): BookingV2 =
      base.copy(tags = tags.toSet)

    "require every selected tag, after trim and upper case" in {
      val user    = EntityReference(UserId(), "tagUser")
      val org     = EntityReference(OrganisationId(), "tagOrg")
      val project = EntityReference(ProjectId(), "tagProject")
      val start   = date("03.01.2000").plusHours(8)
      val both    = tagged(booking(user, org, project, start, 1),
                        SimpleTag(TagId(" Billable ")),
                        SimpleTag(TagId("Meeting")))
      val one = tagged(booking(user, org, project, start.plusHours(2), 1),
                       SimpleTag(TagId("billable")))
      val group =
        tagged(booking(user, org, project, start.plusHours(4), 1),
               TagGroup(TagId("Support"), Seq(SimpleTag(TagId("Billable")))))
      val dollar = tagged(booking(user, org, project, start.plusHours(6), 1),
                          SimpleTag(TagId("$tags")))
      insert(both, one, group, dollar)

      def ids(tagIds: String*): Seq[BookingId] =
        page(None, org.id, BookingPageFilter(None, None, tagIds)).items
          .map(_.id)

      ids("BILLABLE ", "meeting") must equalTo(Seq(both.id))
      ids("billable") must equalTo(Seq(one.id, both.id))
      ids("support") must equalTo(Seq(group.id))
      ids("$tags") must equalTo(Seq(dollar.id))
      ids(" ") must haveSize(4)
    }

    "filter by user and project, and count the filtered set" in {
      val user1    = EntityReference(UserId(), "pageUser1")
      val user2    = EntityReference(UserId(), "pageUser2")
      val org      = EntityReference(OrganisationId(), "pageOrg")
      val project1 = EntityReference(ProjectId(), "pageProject1")
      val project2 = EntityReference(ProjectId(), "pageProject2")
      insert(
        booking(user1, org, project1, date("03.01.2000").plusHours(8), 2),
        booking(user1, org, project2, date("04.01.2000").plusHours(8), 3),
        booking(user2, org, project1, date("05.01.2000").plusHours(8), 4)
      )

      val byUser =
        page(None,
             org.id,
             BookingPageFilter(None, Some(user1.id.value.toString), Nil))
      byUser.total must equalTo(2)
      byUser.summary must beSome(
        BookingSummary(5L * 3600000,
                       2,
                       distinctUsers = 1,
                       distinctProjects = 2))

      val byProject =
        page(Some(user1),
             org.id,
             BookingPageFilter(Some(project1.id.value.toString), None, Nil))
      byProject.items.map(_.projectReference) must equalTo(Seq(project1))
      byProject.total must equalTo(1)

      page(None, org.id, noFilter, withSummary = false).summary must beNone
    }

    "return the newest booking first, with a stable order across pages" in {
      val user    = EntityReference(UserId(), "orderUser")
      val org     = EntityReference(OrganisationId(), "orderOrg")
      val project = EntityReference(ProjectId(), "orderProject")
      val start   = date("10.01.2000").plusHours(8)
      // Three bookings share a start time, so only the _id tiebreak orders them.
      val bookings = Seq(0, 0, 0, 1, 2).map(hours =>
        booking(user, org, project, start.plusHours(hours), 1))
      insert(bookings: _*)

      val all   = page(None, org.id, noFilter).items.map(_.id)
      val paged = (0 until 5 by 2).flatMap(skip =>
        page(None, org.id, noFilter, limit = 2, skip = skip).items.map(_.id))

      all must haveSize(5)
      paged must equalTo(all)
      page(None, org.id, noFilter).items.head.start.dateTime must equalTo(
        start.plusHours(2).toLocalDateTime)
      page(None, org.id, noFilter, limit = 5000).total must equalTo(5)
    }
  }

  "dailyTotalsByRange" should {

    "group the bookings of the user by start day, in date order" in {
      val user    = EntityReference(UserId(), "dailyUser")
      val other   = EntityReference(UserId(), "otherUser")
      val org     = EntityReference(OrganisationId(), "dailyOrg")
      val project = EntityReference(ProjectId(), "dailyProject")
      insert(
        booking(user, org, project, date("31.12.1999").plusHours(22), 4),
        booking(user, org, project, date("05.01.2000").plusHours(13), 2),
        booking(user, org, project, date("05.01.2000").plusHours(8), 3),
        booking(user, org, project, date("03.01.2000").plusHours(8), 1),
        booking(other, org, project, date("03.01.2000").plusHours(8), 5),
        booking(user, org, project, date("05.02.2000").plusHours(8), 6)
      )

      val totals = withDBSession() { implicit dbSession =>
        repository.dailyTotalsByRange(user, org.id, rangeFrom, rangeTo)
      }.awaitResult()

      totals must equalTo(
        Seq(
          DailyBookingTotal(LocalDate.parse("1999-12-31"), 4L * 3600000, 1),
          DailyBookingTotal(LocalDate.parse("2000-01-03"), 1L * 3600000, 1),
          DailyBookingTotal(LocalDate.parse("2000-01-05"), 5L * 3600000, 2)
        ))
    }
  }

  "summaryByRange" should {
    val from = rangeFrom
    val to   = rangeTo

    def summary(user: Option[EntityReference[UserId]],
                org: Option[OrganisationId],
                project: Option[ProjectId]): BookingSummary =
      withDBSession() { implicit dbSession =>
        repository.summaryByRange(user, org, project, from, to)
      }.awaitResult()

    "return zero values for a range without bookings" in {
      summary(None, Some(OrganisationId()), None) must equalTo(
        BookingSummary.empty)
    }

    "count a booking over the range edge with its full duration" in {
      val user    = EntityReference(UserId(), "edgeUser")
      val org     = EntityReference(OrganisationId(), "edgeOrg")
      val project = EntityReference(ProjectId(), "edgeProject")
      insert(booking(user, org, project, date("31.12.1999").plusHours(22), 6))

      summary(Some(user), Some(org.id), None) must equalTo(
        BookingSummary(durationMs = 6L * 3600 * 1000,
                       bookings = 1,
                       distinctUsers = 1,
                       distinctProjects = 1))
    }

    "count the distinct users and projects and exclude other organisations" in {
      val user1    = EntityReference(UserId(), "user1")
      val user2    = EntityReference(UserId(), "user2")
      val org      = EntityReference(OrganisationId(), "org")
      val otherOrg = EntityReference(OrganisationId(), "otherOrg")
      val project1 = EntityReference(ProjectId(), "project1")
      val project2 = EntityReference(ProjectId(), "project2")
      insert(
        booking(user1, org, project1, date("03.01.2000").plusHours(8), 2),
        booking(user1, org, project2, date("04.01.2000").plusHours(8), 3),
        booking(user2, org, project1, date("05.01.2000").plusHours(8), 4),
        booking(user2, otherOrg, project1, date("05.01.2000").plusHours(8), 5),
        booking(user2, org, project2, date("05.02.2000").plusHours(8), 7)
      )

      summary(None, Some(org.id), None) must equalTo(
        BookingSummary(durationMs = 9L * 3600 * 1000,
                       bookings = 3,
                       distinctUsers = 2,
                       distinctProjects = 2))
      summary(Some(user1), Some(org.id), None) must equalTo(
        BookingSummary(durationMs = 5L * 3600 * 1000,
                       bookings = 2,
                       distinctUsers = 1,
                       distinctProjects = 2))
      summary(None, None, Some(project1.id)) must equalTo(
        BookingSummary(durationMs = 11L * 3600 * 1000,
                       bookings = 3,
                       distinctUsers = 2,
                       distinctProjects = 1))
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
