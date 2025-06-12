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

package controllers.integrations

import com.typesafe.config.Config
import controllers.{AuthConfig, BaseLasiusController}
import core.SystemServices
import models._
import play.api.mvc.{Action, ControllerComponents}
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{GitlabConfigRepository, JiraConfigRepository, PlaneConfigRepository}

import javax.inject.Inject
import scala.concurrent.ExecutionContext

class PlaneConfigController @Inject()(
                                       override val conf: Config,
                                       override val controllerComponents: ControllerComponents,
                                       override val systemServices: SystemServices,
                                       override val authConfig: AuthConfig,
                                       override val reactiveMongoApi: ReactiveMongoApi,
                                       gitlabConfigRepository: GitlabConfigRepository,
                                       jiraConfigRepository: JiraConfigRepository,
                                       planeConfigRepository: PlaneConfigRepository)(implicit ec: ExecutionContext)
  extends BaseLasiusController() {
  def start(orgId: OrganisationId): Action[StartBookingRequest] =
    HasUserRole(FreeUser,
      validateJson[StartBookingRequest],
      withinTransaction = false) {
      _ =>
        implicit subject =>
          user =>
            implicit request =>
              HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
                HasProjectRole(userOrg, request.body.projectId, ProjectMember) {
                  userProject =>
                    val startBooking = request.body
                    logger.debug(
                      s"TimeBokingController -> start - userId:${subject.userReference.id}, projectId: ${startBooking.projectId.value}, tags:${startBooking.tags}, start:${startBooking.start}")

                    systemServices.timeBookingViewService ! startBooking.toCommand(
                      userOrg.organisationReference,
                      userProject.projectReference)
                    success()
                }
              }
    }

}
