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
  ServiceAuthentication,
  ServiceConfiguration
}
import org.mockito.ArgumentMatchers.{any, anyString}
import org.mockito.Mockito.when
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.specs2.mock.Mockito
import org.specs2.mutable.Specification
import play.api.libs.json._
import play.api.libs.ws.{WSClient, WSRequest, WSResponse}

import scala.collection.mutable
import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext, Future}

class PlaneApiServiceSpec extends Specification with Mockito {

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
                   totalPages: Int): JsObject = Json.obj(
    "grouped_by"        -> JsNull,
    "next_cursor"       -> nextCursor,
    "prev_cursor"       -> "",
    "next_page_results" -> hasNext,
    "prev_page_results" -> false,
    "count"             -> ids.size,
    "total_pages"       -> totalPages,
    "total_results"     -> total,
    "extra_stats"       -> Json.obj(),
    "results"           -> JsArray(ids.map(issue))
  )

  /** A WSClient that answers each request with `respond(url)` and records the
    * URLs.
    */
  private def stubClient(
      respond: String => (Int, JsValue)): (WSClient, mutable.Buffer[String]) = {
    val requested = mutable.Buffer[String]()
    val client    = mock[WSClient]
    when(client.url(anyString)).thenAnswer(new Answer[WSRequest] {
      override def answer(invocation: InvocationOnMock): WSRequest = {
        val url = invocation.getArgument[String](0)
        requested.synchronized(requested += url)
        val (status, json) = respond(url)
        val response       = mock[WSResponse]
        when(response.status).thenReturn(status)
        when(response.statusText)
          .thenReturn(if (status == 404) "Not Found" else "OK")
        when(response.json).thenReturn(json)
        when(response.headers)
          .thenReturn(Map.empty[String, scala.collection.Seq[String]])
        val request = mock[WSRequest]
        when(request.addHttpHeaders(any[(String, String)]()))
          .thenReturn(request)
        when(request.get()).thenReturn(Future.successful(response))
        request
      }
    })
    (client, requested)
  }

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
      val (client, requested) = stubClient { url =>
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
      val (client, requested) = stubClient { _ =>
        (200, page(1 to 100, "100:1:0", hasNext = true, 290, 3))
      }

      val issues = findIssues(client)

      issues must haveSize(100)
      issues.map(_.id).distinct must haveSize(100)
      requested must haveSize(2)
    }

    "fall back to /issues/ when the work-items endpoint answers 404" in {
      val (client, requested) = stubClient { url =>
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
}
