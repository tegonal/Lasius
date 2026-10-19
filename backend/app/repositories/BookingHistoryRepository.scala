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

import com.google.inject.ImplementedBy
import core.DBSession
import models.BaseFormat._
import models.UserId.UserReference
import models._
import org.joda.time.{LocalDate, LocalDateTime}
import play.api.Logging
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._
import reactivemongo.api.bson.{
  BSONArray,
  BSONDocument,
  BSONInteger,
  BSONNumberLike
}
import reactivemongo.api.bson.collection.BSONCollection
import reactivemongo.api.indexes.{Index, IndexType}
import reactivemongo.play.json.compat.ValueConverters
import repositories.MongoDBCommandSet._

import javax.inject.Inject
import scala.concurrent._

@ImplementedBy(classOf[BookingHistoryMongoRepository])
trait BookingHistoryRepository
    extends BaseRepository[BookingV2, BookingId]
    with PersistentUserViewRepository[BookingV2, BookingId] {
  def findByUserAndRange(orgId: OrganisationId,
                         userReference: UserReference,
                         from: LocalDateTime,
                         to: LocalDateTime,
                         limit: Option[Int],
                         skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]]

  def findByOrganisationAndRange(orgId: OrganisationId,
                                 from: LocalDateTime,
                                 to: LocalDateTime,
                                 limit: Option[Int],
                                 skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]]

  def findByProjectAndRange(projectId: ProjectId,
                            from: LocalDateTime,
                            to: LocalDateTime,
                            limit: Option[Int],
                            skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]]

  def findLastActivityDateByProjects(projectIds: Seq[ProjectId])(implicit
      dbSession: DBSession): Future[Map[ProjectId, LocalDateTime]]

  /** Sums the bookings that `findByRange` returns for the same arguments. A
    * booking that overlaps the range counts with its full duration.
    */
  def summaryByRange(userReference: Option[UserReference],
                     orgId: Option[OrganisationId],
                     projectId: Option[ProjectId],
                     from: LocalDateTime,
                     to: LocalDateTime)(implicit
      dbSession: DBSession): Future[BookingSummary]

  /** Groups the bookings of `findByRange` by their start day. A booking that
    * starts before `from` and ends in the range keeps its earlier start day.
    */
  def dailyTotalsByRange(userReference: UserReference,
                         orgId: OrganisationId,
                         from: LocalDateTime,
                         to: LocalDateTime)(implicit
      dbSession: DBSession): Future[Seq[DailyBookingTotal]]

  /** Returns one page of the bookings of `orgId`, newest first. `userReference`
    * limits the page to the bookings of one user.
    */
  def pageByRange(userReference: Option[UserReference],
                  orgId: OrganisationId,
                  filter: BookingPageFilter,
                  from: LocalDateTime,
                  to: LocalDateTime,
                  limit: Int,
                  skip: Int,
                  withSummary: Boolean)(implicit
      dbSession: DBSession): Future[BookingPage]

  def updateBooking(newBooking: BookingV2)(implicit
      format: Format[BookingV2],
      dbSession: DBSession): Future[Boolean]

  def ensureIndexes()(implicit dbSession: DBSession): Future[Unit]
}

object BookingHistoryMongoRepository {

  val maxPageSize = 1000

  /** Each index ends with `_id`, so that the sort of `findByRange` and a paged
    * read with an `_id` tiebreak use the index without an in-memory sort.
    */
  val indexes: Seq[(String, Seq[String])] = Seq(
    "organisation_user_start" -> Seq("organisationReference.id",
                                     "userReference.id",
                                     "start.dateTime",
                                     "_id"),
    "organisation_start" -> Seq("organisationReference.id",
                                "start.dateTime",
                                "_id"),
    "project_start" -> Seq("projectReference.id", "start.dateTime", "_id")
  )
}

class BookingHistoryMongoRepository @Inject() ()(
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[BookingV2, BookingId]()
    with BookingHistoryRepository
    with MongoPersistentUserViewRepository[BookingV2, BookingId]
    with Logging {
  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("BookingHistory", failoverStrategy)

  override def findByUserAndRange(orgId: OrganisationId,
                                  userReference: UserReference,
                                  from: LocalDateTime,
                                  to: LocalDateTime,
                                  limit: Option[Int],
                                  skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]] =
    findByRange(Some(userReference), Some(orgId), None, from, to, limit, skip)

  override def findByOrganisationAndRange(orgId: OrganisationId,
                                          from: LocalDateTime,
                                          to: LocalDateTime,
                                          limit: Option[Int],
                                          skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]] =
    findByRange(None, Some(orgId), None, from, to, limit, skip)

  override def findByProjectAndRange(projectId: ProjectId,
                                     from: LocalDateTime,
                                     to: LocalDateTime,
                                     limit: Option[Int],
                                     skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]] =
    findByRange(None, None, Some(projectId), from, to, limit, skip)

  override def findLastActivityDateByProjects(projectIds: Seq[ProjectId])(
      implicit dbSession: DBSession): Future[Map[ProjectId, LocalDateTime]] = {
    if (projectIds.isEmpty) {
      Future.successful(Map.empty)
    } else {
      val collection = coll
      import collection.AggregationFramework._
      import reactivemongo.api.bson._

      val pipeline = List(
        Match(
          BSONDocument(
            "projectReference.id" -> BSONDocument(
              "$in" -> projectIds.map(_.value.toString)),
            "end" -> BSONDocument("$ne" -> BSONNull)
          )),
        Sort(Descending("start.dateTime")),
        Group(BSONString("$projectReference.id"))(
          "lastActivityDate" -> First(BSONString("$start.dateTime")),
          "projectId"        -> First(BSONString("$projectReference.id"))
        )
      )

      logger.debug(
        s"findLastActivityDateByProjects for ${projectIds.size} projects")

      collection
        .aggregateWith[BSONDocument]()(_ => pipeline)
        .collect[List]()
        .map { results =>
          results.flatMap { doc =>
            for {
              projectIdValue  <- doc.getAsOpt[String]("projectId")
              lastActivityStr <- doc.getAsOpt[String]("lastActivityDate")
              projectId = ProjectId(java.util.UUID.fromString(projectIdValue))
              lastActivity = LocalDateTime.parse(lastActivityStr)
            } yield projectId -> lastActivity
          }.toMap
        }
        .recover { case ex =>
          logger.error(s"Error finding last activity dates: ${ex.getMessage}",
                       ex)
          Map.empty[ProjectId, LocalDateTime]
        }
    }
  }

  private def rangeSelector(userReference: Option[UserReference],
                            orgId: Option[OrganisationId],
                            projectId: Option[ProjectId],
                            from: LocalDateTime,
                            to: LocalDateTime): JsObject = {
    val conditions = Seq[Option[(String, JsValueWrapper)]](
      Some("start.dateTime" -> Json.obj(LowerOrEqualsThan -> to)),
      Some("end.dateTime"   -> Json.obj(GreaterOrEqualsThan -> from)),
      userReference.map(ref => "userReference.id" -> ref.id),
      orgId.map(ref => "organisationReference.id" -> ref),
      projectId.map(ref => "projectReference.id" -> ref)
    )
    Json.obj(conditions.flatten: _*)
  }

  // Without a timezone, $dateFromString reads the local time as UTC. The
  // difference then equals the browser computation, and an unknown zone name
  // cannot fail the aggregation.
  private val durationMsExpression: BSONDocument = {
    def instant(field: String): BSONDocument =
      BSONDocument(
        "$dateFromString" -> BSONDocument("dateString" -> s"$$$field.dateTime"))
    BSONDocument("$subtract" -> BSONArray(instant("end"), instant("start")))
  }

  override def dailyTotalsByRange(userReference: UserReference,
                                  orgId: OrganisationId,
                                  from: LocalDateTime,
                                  to: LocalDateTime)(implicit
      dbSession: DBSession): Future[Seq[DailyBookingTotal]] = {
    val collection = coll
    import collection.AggregationFramework._

    val sel = ValueConverters.toDocument(
      rangeSelector(Some(userReference), Some(orgId), None, from, to))

    // The first 10 characters of the stored local time are the start day.
    val pipeline = List(
      Match(sel),
      Group(
        BSONDocument("$substrBytes" -> BSONArray("$start.dateTime", 0, 10)))(
        "durationMs" -> Sum(durationMsExpression),
        "bookings"   -> Sum(BSONInteger(1))
      ),
      Sort(Ascending("_id"))
    )

    collection
      .aggregateWith[BSONDocument]()(_ => pipeline)
      .collect[List]()
      .map(_.flatMap { doc =>
        for {
          date       <- doc.getAsOpt[String]("_id")
          durationMs <- doc.getAsOpt[BSONNumberLike]("durationMs")
          bookings   <- doc.getAsOpt[Int]("bookings")
        } yield DailyBookingTotal(LocalDate.parse(date),
                                  durationMs.toLong.getOrElse(0L),
                                  bookings)
      })
  }

  override def summaryByRange(userReference: Option[UserReference],
                              orgId: Option[OrganisationId],
                              projectId: Option[ProjectId],
                              from: LocalDateTime,
                              to: LocalDateTime)(implicit
      dbSession: DBSession): Future[BookingSummary] =
    summaryOf(
      ValueConverters.toDocument(
        rangeSelector(userReference, orgId, projectId, from, to)))

  override def pageByRange(userReference: Option[UserReference],
                           orgId: OrganisationId,
                           filter: BookingPageFilter,
                           from: LocalDateTime,
                           to: LocalDateTime,
                           limit: Int,
                           skip: Int,
                           withSummary: Boolean)(implicit
      dbSession: DBSession): Future[BookingPage] = {
    val sel        = pageSelector(userReference, orgId, filter, from, to)
    val selBson    = ValueConverters.toDocument(sel)
    val boundLimit = limit.max(1).min(BookingHistoryMongoRepository.maxPageSize)

    val itemsFuture = find(sel = sel,
                           sort = Json.obj("start.dateTime" -> -1, "_id" -> -1),
                           limit = boundLimit,
                           skip = skip.max(0)).map(_.map(_._1).toSeq)
    val totalFuture   = coll.count(selector = Some(selBson)).map(_.toInt)
    val summaryFuture =
      if (withSummary) summaryOf(selBson).map(Some(_))
      else Future.successful(None)

    for {
      items   <- itemsFuture
      total   <- totalFuture
      summary <- summaryFuture
    } yield BookingPage(items, total, summary)
  }

  private def pageSelector(userReference: Option[UserReference],
                           orgId: OrganisationId,
                           filter: BookingPageFilter,
                           from: LocalDateTime,
                           to: LocalDateTime): JsObject = {
    // A tag id is user input, so $literal keeps an id that starts with "$"
    // from reading as a field path. $toUpper and $trim normalise both sides.
    def normalised(value: JsValue): JsObject =
      Json.obj("$toUpper" -> Json.obj("$trim" -> Json.obj("input" -> value)))
    val tagIds       = filter.tagIds.map(_.trim).filter(_.nonEmpty).distinct
    val tagCondition =
      if (tagIds.isEmpty) Json.obj()
      else
        Json.obj(
          "$expr" -> Json.obj("$setIsSubset" -> Json.arr(
            JsArray(tagIds.map(id => normalised(Json.obj("$literal" -> id)))),
            Json.obj(
              "$map" -> Json.obj(
                "input" -> Json.obj("$ifNull" -> Json.arr("$tags", Json.arr())),
                "as"    -> "tag",
                "in"    -> normalised(JsString("$$tag.id"))
              ))
          )))

    val filterConditions = Seq[Option[(String, JsValueWrapper)]](
      filter.projectId.filter(_.nonEmpty).map("projectReference.id" -> _),
      filter.userId.filter(_.nonEmpty).map("userReference.id" -> _)
    ).flatten

    rangeSelector(userReference, Some(orgId), None, from, to) ++
      Json.obj(filterConditions: _*) ++ tagCondition
  }

  private def summaryOf(sel: BSONDocument)(implicit
      dbSession: DBSession): Future[BookingSummary] = {
    val collection = coll
    import collection.AggregationFramework._
    import reactivemongo.api.bson._

    val pipeline = List(
      Match(sel),
      Group(BSONNull)(
        "durationMs" -> Sum(durationMsExpression),
        "bookings"   -> Sum(BSONInteger(1)),
        "users"      -> AddFieldToSet("userReference.id"),
        "projects"   -> AddFieldToSet("projectReference.id")
      ),
      Project(
        BSONDocument(
          "durationMs"       -> BSONDocument("$toLong" -> "$durationMs"),
          "bookings"         -> 1,
          "distinctUsers"    -> BSONDocument("$size" -> "$users"),
          "distinctProjects" -> BSONDocument("$size" -> "$projects")
        ))
    )

    collection
      .aggregateWith[BSONDocument]()(_ => pipeline)
      .headOption
      .map(_.fold(BookingSummary.empty) { doc =>
        BookingSummary(
          durationMs = doc.getAsOpt[Long]("durationMs").getOrElse(0L),
          bookings = doc.getAsOpt[Int]("bookings").getOrElse(0),
          distinctUsers = doc.getAsOpt[Int]("distinctUsers").getOrElse(0),
          distinctProjects = doc.getAsOpt[Int]("distinctProjects").getOrElse(0)
        )
      })
  }

  private def findByRange(userReference: Option[UserReference],
                          orgId: Option[OrganisationId],
                          projectId: Option[ProjectId],
                          from: LocalDateTime,
                          to: LocalDateTime,
                          limit: Option[Int],
                          skip: Option[Int])(implicit
      dbSession: DBSession): Future[Iterable[BookingV2]] = {

    val sel = rangeSelector(userReference, orgId, projectId, from, to)

    // The selector fixes the user, organisation and project ids, so a sort
    // key on them changes no order. It only stops the index from serving the sort.
    val sort = Json.obj("start.dateTime" -> 1, "_id" -> 1)

    logger.debug(s"findByUserAndRange:$sel")
    find(sel = sel,
         sort = sort,
         limit = limit.getOrElse(-1),
         skip = skip.getOrElse(0))
      .map(_.map(_._1))
  }

  override def upsert(t: BookingV2)(implicit
      writer: Writes[BookingId],
      dbSession: DBSession): Future[Unit] = {
    logger.debug(s"insertBooking[$t]")
    super.upsert(t)
  }

  override def updateBooking(newBooking: BookingV2)(implicit
      format: Format[BookingV2],
      dbSession: DBSession): Future[Boolean] = {
    val bookingJson = format.writes(newBooking).as[JsObject]
    logger.debug(s"updateBooking[$newBooking], json:$bookingJson")

    update(Json.obj("id" -> newBooking.id), bookingJson, upsert = false)
  }

  override def ensureIndexes()(implicit dbSession: DBSession): Future[Unit] = {
    val manager = coll.indexesManager
    Future
      .traverse(BookingHistoryMongoRepository.indexes) { case (name, fields) =>
        manager.ensure(
          Index(key = fields.map(_ -> IndexType.Ascending), name = Some(name)))
      }
      .map(_ => ())
  }
}
