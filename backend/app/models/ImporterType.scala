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

package models

import play.api.libs.json._

sealed trait ImporterType {
  def value: String
}

object ImporterType {
  case object Gitlab extends ImporterType {
    val value = "gitlab"
  }
  case object Jira extends ImporterType {
    val value = "jira"
  }
  case object Plane extends ImporterType {
    val value = "plane"
  }
  case object Github extends ImporterType {
    val value = "github"
  }

  val all: Set[ImporterType] = Set(Gitlab, Jira, Plane, Github)

  def fromString(s: String): Option[ImporterType] = s.toLowerCase match {
    case "gitlab" => Some(Gitlab)
    case "jira"   => Some(Jira)
    case "plane"  => Some(Plane)
    case "github" => Some(Github)
    case _        => None
  }

  implicit val format: Format[ImporterType] = new Format[ImporterType] {
    def reads(json: JsValue): JsResult[ImporterType] = json match {
      case JsString(value) =>
        fromString(value)
          .map(JsSuccess(_))
          .getOrElse(JsError(
            s"Invalid importer type: $value. Must be one of: gitlab, jira, plane, github"))
      case _ => JsError("Expected string value for ImporterType")
    }

    def writes(t: ImporterType): JsValue = JsString(t.value)
  }
}
