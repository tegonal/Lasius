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

package core

import com.typesafe.config.ConfigFactory
import com.typesafe.config.Config
import org.apache.pekko.actor.ActorSystem
import play.api.{ApplicationLoader, Logger}
import play.api.i18n.Lang
import play.api.inject.bind
import play.api.inject.guice.{GuiceApplicationLoader, GuiceableModule}
import play.api.mvc.{RequestHeader, Result}
import play.api.mvc.Results._

import scala.annotation.unused
import scala.concurrent.Future

class CustomApplicationLoader extends GuiceApplicationLoader with ConfigAware {
  lazy val logger: Logger = Logger(getClass.getName)
  lazy val conf: Config   = ConfigFactory.load()

  protected override def overrides(
      context: ApplicationLoader.Context): Seq[GuiceableModule] = {
    super.overrides(context) :+ (bind[ActorSystem]
      .toProvider[PlayAwareActorSystemProvider]: GuiceableModule)
  }

  @unused
  def onError(request: RequestHeader, ex: Throwable): Future[Result] = {
    Future.successful(
      InternalServerError(views.html.errorPage(ex)(Lang.defaultLang)))
  }
}
