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

// The models only read Plane answers, and they hold only the fields that the tag
// import uses. Plane changes the type of other fields between versions, and one
// such field made a whole page unreadable (estimate_point, number to string).

/** An item of a Plane answer, identified by its UUID. */
sealed trait PlaneEntity {
  def id: String
}

final case class PlaneLabel(id: String, name: String) extends PlaneEntity

final case class PlaneState(id: String, name: String) extends PlaneEntity

final case class PlaneProject(id: String, identifier: String)

final case class PlaneIssue(
    id: String,
    name: String,
    sequence_id: Int,
    project: PlaneProject,
    labels: Option[Seq[PlaneLabel]],
    state: Option[JsValue]
) extends PlaneEntity {

  /** With expand=state Plane returns the state as an object, otherwise as its
    * id.
    */
  def stateId: Option[String] = state.flatMap {
    case JsString(id)          => Some(id)
    case stateObject: JsObject => (stateObject \ "id").asOpt[String]
    case _                     => None
  }
}

/** One page of a cursor-paginated Plane list. */
sealed trait PaginatedQueryResult[T <: PlaneEntity] {
  def next_cursor: String
  def next_page_results: Boolean
  def total_pages: Int
  def total_results: Int
  def results: Seq[T]
}

final case class PlaneIssuesQueryResult(next_cursor: String,
                                        next_page_results: Boolean,
                                        total_pages: Int,
                                        total_results: Int,
                                        results: Seq[PlaneIssue])
    extends PaginatedQueryResult[PlaneIssue]

final case class PlaneLabelsQueryResult(next_cursor: String,
                                        next_page_results: Boolean,
                                        total_pages: Int,
                                        total_results: Int,
                                        results: Seq[PlaneLabel])
    extends PaginatedQueryResult[PlaneLabel]

final case class PlaneStatesQueryResult(next_cursor: String,
                                        next_page_results: Boolean,
                                        total_pages: Int,
                                        total_results: Int,
                                        results: Seq[PlaneState])
    extends PaginatedQueryResult[PlaneState]

object PlaneLabel {
  implicit val reads: Reads[PlaneLabel] = Json.reads[PlaneLabel]
}

object PlaneState {
  implicit val reads: Reads[PlaneState] = Json.reads[PlaneState]
}

object PlaneProject {
  implicit val reads: Reads[PlaneProject] = Json.reads[PlaneProject]
}

object PlaneIssue {
  implicit val reads: Reads[PlaneIssue] = Json.reads[PlaneIssue]
}

object PlaneIssuesQueryResult {
  implicit val reads: Reads[PlaneIssuesQueryResult] =
    Json.reads[PlaneIssuesQueryResult]
}

object PlaneLabelsQueryResult {
  implicit val reads: Reads[PlaneLabelsQueryResult] =
    Json.reads[PlaneLabelsQueryResult]
}

object PlaneStatesQueryResult {
  implicit val reads: Reads[PlaneStatesQueryResult] =
    Json.reads[PlaneStatesQueryResult]
}
