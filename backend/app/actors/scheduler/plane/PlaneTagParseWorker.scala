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

import actors.TagCache.TagsUpdated
import actors.scheduler.{ServiceAuthentication, ServiceConfiguration}
import akka.actor._
import core.SystemServices
import models._
import play.api.libs.ws.WSClient

import java.net.URL
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.duration._
import scala.language.postfixOps

object PlaneTagParseWorker {
  def props(wsClient: WSClient,
            systemServices: SystemServices,
            config: ServiceConfiguration,
            baseURL: URL,
            settings: PlaneSettings,
            projectSettings: PlaneProjectSettings,
            auth: ServiceAuthentication,
            projectId: ProjectId): Props =
    Props(classOf[PlaneTagParseWorker],
          wsClient,
          systemServices,
          config,
          baseURL,
          settings,
          projectSettings,
          auth,
          projectId)

  case object StartParsing
  case object Parse
}

class PlaneTagParseWorker(wsClient: WSClient,
                          systemServices: SystemServices,
                          config: ServiceConfiguration,
                          baseURL: URL,
                          settings: PlaneSettings,
                          projectSettings: PlaneProjectSettings,
                          implicit val auth: ServiceAuthentication,
                          projectId: ProjectId)
    extends Actor
    with ActorLogging {
  import PlaneTagParseWorker._

  var cancellable: Option[Cancellable] = None
  val apiService      = new PlaneApiServiceImpl(wsClient, config)
  val defaultParams   = "expand=labels,state,project"
  val maxResults: Int = projectSettings.maxResults.getOrElse(100)

  val receive: Receive = { case StartParsing =>
    cancellable = Some(
      context.system.scheduler.scheduleOnce(0 milliseconds, self, Parse))
    context.become(parsing)
  }

  val parsing: Receive = { case Parse =>
    val labelF = loadLabels()
    // load labelIds from projectSettings.tagConfiguration.includeOnlyIssuesWithLabels
    val labelIds = labelF
      .map { labels =>
        val excludeLabels = projectSettings.tagConfiguration.includeOnlyIssuesWithLabels
        val filteredLabels = labels.filter(l =>
          excludeLabels.contains(l.name))
        log.debug(
          s"Filtered labels: ${filteredLabels.map(_.name).mkString(",")}")
        filteredLabels.map(_.id)
      }
    // load stateIds from projectSettings.tagConfiguration.includeOnlyIssuesWithState
    val stateF = loadStates()
    val stateIds = stateF
      .map { states =>
        val includeStates = projectSettings.tagConfiguration.includeOnlyIssuesWithState
        val filteredStates = states.filter(s =>
          includeStates.contains(s.name))
        log.debug(
          s"Filtered states: ${filteredStates.map(_.name).mkString(",")}")
        filteredStates.map(_.id)
      }

    loadIssues(0, None, labelIds, stateIds)
      .map { result =>
        // fetched all results, notify
        if (log.isDebugEnabled) {
          val keys = result.map(i => s"#${i.id}")
          log.debug(s"Parsed keys:$keys")
        }
        // assemble issue tags
        val tags = result.map(toPlaneIssueTag)
        systemServices.tagCache ! TagsUpdated[PlaneIssueTag](
          projectSettings.planeProjectId,
          projectId,
          tags)

      }
      .andThen { case s =>
        // restart timer
        log.debug(s"andThen:restart time $s")
        cancellable = Some(
          context.system.scheduler
            .scheduleOnce(settings.checkFrequency milliseconds, self, Parse))
      }
  }

  private def toPlaneIssueTag(issue: PlaneIssue): PlaneIssueTag = {

    val nameTag = if (projectSettings.tagConfiguration.useTitle) {
      Some(SimpleTag(TagId(issue.name)))
    } else {
      None
    }

    val labelTags = if (projectSettings.tagConfiguration.useLabels) {
      issue.labels match {
        case Some(labels) =>
          labels
            .filterNot(l =>
              projectSettings.tagConfiguration.labelFilter.contains(l.name))
            .map(l => SimpleTag(TagId(l.name)))
        case None => Seq()
      }
    } else {
      Seq()
    }

    val tags =
      nameTag.map(t => labelTags :+ t).getOrElse(labelTags)

    val issueLink =
      s"${baseURL}/${projectSettings.planeWorkspace}/projects/${issue.project.id}/issues/${issue.id}"

    PlaneIssueTag(
      TagId(
        issue.project.identifier + "-" +
          issue.sequence_id.toString),
      issue.project.id,
      Some(issue.name),
      tags,
      issueLink
    )
  }

  private def loadLabels(): Future[Seq[PlaneLabel]] = {
    log.debug(
      s"Fetch labels for projectId=${projectId.value}, planeProjectId=${projectSettings.planeProjectId}")
    apiService
      .getLabels(projectSettings.planeWorkspace, projectSettings.planeProjectId)
  }

  private def loadStates(): Future[Seq[PlaneState]] = {
    log.debug(
      s"Fetch states for projectId=${projectId.value}, planeProjectId=${projectSettings.planeProjectId}")
    apiService
      .getStates(projectSettings.planeWorkspace, projectSettings.planeProjectId)
  }

  def loadIssues(
      offset: Int,
      max: Option[Int],
      labelIds: Future[Seq[String]],
      stateIds: Future[Seq[String]],
      lastResult: Set[PlaneIssue] = Set()): Future[Set[PlaneIssue]] = {
    val newMax = max.getOrElse(maxResults)

    issues(offset, newMax, labelIds, stateIds).flatMap { result =>
      val concat: Set[PlaneIssue] = lastResult ++ result.issues.toSet
      log.debug(
        s"loaded issues: maxResults:${result.totalNumberOfItems}, fetch count${concat.size}")
      if (concat.size >= result.totalNumberOfItems.getOrElse(Int.MaxValue)) {
        // fetched all results, notify
        Future.successful(concat)
      } else if (result.page.isDefined && result.page.get >= result.totalPages
          .getOrElse(Int.MaxValue)) {
        // fetched all pages
        Future.successful(concat)
      } else if (result.nextPage.isEmpty || !result.nextPage.get) {
        // no next page
        Future.successful(concat)
      } else {
        // load next page
        loadIssues(offset + 1, max, labelIds, stateIds, concat)
      }
    }
  }

  def labels(): Future[Seq[PlaneLabel]] = {
    log.debug(
      s"Parse label projectId=${projectId.value}, project=${projectSettings.planeProjectId}")
    val query = projectSettings.params.getOrElse(defaultParams)
    apiService
      .getLabels(projectSettings.planeWorkspace, projectSettings.planeProjectId)
  }

  def issues(offset: Int, max: Int, labelIds: Future[Seq[String]], stateIds: Future[Seq[String]]): Future[PlaneIssuesSearchResult] = {
    log.debug(
      s"Parse issues projectId=${projectId.value}, project=${projectSettings.planeProjectId}, offset:$offset, max:$max")
    val query = projectSettings.params.getOrElse(defaultParams)
    labelIds.map { labelIdsL => {
      stateIds.map { stateIdsL =>
          apiService
            .findIssues(projectSettings.planeWorkspace,
              projectSettings.planeProjectId,
              query,
              Some(offset),
              Some(max),
              labelIdsL,
              stateIdsL)
        }
      } flatten
    } flatten
  }

  override def postStop(): Unit = {
    cancellable.map(c => c.cancel())
    cancellable = None
    super.postStop()
  }
}
