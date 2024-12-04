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
  ApiServiceBase,
  ServiceAuthentication,
  ServiceConfiguration
}
import play.api.libs.ws.WSClient

import scala.concurrent.{ExecutionContext, Future}

trait PlaneApiService {

  /** Searches for issues using post params.
    */

  def findIssues(workspace: String,
                 projectId: String,
                 query: String,
                 page: Option[Int] = None,
                 maxResults: Option[Int] = None,
                 includeOnlyIssuesWithLabelsIds: Seq[String],
                 includeOnlyIssuesWithStateIds: Seq[String])(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[PlaneIssuesSearchResult]

  def getLabels(workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneLabel]]

  def getStates(workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneState]]
}

class PlaneApiServiceImpl(override val ws: WSClient,
                          override val config: ServiceConfiguration)
    extends PlaneApiService
    with ApiServiceBase {

  private val findIssuesUrl = s"/api/v1/workspaces/%s/projects/%s/issues/?"
  private val fetchLabelUrl = s"/api/v1/workspaces/%s/projects/%s/labels/?"
  private val fetchStateUrl = s"/api/v1/workspaces/%s/projects/%s/states/?"

  def getLabels(workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneLabel]] = {
    val params = getParamList(getParam("per_page", 100))
    val url    = fetchLabelUrl.format(workspace, projectId) + params
    getList[PlaneLabel](url).map(_._1)
  }

  def getStates(workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneState]] = {
    val params = getParamList(getParam("per_page", 100))
    val url    = fetchStateUrl.format(workspace, projectId) + params
    getList[PlaneState](url).map(_._1)
  }

  def findIssues(workspace: String,
                 projectId: String,
                 paramString: String,
                 page: Option[Int] = None,
                 maxResults: Option[Int] = None,
                 includeOnlyIssuesWithLabelsIds: Seq[String] = Seq(),
                 includeOnlyIssuesWithStateIds: Seq[String] = Seq())(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[PlaneIssuesSearchResult] = {

    val currentPage       = page.getOrElse(0)
    val currentMaxResults = maxResults.getOrElse(100).min(100)

    val params = getParamList(
      Some(paramString),
      getParam("cursor", s"${currentMaxResults}:${currentPage}:0"),
      getParam("per_page", currentMaxResults),
      if(includeOnlyIssuesWithLabelsIds.isEmpty) None else getParam("labels", includeOnlyIssuesWithStateIds.mkString(",")),
      if(includeOnlyIssuesWithStateIds.isEmpty) None else getParam("state", includeOnlyIssuesWithStateIds.mkString(",")))

    val url = findIssuesUrl.format(workspace, projectId) + params
    logger.debug(s"findIssues: $url")
    getSingleValue[PlaneIssueWrapper](url).map { case (planeIssueWrapper, _) =>
      PlaneIssuesSearchResult(
        planeIssueWrapper.results,
        Some(planeIssueWrapper.total_results),
        Some(planeIssueWrapper.total_pages),
        maxResults,
        Some(planeIssueWrapper.count),
        Some(planeIssueWrapper.next_page_results),
        Some(planeIssueWrapper.prev_page_results)
      )
    }
  }
}
