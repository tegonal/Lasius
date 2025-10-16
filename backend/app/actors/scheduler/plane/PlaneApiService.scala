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
import play.api.libs.json.Reads
import play.api.libs.ws.WSClient

import scala.concurrent.{ExecutionContext, Future}

trait PlaneApiService {

  /** Searches for issues using post params.
    */

  def findIssues(workspace: String,
                 projectId: String,
                 paramString: String,
                 maxResults: Int,
                 includeOnlyIssuesWithLabelsIds: Set[String],
                 includeOnlyIssuesWithStateIds: Set[String])(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneIssue]]

  def getLabels(maxResults: Int, workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Set[PlaneLabel]]

  def getStates(maxResults: Int, workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Set[PlaneState]]
}

class PlaneApiServiceImpl(override val ws: WSClient,
                          override val config: ServiceConfiguration)
    extends PlaneApiService
    with ApiServiceBase {

  private val findIssuesUrl = s"/api/v1/workspaces/%s/projects/%s/issues/?"
  private val fetchLabelUrl = s"/api/v1/workspaces/%s/projects/%s/labels/?"
  private val fetchStateUrl = s"/api/v1/workspaces/%s/projects/%s/states/?"

  def getLabels(maxResults: Int, workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Set[PlaneLabel]] = {
    val url = fetchLabelUrl.format(workspace, projectId)
    loadResults[PlaneLabel, PlaneLabelsQueryResult](
      baseUrl = url,
      maxResults = maxResults).map(_.toSet)
  }

  def getStates(maxResults: Int, workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Set[PlaneState]] = {
    val url = fetchStateUrl.format(workspace, projectId)
    loadResults[PlaneState, PlaneStatesQueryResult](
      baseUrl = url,
      maxResults = maxResults).map(_.toSet)
  }

  def findIssues(workspace: String,
                 projectId: String,
                 paramString: String,
                 maxResults: Int,
                 includeOnlyIssuesWithLabelsIds: Set[String] = Set(),
                 includeOnlyIssuesWithStateIds: Set[String] = Set())(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneIssue]] = {

    val params = Seq(
      Some(paramString),
      if (includeOnlyIssuesWithLabelsIds.isEmpty) None
      else getParam("labels", includeOnlyIssuesWithLabelsIds.mkString(",")),
      if (includeOnlyIssuesWithStateIds.isEmpty) None
      else getParam("state", includeOnlyIssuesWithStateIds.mkString(","))
    )

    val url = findIssuesUrl.format(workspace, projectId)
    logger.debug(s"findIssues: $url")
    loadResults[PlaneIssue, PlaneIssuesQueryResult](baseUrl = url,
                                                    maxResults = maxResults,
                                                    params = params)
  }

  private def loadResults[R, P <: PaginatedQueryResult[R]](
      baseUrl: String,
      maxResults: Int,
      params: Seq[Option[String]] = Seq())(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext,
      reads: Reads[P]): Future[Seq[R]] =
    loadPage[R, P](baseUrl = baseUrl,
                   page = 0,
                   maxResults = maxResults,
                   params = params,
                   lastResult = Seq())

  private def loadPage[R, P <: PaginatedQueryResult[R]](
      baseUrl: String,
      page: Int,
      maxResults: Int,
      params: Seq[Option[String]] = Seq(),
      lastResult: Seq[R] = Seq())(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext,
      reads: Reads[P]): Future[Seq[R]] = {
    val queryParams = getParamList(
      params :+
        getParam("cursor", s"$maxResults:$page:0") :+
        getParam("per_page", maxResults): _*,
    )

    val url = baseUrl + queryParams
    logger.debug(s"loadPage: $url")
    getSingleValue[P](url).flatMap { case (pageWrapper, _) =>
      val concat = lastResult ++ pageWrapper.results
      if (concat.size >= pageWrapper.total_results) {
        // fetched all results, notify
        Future.successful(concat)
      } else if (page >= pageWrapper.total_pages) {
        // fetched all pages
        Future.successful(concat)
      } else if (!pageWrapper.next_page_results) {
        // no next page
        Future.successful(concat)
      } else {
        // load next page
        loadPage(baseUrl = baseUrl,
                 page = page,
                 maxResults = maxResults,
                 params = params,
                 lastResult = concat)
      }
    }
  }
}
