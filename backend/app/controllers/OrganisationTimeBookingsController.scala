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
import org.apache.pekko.pattern.ask
import org.apache.pekko.util.Timeout
import core.SystemServices
import domain.views.CurrentOrganisationTimeBookingsView._
import models._
import play.api.cache.SyncCacheApi
import play.api.libs.json._
import play.api.mvc.{Action, ControllerComponents}
import play.modules.reactivemongo.ReactiveMongoApi

import javax.inject.Inject
import scala.concurrent.ExecutionContext

class OrganisationTimeBookingsController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val reactiveMongoApi: ReactiveMongoApi,
    override val jwkProviderCache: SyncCacheApi)(implicit ec: ExecutionContext)
    extends BaseLasiusController() {

  implicit val timeout: Timeout = systemServices.timeout

  def getOrganisationTimeBooking(orgId: OrganisationId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      _ => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { _ =>
          (systemServices.currentOrganisationTimeBookingsView ? GetCurrentOrganisationTimeBookings(
            orgId)).map {
            case b: CurrentOrganisationTimeBookings =>
              logger.debug(s"getOrganisationTimeBooking:$b")
              Ok(Json.toJson(b))
            case NoResultFound =>
              logger.debug(s"getOrganisationTimeBooking: NoResultFound")
              Ok(Json.toJson(CurrentOrganisationTimeBookings(orgId, Seq())))
            case x =>
              logger.debug(s"getOrganisationTimeBooking:$orgId => $x")
              BadRequest
          }
        }
    }
}
