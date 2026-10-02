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

import actors.IssueImporterStatusMonitor.UpdateProjectSyncStats
import actors.TagCache.TagsUpdated
import actors.scheduler.plane.PlaneTagParseWorker.{
  filtersAdmitNoIssue,
  matchesFilters
}
import actors.scheduler.{ApiKeyAuthentication, ServiceConfiguration}
import core.SystemServices
import models._
import org.apache.pekko.testkit.TestProbe
import org.mockito.ArgumentMatchers.{any, anyString}
import org.mockito.Mockito.when
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.specs2.mock.Mockito
import org.specs2.mutable.Specification
import pekko.ActorTestScope
import play.api.libs.json.{JsObject, JsString, JsValue, Json}
import play.api.libs.ws.{WSClient, WSRequest, WSResponse}

import java.net.URI
import scala.collection.mutable
import scala.concurrent.Future
import scala.concurrent.duration._

class PlaneTagParseWorkerSpec extends Specification with Mockito {

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

  private def singlePage(results: JsValue*): JsObject = Json.obj(
    "next_cursor"       -> "",
    "next_page_results" -> false,
    "total_pages"       -> 1,
    "total_results"     -> results.size,
    "results"           -> results
  )

  private val issuePage = singlePage(
    Json.obj(
      "id"          -> "i1",
      "name"        -> "Issue",
      "sequence_id" -> 1,
      "project"     -> Json.obj("id" -> "p1", "identifier" -> "LAS"),
      "labels"      -> Json.arr(Json.obj("id" -> bug.id, "name" -> bug.name))
    ))

  /** A WSClient that answers the labels and work-items requests of project p1
    * and records each URL.
    */
  private def stubClient(): (WSClient, mutable.Buffer[String]) = {
    val requested = mutable.Buffer[String]()
    val client    = mock[WSClient]
    when(client.url(anyString)).thenAnswer(new Answer[WSRequest] {
      override def answer(invocation: InvocationOnMock): WSRequest = {
        val url = invocation.getArgument[String](0)
        requested.synchronized(requested += url)
        val json =
          if (url.contains("/labels/"))
            singlePage(Json.obj("id" -> bug.id, "name" -> bug.name))
          else issuePage
        val response = mock[WSResponse]
        when(response.status).thenReturn(200)
        when(response.statusText).thenReturn("OK")
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

  /** Runs the first parse of a worker with the label filter and returns the
    * published tags and the requested URLs.
    */
  private def firstParse(includeOnlyIssuesWithLabels: Set[String])(implicit
      scope: ActorTestScope): (Set[PlaneIssueTag], Seq[String]) = {
    val tagCache          = TestProbe()(scope.system)
    val monitor           = TestProbe()(scope.system)
    val services          = mock[SystemServices]
    val (client, request) = stubClient()
    services.tagCache.returns(tagCache.ref)
    services.issueImporterStatusMonitor.returns(monitor.ref)

    scope.system.actorOf(
      PlaneTagParseWorker.props(
        client,
        services,
        ServiceConfiguration("https://plane.test"),
        URI.create("https://plane.test").toURL,
        PlaneSettings(checkFrequency = 3600000L, workspace = "ws"),
        PlaneProjectSettings(
          planeProjectId = "p1",
          tagConfiguration = PlaneTagConfiguration(
            useLabels = false,
            labelFilter = Set.empty,
            includeOnlyIssuesWithLabels = includeOnlyIssuesWithLabels)
        ),
        ApiKeyAuthentication("key"),
        IssueImporterConfigId(),
        OrganisationId(),
        ProjectId()
      ))

    val tags = tagCache.expectMsgType[TagsUpdated[PlaneIssueTag]](5.seconds)
    monitor.expectMsgType[UpdateProjectSyncStats](5.seconds)
    (tags.tags.toSet, request.synchronized(request.toSeq))
  }

  "PlaneTagParseWorker.loadTags" should {
    "load no issue when the label filter names no label of the project" in new ActorTestScope {
      private val (tags, urls) = firstParse(Set("missing"))(this)

      tags must beEmpty
      urls.exists(_.contains("/labels/")) must beTrue
      urls.filterNot(_.contains("/labels/")) must beEmpty
    }

    "load the issues when the label filter names a label of the project" in new ActorTestScope {
      private val (tags, urls) = firstParse(Set(bug.name))(this)

      tags.map(_.id) must equalTo(Set(TagId("LAS-1")))
      urls.exists(_.contains("/work-items/")) must beTrue
    }
  }
}
