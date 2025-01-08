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

package actors.scheduler.plane

import play.api.libs.json._

import java.util.Date
import scala.annotation.unused

sealed trait PaginatedQueryResult[T] {
  val grouped_by: Option[String]
  val sub_grouped_by: Option[String]
  val next_cursor: String
  val prev_cursor: String
  val next_page_results: Boolean
  val prev_page_results: Boolean
  val count: Int
  val total_pages: Int
  val total_results: Int
  val extra_stats: Option[String]
  val results: Seq[T]
}

case class PlaneIssuesQueryResult(
    grouped_by: Option[String],
    sub_grouped_by: Option[String],
    next_cursor: String,
    prev_cursor: String,
    next_page_results: Boolean,
    prev_page_results: Boolean,
    count: Int,
    total_pages: Int,
    total_results: Int,
    extra_stats: Option[String],
    results: Seq[PlaneIssue],
) extends PaginatedQueryResult[PlaneIssue]

case class PlaneLabelsQueryResult(
    grouped_by: Option[String],
    sub_grouped_by: Option[String],
    next_cursor: String,
    prev_cursor: String,
    next_page_results: Boolean,
    prev_page_results: Boolean,
    count: Int,
    total_pages: Int,
    total_results: Int,
    extra_stats: Option[String],
    results: Seq[PlaneLabel],
) extends PaginatedQueryResult[PlaneLabel]

case class PlaneStatesQueryResult(
    grouped_by: Option[String],
    sub_grouped_by: Option[String],
    next_cursor: String,
    prev_cursor: String,
    next_page_results: Boolean,
    prev_page_results: Boolean,
    count: Int,
    total_pages: Int,
    total_results: Int,
    extra_stats: Option[String],
    results: Seq[PlaneState],
) extends PaginatedQueryResult[PlaneState]

case class PlaneLabel(
    id: String,
    // created_at: DateTime, // Nanosecond format not parsable by joda time "2024-08-27T14:33:01.364694+02:00"
    // updated_at: DateTime,
    name: String,
    description: String,
    color: String,
    sort_order: Double,
    created_by: String,
    updated_by: String,
    project: String,
    workspace: String,
    parent: Option[String]
)

case class PlaneState(
    id: String,
    name: String,
    color: String,
    group: String
)

case class PlaneProject(
    id: String,
    identifier: String,
    name: String,
    cover_image: String,
    // icon_prop: IconProp,
    emoji: Option[String],
    description: String
)

case class PlaneIssue(
    id: String,
    // created_at: DateTime,
    // updated_at: DateTime,
    estimate_point: Option[Int],
    name: String,
    description_html: Option[String],
    description_stripped: Option[String],
    priority: Option[String],
    start_date: Option[Date],
    target_date: Option[Date],
    sequence_id: Int,
    sort_order: Double,
    // completed_at: Option[DateTime],
    // archived_at: Option[DateTime],
    // is_draft: Boolean, // currently not available on Plane UI
    created_by: String,
    updated_by: Option[String],
    project: PlaneProject,
    workspace: String,
    parent: Option[String],
    state: Option[PlaneState],
    assignees: Seq[String],
    labels: Option[Seq[PlaneLabel]],
)

object PlaneIssuesQueryResult {
  implicit val jsonFormat: Format[PlaneIssuesQueryResult] =
    Json.format[PlaneIssuesQueryResult]
}

object PlaneLabelsQueryResult {
  implicit val jsonFormat: Format[PlaneLabelsQueryResult] =
    Json.format[PlaneLabelsQueryResult]
}

object PlaneStatesQueryResult {
  implicit val jsonFormat: Format[PlaneStatesQueryResult] =
    Json.format[PlaneStatesQueryResult]
}

object PlaneLabel {
  implicit val jsonFormat: Format[PlaneLabel] = Json.format[PlaneLabel]
}

object PlaneState {
  implicit val jsonFormat: Format[PlaneState] = Json.format[PlaneState]
}

@unused("Used to build json format of PlaneIssue")
object PlaneProject {
  implicit val jsonFormat: Format[PlaneProject] = Json.format[PlaneProject]
}

object PlaneIssue {
  implicit val jsonFormat: Format[PlaneIssue] = Json.format[PlaneIssue]
}
