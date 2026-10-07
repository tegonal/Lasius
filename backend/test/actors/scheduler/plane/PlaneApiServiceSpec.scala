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

import actors.scheduler.{
  ApiKeyAuthentication,
  HttpStatusException,
  ServiceAuthentication,
  ServiceConfiguration
}
import org.specs2.mutable.Specification
import play.api.libs.json._
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}

class PlaneApiServiceSpec extends Specification {

  implicit val executionContext: ExecutionContext = ExecutionContext.global
  implicit val auth: ServiceAuthentication        = ApiKeyAuthentication("key")

  private def issue(i: Int): JsObject = Json.obj(
    "id"               -> s"issue-$i",
    "name"             -> s"Issue $i",
    "sequence_id"      -> i,
    "estimate_point"   -> "8b7a3c4e-0000-4000-8000-000000000001",
    "description_html" -> JsNull,
    "project"          -> Json.obj("id" -> "p1",
                          "identifier"  -> "LAS",
                          "cover_image" -> JsNull),
    "labels" -> Json.arr(
      Json.obj("id" -> "l1", "name" -> "bug", "description" -> JsNull)),
    "state" -> Json.obj("id" -> "s1", "name" -> "Todo")
  )

  private def page(ids: Seq[Int],
                   nextCursor: String,
                   hasNext: Boolean,
                   total: Int,
                   totalPages: Int): JsObject =
    StubPlaneClient.page(ids.map(issue), nextCursor, hasNext, total, totalPages)

  private def findIssues(client: WSClient): Seq[PlaneIssue] =
    Await.result(
      new PlaneApiServiceImpl(client,
                              ServiceConfiguration("https://plane.test"))
        .findIssues("ws",
                    "p1",
                    "expand=labels,state,project",
                    100,
                    Set.empty,
                    Set.empty),
      5.seconds
    )

  "The Plane models" should {
    "read a page with a string estimate_point and an object extra_stats" in {
      val parsed = Json.fromJson[PlaneIssuesQueryResult](
        page(1 to 3, "100:1:0", hasNext = false, total = 3, totalPages = 1))
      parsed.isSuccess must beTrue
      parsed.get.results.map(_.project.identifier) must contain(allOf("LAS"))
    }
  }

  "PlaneApiServiceImpl.findIssues" should {
    "fetch every page by the next_cursor of the previous answer" in {
      val (client, requested) = StubPlaneClient { url =>
        if (url.contains("cursor=100%3A0%3A0"))
          (200, page(1 to 100, "100:1:0", hasNext = true, 150, 2))
        else if (url.contains("cursor=100%3A1%3A0"))
          (200, page(101 to 150, "100:2:0", hasNext = false, 150, 2))
        else (500, JsNull)
      }

      val issues = findIssues(client)

      issues.map(_.id).distinct must haveSize(150)
      requested must haveSize(2)
      requested.forall(_.contains("/work-items/")) must beTrue
    }

    "stop and keep each issue once when Plane answers every page with the first" in {
      val (client, requested) = StubPlaneClient { _ =>
        (200, page(1 to 100, "100:1:0", hasNext = true, 290, 3))
      }

      val issues = findIssues(client)

      issues must haveSize(100)
      issues.map(_.id).distinct must haveSize(100)
      requested must haveSize(2)
    }

    "fall back to /issues/ when the work-items endpoint answers 404" in {
      val (client, requested) = StubPlaneClient { url =>
        if (url.contains("/work-items/")) (404, JsNull)
        else (200, page(1 to 5, "100:1:0", hasNext = false, 5, 1))
      }
      val service =
        new PlaneApiServiceImpl(client,
                                ServiceConfiguration("https://plane.test"))

      def run() = Await.result(service.findIssues("ws",
                                                  "p1",
                                                  "expand=labels,state,project",
                                                  100,
                                                  Set.empty,
                                                  Set.empty),
                               5.seconds)

      run() must haveSize(5)
      run() must haveSize(5)
      requested.count(_.contains("/work-items/")) must equalTo(1)
      requested.count(_.contains("/issues/")) must equalTo(2)
    }
  }

  "PlaneApiServiceImpl on a 429 answer" should {
    def service(client: WSClient) =
      new PlaneApiServiceImpl(client,
                              ServiceConfiguration("https://plane.test"),
                              rateLimitWait = (_, _) => 10.millis)

    def labelPage =
      StubPlaneClient.page(Seq(Json.obj("id" -> "l1", "name" -> "bug")),
                           "100:1:0",
                           hasNext = false,
                           total = 1,
                           totalPages = 1)

    "load the page again after the wait" in {
      var calls               = 0
      val (client, requested) = StubPlaneClient { _ =>
        calls += 1
        if (calls == 1) (429, JsNull) else (200, labelPage)
      }

      Await.result(service(client).getLabels(100, "ws", "p1"),
                   5.seconds) must equalTo(Set(PlaneLabel("l1", "bug")))
      requested must haveSize(2)
    }

    "fail after the last retry" in {
      val (client, requested) = StubPlaneClient(_ => (429, JsNull))

      Await.result(service(client).getLabels(100, "ws", "p1"),
                   5.seconds) must throwA[HttpStatusException]
      requested must haveSize(PlaneApiServiceImpl.MaxRateLimitRetries + 1)
    }
  }

  "PlaneApiServiceImpl.rateLimitWait" should {
    val now = 1700000000000L

    def waitFor(reset: String) =
      PlaneApiServiceImpl.rateLimitWait(Map("x-ratelimit-reset" -> Seq(reset)),
                                        now)

    "wait until the X-RateLimit-Reset time" in {
      waitFor("1700000005") must equalTo(5.seconds)
    }

    "wait at least one second for a reset time in the past" in {
      waitFor("1699999990") must equalTo(1.second)
    }

    "wait at most one quota window" in {
      waitFor("1700003600") must equalTo(60.seconds)
    }

    "wait one quota window without a readable reset header" in {
      waitFor("soon") must equalTo(60.seconds)
      PlaneApiServiceImpl.rateLimitWait(Map.empty, now) must equalTo(60.seconds)
    }
  }
}
