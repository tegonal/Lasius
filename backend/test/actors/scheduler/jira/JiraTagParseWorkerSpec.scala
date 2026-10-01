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

package actors.scheduler.jira

import org.specs2.mutable.Specification

import java.net.URI
import scala.collection.mutable
import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext, Future}

class JiraTagParseWorkerSpec extends Specification {

  implicit val executionContext: ExecutionContext = ExecutionContext.global

  private def issue(number: Int): JiraIssue =
    JiraIssue(id = number.toString,
              self = URI.create(
                s"https://jira.example.com/rest/api/2/issue/$number"),
              key = s"LAS-$number")

  private def page(startAt: Int,
                   total: Int,
                   numbers: Seq[Int]): JiraSearchResult =
    JiraSearchResult(startAt = startAt,
                     maxResults = 2,
                     total = total,
                     issues = numbers.map(issue))

  /** Records each requested `startAt`. A stub that answers more than 10
    * requests fails, so a load without end stops the example.
    */
  private class StubJira(answer: Int => JiraSearchResult) {
    val requests: mutable.Buffer[Int] = mutable.Buffer.empty

    def loadPage(startAt: Int): Future[JiraSearchResult] = {
      requests += startAt
      if (requests.size > 10)
        Future.failed(new IllegalStateException("The load does not end"))
      else Future.successful(answer(startAt))
    }
  }

  private def loadAll(jira: StubJira): Set[String] =
    Await
      .result(JiraTagParseWorker.loadAllPages(jira.loadPage), 5.seconds)
      .map(_.key)

  "JiraTagParseWorker.loadAllPages" should {
    "load every page up to the total" in {
      val jira = new StubJira({
        case 0 => page(startAt = 0, total = 5, Seq(1, 2))
        case 2 => page(startAt = 2, total = 5, Seq(3, 4))
        case 4 => page(startAt = 4, total = 5, Seq(5))
      })

      loadAll(jira) must equalTo((1 to 5).map(n => s"LAS-$n").toSet)
      jira.requests must equalTo(Seq(0, 2, 4))
    }

    "end the load at an empty page" in {
      val jira = new StubJira({
        case 0 => page(startAt = 0, total = 10, Seq(1, 2))
        case 2 => page(startAt = 2, total = 10, Seq())
      })

      loadAll(jira) must equalTo(Set("LAS-1", "LAS-2"))
      jira.requests must equalTo(Seq(0, 2))
    }

    "end the load when the server ignores startAt" in {
      val jira = new StubJira(_ => page(startAt = 0, total = 6, Seq(1, 2)))

      loadAll(jira) must equalTo(Set("LAS-1", "LAS-2"))
      jira.requests must equalTo(Seq(0, 2))
    }
  }
}
