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

import actors.scheduler.plane.PlaneTagParseWorker.{
  filtersAdmitNoIssue,
  matchesFilters
}
import org.specs2.mutable.Specification
import play.api.libs.json.{JsString, Json}

class PlaneTagParseWorkerSpec extends Specification {

  private val bug     = PlaneLabel("label-bug", "bug")
  private val feature = PlaneLabel("label-feature", "feature")

  private val issue = PlaneIssue(
    id = "i1",
    name = "Issue",
    sequence_id = 1,
    project = PlaneProject("p1", "LAS"),
    labels = Some(Seq(bug)),
    state = Some(Json.obj("id" -> "state-todo", "name" -> "Todo")))

  "PlaneTagParseWorker.matchesFilters" should {
    "accept every issue when no filter is configured" in {
      matchesFilters(issue, None, None) must beTrue
    }

    "accept an issue with one of the label ids and reject one without" in {
      matchesFilters(issue, Some(Set(bug.id)), None) must beTrue
      matchesFilters(issue, Some(Set(feature.id)), None) must beFalse
      matchesFilters(issue.copy(labels = None), Some(Set(bug.id)), None) must
        beFalse
    }

    "reject every issue when a configured filter resolves to no id" in {
      matchesFilters(issue, Some(Set.empty), None) must beFalse
      matchesFilters(issue, None, Some(Set.empty)) must beFalse
    }

    "read the state id from an expanded object and from a plain id" in {
      matchesFilters(issue, None, Some(Set("state-todo"))) must beTrue
      matchesFilters(issue.copy(state = Some(JsString("state-todo"))),
                     None,
                     Some(Set("state-todo"))) must beTrue
      matchesFilters(issue, None, Some(Set("state-done"))) must beFalse
    }
  }

  "PlaneTagParseWorker.filtersAdmitNoIssue" should {
    "be true only when a configured filter resolves to no id" in {
      filtersAdmitNoIssue(Some(Set.empty), None) must beTrue
      filtersAdmitNoIssue(None, Some(Set.empty)) must beTrue
      filtersAdmitNoIssue(None, None) must beFalse
      filtersAdmitNoIssue(Some(Set(bug.id)), Some(Set("state-todo"))) must
        beFalse
    }
  }
}
