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
import core.SystemServices
import models._
import play.api.libs.json.Json
import play.api.mvc._
import play.modules.reactivemongo.ReactiveMongoApi

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}

class AuthController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig)(implicit
    override val reactiveMongoApi: ReactiveMongoApi,
    ec: ExecutionContext)
    extends BaseLasiusController() {

  def createWsTicket(): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      _ => _ => user => _ =>
        val ref = user.getReference
        val ticket = systemServices.createWsTicket(ref.id, ref)
        Future.successful(Ok(Json.obj("ticket" -> ticket)))
    }
}
