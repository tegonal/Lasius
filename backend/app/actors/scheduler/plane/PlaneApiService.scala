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
  HttpStatusException,
  ServiceAuthentication,
  ServiceConfiguration
}
import play.api.libs.json.Reads
import play.api.libs.ws.WSClient

import java.util.concurrent.{Executors, ScheduledExecutorService, TimeUnit}
import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future, Promise}

trait PlaneApiService {

  /** Loads every issue of a Plane project. Plane may ignore the label and state
    * ids, so the caller filters the result as well.
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

  def getProjects(maxResults: Int, workspace: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneWorkspaceProject]]
}

class PlaneApiServiceImpl(
    override val ws: WSClient,
    override val config: ServiceConfiguration,
    override val requestTimeout: Option[FiniteDuration] = None,
    maxRateLimitRetries: Int = PlaneApiServiceImpl.MaxRateLimitRetries,
    rateLimitWait: (Map[String, scala.collection.Seq[String]],
                    Long) => FiniteDuration = PlaneApiServiceImpl.rateLimitWait)
    extends PlaneApiService
    with ApiServiceBase {

  // The Plane docs list only /work-items/, but Plane 1.0.0 and 1.14.1 answer it with 404.
  @volatile private var useLegacyIssuesResource = false

  private def resourcePath(workspace: String,
                           projectId: String,
                           resource: String): String =
    s"/api/v1/workspaces/$workspace/projects/$projectId/$resource/?"

  def getLabels(maxResults: Int, workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Set[PlaneLabel]] =
    loadAllPages[PlaneLabel, PlaneLabelsQueryResult](
      resourcePath(workspace, projectId, "labels"),
      maxResults).map(_.toSet)

  def getStates(maxResults: Int, workspace: String, projectId: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Set[PlaneState]] =
    loadAllPages[PlaneState, PlaneStatesQueryResult](
      resourcePath(workspace, projectId, "states"),
      maxResults).map(_.toSet)

  def getProjects(maxResults: Int, workspace: String)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneWorkspaceProject]] =
    loadAllPages[PlaneWorkspaceProject, PlaneProjectsQueryResult](
      s"/api/v1/workspaces/$workspace/projects/?",
      maxResults)

  def findIssues(workspace: String,
                 projectId: String,
                 paramString: String,
                 maxResults: Int,
                 includeOnlyIssuesWithLabelsIds: Set[String],
                 includeOnlyIssuesWithStateIds: Set[String])(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext): Future[Seq[PlaneIssue]] = {
    val filterParams = Seq(
      "labels" -> includeOnlyIssuesWithLabelsIds,
      "state"  -> includeOnlyIssuesWithStateIds
    ).collect {
      case (name, ids) if ids.nonEmpty =>
        getParam(name, ids.mkString(","))
    }
    val params = Some(paramString) +: filterParams

    def loadIssuesOf(resource: String): Future[Seq[PlaneIssue]] =
      loadAllPages[PlaneIssue, PlaneIssuesQueryResult](
        resourcePath(workspace, projectId, resource),
        maxResults,
        params)

    if (useLegacyIssuesResource) loadIssuesOf("issues")
    else
      loadIssuesOf("work-items").recoverWith {
        case e: HttpStatusException if e.status == 404 =>
          logger.info(
            s"Plane at ${config.baseUrl} has no work-items endpoint, using /issues/")
          useLegacyIssuesResource = true
          loadIssuesOf("issues")
      }
  }

  /** Follows the next_cursor of each answer until Plane reports the last page.
    * It also stops on a page without a new id, because some Plane versions
    * answer every page with the first one (makeplane/plane#9340).
    */
  private def loadAllPages[R <: PlaneEntity, P <: PaginatedQueryResult[R]](
      path: String,
      perPage: Int,
      params: Seq[Option[String]] = Seq.empty)(implicit
      auth: ServiceAuthentication,
      executionContext: ExecutionContext,
      reads: Reads[P]): Future[Seq[R]] = {

    def loadPage(cursor: String,
                 page: Int,
                 loaded: Vector[R],
                 loadedIds: Set[String]): Future[Seq[R]] = {
      val url = path + getParamList(
        params :+ getParam("cursor", cursor) :+ getParam("per_page",
                                                         perPage): _*)
      logger.debug(s"loadPage: $url")
      retryOnRateLimit()(getSingleValue[P](url)).flatMap { case (result, _) =>
        val newResults = result.results
          .filterNot(r => loadedIds.contains(r.id))
          .distinctBy(_.id)
        val all        = loaded ++ newResults
        val isLastPage =
          !result.next_page_results ||
            newResults.isEmpty ||
            all.size >= result.total_results ||
            page + 1 >= result.total_pages ||
            result.next_cursor == cursor
        if (isLastPage) Future.successful(all)
        else
          loadPage(result.next_cursor,
                   page + 1,
                   all,
                   loadedIds ++ newResults.map(_.id))
      }
    }

    loadPage(cursor = s"$perPage:0:0",
             page = 0,
             loaded = Vector.empty,
             loadedIds = Set.empty)
  }

  /** Plane answers 429 when an API key exceeds its request quota. The call
    * waits for the quota reset and tries again.
    */
  private def retryOnRateLimit[T](attempt: Int = 1)(call: => Future[T])(implicit
      executionContext: ExecutionContext): Future[T] =
    call.recoverWith {
      case e: HttpStatusException
          if e.status == 429 && attempt <= maxRateLimitRetries =>
        val wait = rateLimitWait(e.headers, System.currentTimeMillis())
        logger.info(
          s"Plane at ${config.baseUrl} hit the rate limit, retry $attempt in $wait")
        PlaneApiServiceImpl.after(wait)(retryOnRateLimit(attempt + 1)(call))
    }
}

object PlaneApiServiceImpl {

  val MaxRateLimitRetries = 3

  // The Plane docs give a quota of 60 requests per minute for each API key.
  private val QuotaWindow = 60.seconds

  /** The time until the X-RateLimit-Reset of a 429 answer (epoch seconds),
    * limited to one quota window.
    */
  def rateLimitWait(headers: Map[String, scala.collection.Seq[String]],
                    nowMillis: Long): FiniteDuration =
    headers
      .collectFirst {
        case (name, values) if name.equalsIgnoreCase("X-RateLimit-Reset") =>
          values.headOption.flatMap(_.trim.toLongOption)
      }
      .flatten
      .map(reset => (reset * 1000 - nowMillis).millis.max(1.second))
      .fold(QuotaWindow)(_.min(QuotaWindow))

  private lazy val scheduler: ScheduledExecutorService =
    Executors.newSingleThreadScheduledExecutor { runnable =>
      val thread = new Thread(runnable, "plane-rate-limit")
      thread.setDaemon(true)
      thread
    }

  private def after[T](delay: FiniteDuration)(f: => Future[T])(implicit
      executionContext: ExecutionContext): Future[T] = {
    val elapsed = Promise[Unit]()
    scheduler.schedule(new Runnable { def run(): Unit = elapsed.success(()) },
                       delay.toMillis,
                       TimeUnit.MILLISECONDS)
    elapsed.future.flatMap(_ => f)
  }
}
