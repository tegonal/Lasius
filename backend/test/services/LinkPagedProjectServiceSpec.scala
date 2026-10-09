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

/** GitLab and GitHub name the next page in the Link header. */
class LinkPagedProjectServiceSpec extends Specification {

  implicit val executionContext: ExecutionContext = ExecutionContext.global

  private val gitlabConfig = GitlabConfig(
    id = IssueImporterConfigId(),
    organisationReference = EntityReference(OrganisationId(), "org"),
    name = "GitLab",
    baseUrl = URI.create("https://gitlab.test").toURL,
    auth = GitlabAuth("token"),
    settings = GitlabSettings(checkFrequency = 300000L),
    projects = Seq.empty,
    audit = AuditInfo.initial(UserId())
  )

  private val githubConfig = GithubConfig(
    id = IssueImporterConfigId(),
    organisationReference = EntityReference(OrganisationId(), "org"),
    name = "GitHub",
    baseUrl = URI.create("https://github.test").toURL,
    auth = GithubAuth("token"),
    settings = GithubSettings(checkFrequency = 300000L),
    projects = Seq.empty,
    audit = AuditInfo.initial(UserId())
  )

  private def labels(names: String*): JsArray =
    JsArray(names.map(n => Json.obj("name" -> n)))

  private def next(url: String): Option[String] = Some(
    s"""<$url>; rel="next"""")

  "GitlabProjectService.getProjectMetadata" should {
    "load every label page that the Link header names" in {
      val page2 = "https://gitlab.test/api/v4/projects/42/labels?page=2"
      val (client, requested) = StubPlaneClient(
        url => (200, if (url == page2) labels("b-2") else labels("c-1", "a-1")),
        url => if (url == page2) None else next(page2))

      val result = Await.result(
        new GitlabProjectService(client).getProjectMetadata(gitlabConfig, "42"),
        5.seconds)

      result must equalTo(
        ExternalProjectMetadata(Seq("a-1", "b-2", "c-1"),
                                Seq("opened", "closed", "all")))
      requested must haveSize(2)
    }

    "stop when the next link repeats the current page" in {
      val (client, requested) =
        StubPlaneClient(_ => (200, labels("a")), url => next(url))

      Await
        .result(new GitlabProjectService(client)
                  .getProjectMetadata(gitlabConfig, "42"),
                5.seconds)
        .availableLabels must equalTo(Seq("a"))
      requested must haveSize(1)
    }

    "stop at a page without a new label, although its next link is new" in {
      var page                = 0
      val (client, requested) = StubPlaneClient(
        _ => (200, labels("a")),
        _ => {
          page += 1
          next(
            s"https://gitlab.test/api/v4/projects/42/labels?page=${page + 1}")
        })

      Await
        .result(new GitlabProjectService(client)
                  .getProjectMetadata(gitlabConfig, "42"),
                5.seconds)
        .availableLabels must equalTo(Seq("a"))
      requested must haveSize(2)
    }

    "reject an id that is no number" in {
      val (client, requested) = StubPlaneClient(_ => (200, labels("a")))

      Await.result(new GitlabProjectService(client)
                     .getProjectMetadata(gitlabConfig, "42/../../user"),
                   5.seconds) must throwA[IllegalArgumentException]
      requested must beEmpty
    }
  }

  "GithubProjectService.getProjectMetadata" should {
    "load the labels of an owner/repo id" in {
      val (client, requested) = StubPlaneClient(_ => (200, labels("bug")))

      val result =
        Await.result(new GithubProjectService(client)
                       .getProjectMetadata(githubConfig, "tegonal/lasius"),
                     5.seconds)

      result must equalTo(
        ExternalProjectMetadata(Seq("bug"), Seq("open", "closed", "all")))
      requested.head must startWith(
        "https://github.test/repos/tegonal/lasius/labels?")
    }

    "reject an id with a dot segment" in {
      val (client, requested) = StubPlaneClient(_ => (200, labels("a")))

      Await.result(new GithubProjectService(client)
                     .getProjectMetadata(githubConfig, "../user"),
                   5.seconds) must throwA[IllegalArgumentException]
      requested must beEmpty
    }
  }
}
