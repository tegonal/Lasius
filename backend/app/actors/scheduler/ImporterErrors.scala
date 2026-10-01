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

package actors.scheduler

import models.ConnectivityIssue
import org.joda.time.DateTime

/** Maps the failure of an importer sync to the error code and the HTTP status
  * that the sync status shows.
  */
object ImporterErrors {

  /** The message is never null. A stored null makes the config document
    * unreadable, and the importers of that type then fail to start.
    */
  def connectivityIssue(ex: Throwable): ConnectivityIssue = {
    val (errorCode, httpStatus) = classify(ex)
    ConnectivityIssue(
      errorCode = errorCode,
      message = Option(ex.getMessage).getOrElse(ex.getClass.getSimpleName),
      timestamp = DateTime.now,
      httpStatus = httpStatus
    )
  }

  def classify(ex: Throwable): (String, Option[Int]) = ex match {
    case e: HttpStatusException =>
      e.status match {
        case 401    => ("authentication_failed", Some(401))
        case 403    => ("permission_denied", Some(403))
        case 404    => ("resource_not_found", Some(404))
        case status => ("unknown_error", Some(status))
      }
    case _: ApiParseException => ("parse_error", None)
    case _                    =>
      Option(ex.getMessage).getOrElse("") match {
        case msg if msg.contains("401") || msg.contains("Unauthorized") =>
          ("authentication_failed", Some(401))
        case msg if msg.contains("403") || msg.contains("Forbidden") =>
          ("permission_denied", Some(403))
        case msg if msg.contains("404") || msg.contains("Not Found") =>
          ("resource_not_found", Some(404))
        case msg if msg.contains("timeout") || msg.contains("timed out") =>
          ("timeout", None)
        case msg
            if msg.contains("Connection refused") || msg.contains(
              "ConnectException") =>
          ("connection_refused", None)
        case _ => ("unknown_error", None)
      }
  }
}
