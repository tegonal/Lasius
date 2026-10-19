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

package controllers

import com.typesafe.config.Config
import org.apache.pekko.util.Timeout
import core.SystemServices
import models._
import org.apache.pekko.util.Timeout
import org.joda.time._
import play.api.cache.SyncCacheApi
import play.api.libs.json._
import play.api.mvc.{Action, ControllerComponents}
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{BookingHistoryRepository, ProjectRepository}

import javax.inject.Inject
import scala.concurrent.ExecutionContext

object TimeBookingHistoryController {
  val defaultHistoryLimit = 1000
  val maxHistoryLimit     = 5000
}

class TimeBookingHistoryController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val reactiveMongoApi: ReactiveMongoApi,
    bookingHistoryRepository: BookingHistoryRepository,
    projectRepository: ProjectRepository)(implicit ec: ExecutionContext)
    extends BaseLasiusController() {

  implicit val timeout: Timeout = systemServices.timeout

  private val defaultPageSize    = 100
  private val defaultRecentLimit = 20
  private val maxRecentLimit     = 100

  /** The raw history lists have no paging in the frontend, so an absent limit
    * gets a default and an explicit limit gets a maximum.
    */
  private def historyLimit(limit: Option[Int]): Option[Int] =
    Some(
      limit
        .getOrElse(TimeBookingHistoryController.defaultHistoryLimit)
        .max(1)
        .min(TimeBookingHistoryController.maxHistoryLimit))

  def getTimeBookingHistoryByUser(orgId: OrganisationId,
                                  from: LocalDateTime,
                                  to: LocalDateTime,
                                  limit: Option[Int],
                                  skip: Option[Int]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { _ =>
          logger.debug(
            s"getTimeBookingHistory, userId:${subject.userReference.id.value}, from:$from, to:$to")
          bookingHistoryRepository
            .findByUserAndRange(orgId,
                                subject.userReference,
                                from,
                                to,
                                historyLimit(limit),
                                skip)
            .map { bookings =>
              Ok(Json.toJson(bookings))
            }
        }
    }

  def getTimeBookingHistoryByOrganisation(orgId: OrganisationId,
                                          from: LocalDateTime,
                                          to: LocalDateTime,
                                          limit: Option[Int],
                                          skip: Option[Int]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { _ =>
          logger.debug(
            s"getTimeBookingHistory, userId:${subject.userReference.id.value}, from:$from, to:$to")
          bookingHistoryRepository
            .findByOrganisationAndRange(orgId,
                                        from,
                                        to,
                                        historyLimit(limit),
                                        skip)
            .map { bookings =>
              Ok(Json.toJson(bookings))
            }
        }
    }

  def getTimeBookingHistoryByProject(orgId: OrganisationId,
                                     projectId: ProjectId,
                                     from: LocalDateTime,
                                     to: LocalDateTime,
                                     limit: Option[Int],
                                     skip: Option[Int]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectAdministrator,
                                                 projectRepository) { _ =>
          logger.debug(
            s"getTimeBookingHistory, userId:${subject.userReference.id.value}, from:$from, to:$to")
          bookingHistoryRepository
            .findByProjectAndRange(projectId,
                                   from,
                                   to,
                                   historyLimit(limit),
                                   skip)
            .map { bookings =>
              Ok(Json.toJson(bookings))
            }
        }
    }

  def getUserBookingSummary(orgId: OrganisationId,
                            from: LocalDateTime,
                            to: LocalDateTime): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { _ =>
          bookingHistoryRepository
            .summaryByRange(Some(subject.userReference),
                            Some(orgId),
                            None,
                            from,
                            to)
            .map(summary => Ok(Json.toJson(summary)))
        }
    }

  def getUserBookingDailyTotals(orgId: OrganisationId,
                                from: LocalDateTime,
                                to: LocalDateTime): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { _ =>
          bookingHistoryRepository
            .dailyTotalsByRange(subject.userReference, orgId, from, to)
            .map(totals => Ok(Json.toJson(totals)))
        }
    }

  def getUserBookingPage(orgId: OrganisationId,
                         from: LocalDateTime,
                         to: LocalDateTime,
                         projectId: Option[String],
                         tagId: List[String],
                         limit: Option[Int],
                         skip: Option[Int],
                         withSummary: Option[Boolean]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { _ =>
          bookingHistoryRepository
            .pageByRange(
              Some(subject.userReference),
              orgId,
              BookingPageFilter(projectId, userId = None, tagIds = tagId),
              from,
              to,
              limit.getOrElse(defaultPageSize),
              skip.getOrElse(0),
              withSummary.getOrElse(true)
            )
            .map(page => Ok(Json.toJson(page)))
        }
    }

  def getOrganisationBookingPage(orgId: OrganisationId,
                                 from: LocalDateTime,
                                 to: LocalDateTime,
                                 projectId: Option[String],
                                 userId: Option[String],
                                 tagId: List[String],
                                 limit: Option[Int],
                                 skip: Option[Int],
                                 withSummary: Option[Boolean]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { _ =>
          bookingHistoryRepository
            .pageByRange(None,
                         orgId,
                         BookingPageFilter(projectId, userId, tagIds = tagId),
                         from,
                         to,
                         limit.getOrElse(defaultPageSize),
                         skip.getOrElse(0),
                         withSummary.getOrElse(true))
            .map(page => Ok(Json.toJson(page)))
        }
    }

  def getUserRecentBookings(orgId: OrganisationId,
                            from: LocalDateTime,
                            to: LocalDateTime,
                            limit: Option[Int]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { _ =>
          bookingHistoryRepository
            .recentCombinations(Some(subject.userReference),
                                orgId,
                                from,
                                to,
                                recentLimit(limit))
            .map(bookings => Ok(Json.toJson(bookings)))
        }
    }

  def getOrganisationRecentBookings(orgId: OrganisationId,
                                    from: LocalDateTime,
                                    to: LocalDateTime,
                                    limit: Option[Int]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { _ =>
          bookingHistoryRepository
            .recentCombinations(None, orgId, from, to, recentLimit(limit))
            .map(bookings => Ok(Json.toJson(bookings)))
        }
    }

  private def recentLimit(limit: Option[Int]): Int =
    limit.getOrElse(defaultRecentLimit).max(1).min(maxRecentLimit)

  def getOrganisationBookingSummary(orgId: OrganisationId,
                                    from: LocalDateTime,
                                    to: LocalDateTime): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { _ =>
          bookingHistoryRepository
            .summaryByRange(None, Some(orgId), None, from, to)
            .map(summary => Ok(Json.toJson(summary)))
        }
    }

  def getProjectBookingSummary(orgId: OrganisationId,
                               projectId: ProjectId,
                               from: LocalDateTime,
                               to: LocalDateTime): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => implicit subject => user => implicit request =>
        isOrgAdminOrHasProjectRoleInOrganisation(user,
                                                 orgId,
                                                 projectId,
                                                 ProjectAdministrator,
                                                 projectRepository) { _ =>
          bookingHistoryRepository
            .summaryByRange(None, None, Some(projectId), from, to)
            .map(summary => Ok(Json.toJson(summary)))
        }
    }
}
