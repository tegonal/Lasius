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

import org.joda.time.DateTime
import org.joda.time.format.ISODateTimeFormat
import play.api.libs.json._
import play.api.libs.json.JodaReads
import play.api.libs.json.JodaWrites

/** Custom DateTime format for GitHub API responses. GitHub returns dates in ISO
  * 8601 format with 'Z' suffix (e.g., "2025-10-08T21:56:08Z")
  */
object GithubDateTimeFormat {
  implicit val githubDateTimeFormat: Format[DateTime] = Format[DateTime](
    JodaReads.jodaDateReads("yyyy-MM-dd'T'HH:mm:ss'Z'"),
    JodaWrites.jodaDateWrites("yyyy-MM-dd'T'HH:mm:ss'Z'")
  )
}

case class GithubUser(
    login: String,
    id: Long,
    avatar_url: Option[String],
    html_url: String
)

case class GithubLabel(
    id: Long,
    name: String,
    color: String,
    description: Option[String]
)

case class GithubMilestone(
    id: Long,
    number: Int,
    state: String,
    title: String,
    description: Option[String],
    created_at: DateTime,
    updated_at: DateTime,
    closed_at: Option[DateTime],
    due_on: Option[DateTime]
)

case class GithubIssue(
    id: Long,
    number: Int,
    state: String,
    title: String,
    body: Option[String],
    user: GithubUser,
    labels: Seq[GithubLabel],
    assignees: Seq[GithubUser],
    milestone: Option[GithubMilestone],
    created_at: DateTime,
    updated_at: DateTime,
    closed_at: Option[DateTime],
    html_url: String,
    repository_url: String
)

case class GithubIssuesSearchResult(
    issues: Seq[GithubIssue],
    totalNumberOfItems: Option[Int],
    page: Option[Int],
    perPage: Option[Int]
)

object GithubUser {
  implicit val jsonFormat: Format[GithubUser] = Json.format[GithubUser]
}

object GithubLabel {
  implicit val jsonFormat: Format[GithubLabel] = Json.format[GithubLabel]
}

object GithubMilestone {
  import GithubDateTimeFormat._
  implicit val jsonFormat: Format[GithubMilestone] =
    Json.format[GithubMilestone]
}

object GithubIssue {
  import GithubDateTimeFormat._
  implicit val jsonFormat: Format[GithubIssue] = Json.format[GithubIssue]
}

object GithubIssuesSearchResult {
  implicit val jsonFormat: Format[GithubIssuesSearchResult] =
    Json.format[GithubIssuesSearchResult]
}
