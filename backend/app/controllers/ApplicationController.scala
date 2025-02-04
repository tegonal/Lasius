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

import core.SystemServices
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.stream.Materializer
import org.apache.pekko.util.Timeout
import play.api.libs.json._
import play.api.mvc._
import play.modules.reactivemongo.ReactiveMongoApi

import javax.inject.Inject
import scala.concurrent.Future
import com.typesafe.config.Config
import models.CsrfToken
import play.filters.csrf.CSRF

class ApplicationController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val authConfig: AuthConfig,
    override val systemServices: SystemServices)(implicit
    override val reactiveMongoApi: ReactiveMongoApi)
    extends BaseLasiusController() {

  implicit val timeout: Timeout = systemServices.timeout

  implicit val system: ActorSystem        = systemServices.system
  implicit val materializer: Materializer = Materializer.matFromSystem

  systemServices.initialize()

  /** Load application config
    */
  def getConfig: Action[AnyContent] = Action.async {
    Future.successful(Ok(Json.toJson(systemServices.appConfig)))
  }

  def getCsrfToken: Action[AnyContent] = Action.async { implicit request =>
    Future.successful(CSRF.getToken.fold(NotFound(""))(token =>
      Ok(Json.toJson(CsrfToken(token.value)))))
  }
}
