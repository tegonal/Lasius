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

package actors.scheduler.gitlab

import actors.scheduler.StubPages
import org.joda.time.DateTime
import org.specs2.mutable.Specification

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}

class GitlabTagParseWorkerSpec extends Specification {

  implicit val executionContext: ExecutionContext = ExecutionContext.global

  private val author = GitlabUser(state = "active",
                                  web_url = None,
                                  avatar_url = None,
                                  username = "author",
                                  id = 1,
                                  name = "Author")

  private def issue(iid: Int): GitlabIssue =
    GitlabIssue(
      project_id = 7,
      milestone = None,
      author = author,
      description = None,
      state = "opened",
      iid = iid,
      assignees = Seq.empty,
      assignee = None,
      labels = Seq.empty,
      id = 1000 + iid,
      title = s"Issue $iid",
      created_at = new DateTime(0L),
      updated_at = new DateTime(0L),
      closed_at = None,
      closed_by = None,
      due_date = None,
      web_url = s"https://gitlab.example.com/lasius/-/issues/$iid",
      references = None,
      time_stats = None,
      confidential = None,
      _links = None,
      task_completion_status = None
    )

  /** A page without the total headers, so only the next page ends the load. */
  private def page(nextPage: Option[Int],
                   iids: Int*): GitlabIssuesSearchResult =
    GitlabIssuesSearchResult(issues = iids.map(issue),
                             totalNumberOfItems = None,
                             totalPages = None,
                             perPage = Some(2),
                             page = None,
                             nextPage = nextPage,
                             prevPage = None)

  private def loadAll(gitlab: StubPages[GitlabIssuesSearchResult]): Set[Int] =
    Await
      .result(GitlabTagParseWorker.loadAllPages(gitlab.loadPage), 5.seconds)
      .map(_.iid)

  "GitlabTagParseWorker.loadAllPages" should {
    "follow the next page until GitLab reports none" in {
      val gitlab = new StubPages({
        case 0 => page(Some(2), 1, 2)
        case 2 => page(Some(3), 3, 4)
        case 3 => page(None, 5)
      })

      loadAll(gitlab) must equalTo(Set(1, 2, 3, 4, 5))
      gitlab.requests must equalTo(Seq(0, 2, 3))
    }

    "end the load when the next page does not move forward" in {
      val gitlab = new StubPages(_ => page(Some(2), 1, 2))

      loadAll(gitlab) must equalTo(Set(1, 2))
      gitlab.requests must equalTo(Seq(0, 2))
    }
  }
}
