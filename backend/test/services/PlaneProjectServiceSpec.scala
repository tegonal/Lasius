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

package services

import actors.scheduler.plane.StubPlaneClient
import models._
import org.specs2.mutable.Specification
import play.api.libs.json._

import java.net.URI
import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext}

class PlaneProjectServiceSpec extends Specification {

  implicit val executionContext: ExecutionContext = ExecutionContext.global

  private val config = PlaneConfig(
    id = IssueImporterConfigId(),
    organisationReference = EntityReference(OrganisationId(), "org"),
    name = "Plane",
    baseUrl = URI.create("https://plane.test").toURL,
    auth = PlaneAuth("key"),
    settings = PlaneSettings(checkFrequency = 300000L, workspace = "ws"),
    projects = Seq.empty,
    audit = AuditInfo.initial(UserId())
  )

  private def named(prefix: String)(i: Int): JsObject =
    Json.obj("id" -> s"$prefix-$i", "name" -> f"$prefix $i%03d")

  /** Answers a list in pages of 100, as Plane 3.x does for per_page=100. */
  private def pagedList(prefix: String, total: Int, url: String): JsObject = {
    val page       = if (url.contains("cursor=100%3A1%3A0")) 1 else 0
    val totalPages = (total + 99) / 100
    val ids        = (page * 100 + 1) to math.min(total, (page + 1) * 100)
    StubPlaneClient.page(ids.map(named(prefix)),
                         s"100:${page + 1}:0",
                         page + 1 < totalPages,
                         total,
                         totalPages)
  }

  private def listProjects(respond: String => (Int, JsValue))
      : (Seq[ExternalProject], Seq[String]) = {
    val (client, requested) = StubPlaneClient(respond)
    val response            = Await.result(
      new PlaneProjectService(client).listProjects(config),
      5.seconds)
    (response.projects.getOrElse(Seq.empty), requested.toSeq)
  }

  private val projectId = "8b7a3c4e-0000-4000-8000-000000000001"

  private def metadata(externalProjectId: String)(
      respond: String => (Int, JsValue))
      : (ExternalProjectMetadata, Seq[String]) = {
    val (client, requested) = StubPlaneClient(respond)
    val result              = Await.result(
      new PlaneProjectService(client)
        .getProjectMetadata(config, externalProjectId),
      5.seconds)
    (result, requested.toSeq)
  }

  "PlaneProjectService.listProjects" should {
    "list every project beyond the first page, without labels or states" in {
      val (projects, requested) =
        listProjects(url => (200, pagedList("project", 120, url)))

      projects must haveSize(120)
      projects.map(_.name) must beSorted
      projects.forall(p =>
        p.availableLabels.isEmpty && p.availableStates.isEmpty) must beTrue
      requested must haveSize(2)
      requested.forall(_.contains("/workspaces/ws/projects/?")) must beTrue
      requested.forall(_.contains("per_page=100")) must beTrue
    }

    "fail when the project list request fails" in {
      val (client, _) = StubPlaneClient(_ => (401, JsNull))

      Await.result(new PlaneProjectService(client).listProjects(config),
                   5.seconds) must throwA[Exception]
    }
  }

  "PlaneProjectService.getProjectMetadata" should {
    "load every label and state of the project, sorted by name" in {
      val (result, requested) = metadata(projectId) { url =>
        if (url.contains("/labels/")) (200, pagedList("label", 130, url))
        else (200, pagedList("state", 3, url))
      }

      result.availableLabels must haveSize(130)
      result.availableLabels must beSorted
      result.availableStates must equalTo(
        Seq("state 001", "state 002", "state 003"))
      requested.map(_.replaceAll("\\?.*", "")).distinct must containTheSameElementsAs(
        Seq(
          s"https://plane.test/api/v1/workspaces/ws/projects/$projectId/labels/",
          s"https://plane.test/api/v1/workspaces/ws/projects/$projectId/states/"
        ))
    }

    "fail when the label request fails" in {
      metadata(projectId) { url =>
        if (url.contains("/labels/")) (500, JsNull)
        else (200, pagedList("state", 3, url))
      } must throwA[Exception]
    }

    "fail at once on a 429 answer, without a wait for the rate limit" in {
      val (client, requested) = StubPlaneClient { url =>
        if (url.contains("/labels/")) (429, JsNull)
        else (200, pagedList("state", 3, url))
      }

      Await.result(new PlaneProjectService(client)
                     .getProjectMetadata(config, projectId),
                   2.seconds) must throwA[Exception]
      requested.count(_.contains("/labels/")) must equalTo(1)
    }

    "reject an id that is no Plane UUID, without a request" in {
      val (client, requested) =
        StubPlaneClient(url => (200, pagedList("label", 1, url)))

      Await.result(new PlaneProjectService(client)
                     .getProjectMetadata(config, "../../users/me"),
                   5.seconds) must throwA[IllegalArgumentException]
      requested must beEmpty
    }
  }
}
