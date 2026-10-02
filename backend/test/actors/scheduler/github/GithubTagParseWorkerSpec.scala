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

package actors.scheduler.github

import actors.scheduler.StubPages
import org.joda.time.DateTime
import org.specs2.mutable.Specification

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}

class GithubTagParseWorkerSpec extends Specification {

  implicit val executionContext: ExecutionContext = ExecutionContext.global

  private val author =
    GithubUser("author", 1L, None, "https://github.com/author")

  private def issue(number: Int): GithubIssue =
    GithubIssue(
      id = number.toLong,
      number = number,
      state = "open",
      title = s"Issue $number",
      body = None,
      user = author,
      labels = Seq.empty,
      assignees = Seq.empty,
      milestone = None,
      created_at = new DateTime(0L),
      updated_at = new DateTime(0L),
      closed_at = None,
      html_url = s"https://github.com/tegonal/lasius/issues/$number",
      repository_url = "https://api.github.com/repos/tegonal/lasius"
    )

  private def page(numbers: Int*): GithubIssuesSearchResult =
    GithubIssuesSearchResult(issues = numbers.map(issue),
                             totalNumberOfItems = None,
                             page = None,
                             perPage = None)

  private def loadAll(github: StubPages[GithubIssuesSearchResult]): Set[Int] =
    Await
      .result(
        GithubTagParseWorker.loadAllPages(maxResults = 2)(github.loadPage),
        5.seconds)
      .map(_.number)

  "GithubTagParseWorker.loadAllPages" should {
    "load pages until a page holds fewer issues than requested" in {
      val github = new StubPages({
        case 1 => page(1, 2)
        case 2 => page(3, 4)
        case 3 => page(5)
      })

      loadAll(github) must equalTo(Set(1, 2, 3, 4, 5))
      github.requests must equalTo(Seq(1, 2, 3))
    }

    "end the load when the server ignores the page" in {
      val github = new StubPages(_ => page(1, 2))

      loadAll(github) must equalTo(Set(1, 2))
      github.requests must equalTo(Seq(1, 2))
    }
  }
}
