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

import akka.pattern.ask
import akka.util.Timeout
import core.{CacheAware, DBSupport, SystemServices}
import domain.views.CurrentUserTimeBookingsView._

import javax.inject.{Inject, Singleton}
import models._
import play.api.Logging
import play.api.cache.AsyncCacheApi
import play.api.libs.json._
import play.api.mvc.{AbstractController, Action, ControllerComponents}
import play.modules.reactivemongo.ReactiveMongoApi

import scala.concurrent.ExecutionContext

@Singleton
class CurrentUserTimeBookingsController @Inject() (
    controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val cache: AsyncCacheApi,
    override val reactiveMongoApi: ReactiveMongoApi)(implicit
    ec: ExecutionContext)
    extends BaseLasiusController(controllerComponents) {

  implicit val timeout: Timeout = systemServices.timeout

  def getCurrentTimeBooking(): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      _ => implicit subject => _ => implicit request =>
        (systemServices.currentUserTimeBookingsViewService ? GetCurrentTimeBooking(
          subject.userReference)).map {
          case c: CurrentUserTimeBookingEvent =>
            Ok(Json.toJson(c.booking))
          case x =>
            logger.debug(
              s"getCurrentTimeBooking:${subject.userReference.id.value} => $x")
            BadRequest
        }
    }
}
