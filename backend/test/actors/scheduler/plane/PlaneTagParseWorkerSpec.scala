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

import org.specs2.mutable.Specification
import play.api.libs.json.{JsString, Json}

class PlaneTagParseWorkerSpec extends Specification {

  private val bug       = PlaneLabel("label-bug", "bug")
  private val feature   = PlaneLabel("label-feature", "feature")
  private val project   = PlaneProject("p1", "LAS")
  private val todoState = Json.obj("id" -> "state-todo", "name" -> "Todo")

  private val issue = PlaneIssue(id = "i1",
                                 name = "Issue",
                                 sequence_id = 1,
                                 project = project,
                                 labels = Some(Seq(bug)),
                                 state = Some(todoState))

  "PlaneTagParseWorker.matchesFilters" should {
    "accept every issue when no filter is set" in {
      PlaneTagParseWorker.matchesFilters(issue, Set.empty, Set.empty) must beTrue
    }

    "accept an issue with one of the label ids and reject one without" in {
      PlaneTagParseWorker.matchesFilters(issue, Set(bug.id), Set.empty) must beTrue
      PlaneTagParseWorker.matchesFilters(issue,
                                         Set(feature.id),
                                         Set.empty) must beFalse
      PlaneTagParseWorker.matchesFilters(issue.copy(labels = None),
                                         Set(bug.id),
                                         Set.empty) must beFalse
    }

    "read the state id from an expanded object and from a plain id" in {
      PlaneTagParseWorker.matchesFilters(issue,
                                         Set.empty,
                                         Set("state-todo")) must beTrue
      PlaneTagParseWorker.matchesFilters(
        issue.copy(state = Some(JsString("state-todo"))),
        Set.empty,
        Set("state-todo")) must beTrue
      PlaneTagParseWorker.matchesFilters(issue,
                                         Set.empty,
                                         Set("state-done")) must beFalse
    }
  }
}
