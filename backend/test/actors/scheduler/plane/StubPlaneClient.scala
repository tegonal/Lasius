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

import org.mockito.ArgumentMatchers.{any, anyString}
import org.mockito.Mockito.{mock, when}
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import play.api.libs.json._
import play.api.libs.ws.{WSClient, WSRequest, WSResponse}

import scala.collection.mutable
import scala.concurrent.Future

/** An issue tracker server for tests: it answers each request with
  * `respond(url)` and records the requested URLs. `linkHeader(url)` sets the
  * Link header, which GitLab and GitHub use for paging.
  */
object StubPlaneClient {

  def apply(respond: String => (Int, JsValue),
            linkHeader: String => Option[String] = _ => None)
      : (WSClient, mutable.Buffer[String]) = {
    val requested = mutable.Buffer[String]()
    val client    = mock(classOf[WSClient])
    when(client.url(anyString)).thenAnswer(new Answer[WSRequest] {
      override def answer(invocation: InvocationOnMock): WSRequest = {
        val url = invocation.getArgument[String](0)
        requested.synchronized(requested += url)
        val (status, json) = respond(url)
        val response       = mock(classOf[WSResponse])
        when(response.status).thenReturn(status)
        when(response.statusText)
          .thenReturn(if (status == 404) "Not Found" else "OK")
        when(response.json).thenReturn(json)
        when(response.headers)
          .thenReturn(Map.empty[String, scala.collection.Seq[String]])
        when(response.header("Link")).thenReturn(linkHeader(url))
        val request = mock(classOf[WSRequest])
        when(request.addHttpHeaders(any[(String, String)]()))
          .thenReturn(request)
        when(request.withRequestTimeout(any())).thenReturn(request)
        when(request.get()).thenReturn(Future.successful(response))
        request
      }
    })
    (client, requested)
  }

  /** One page of a cursor-paginated Plane list, in the shape of Plane 3.x. */
  def page(results: Seq[JsObject],
           nextCursor: String,
           hasNext: Boolean,
           total: Int,
           totalPages: Int): JsObject = Json.obj(
    "grouped_by"        -> JsNull,
    "next_cursor"       -> nextCursor,
    "prev_cursor"       -> "",
    "next_page_results" -> hasNext,
    "prev_page_results" -> false,
    "count"             -> results.size,
    "total_pages"       -> totalPages,
    "total_results"     -> total,
    "extra_stats"       -> Json.obj(),
    "results"           -> JsArray(results)
  )
}
