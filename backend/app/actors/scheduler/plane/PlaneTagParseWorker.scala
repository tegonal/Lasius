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
import org.apache.pekko.actor._
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
    (for {
      labelIds <- loadLabels()
        .map { labels =>
          val labelFilter =
            projectSettings.tagConfiguration.includeOnlyIssuesWithLabels
          val filteredLabels = labels.filter(l => labelFilter.contains(l.name))
          log.debug(
            s"Filtered labels: ${filteredLabels.map(_.name).mkString(",")}")
          filteredLabels.map(_.id)
        }
      stateIds <- loadStates()
        .map { states =>
          val stateFilter =
            projectSettings.tagConfiguration.includeOnlyIssuesWithState
          val filteredStates = states.filter(s => stateFilter.contains(s.name))
          log.debug(
            s"Filtered states: ${filteredStates.map(_.name).mkString(",")}")
          filteredStates.map(_.id)
        }
      issues <- loadIssues(offset = 0,
                           max = None,
                           labelIds = labelIds,
                           stateIds = stateIds)
    } yield {
      // fetched all results, notify
      if (log.isDebugEnabled) {
        val keys = issues.map(i => s"#${i.id}")
        log.debug(s"Parsed keys:$keys")
      }
      // assemble issue tags
      val tags = issues.map(toPlaneIssueTag).toSet
      systemServices.tagCache ! TagsUpdated[PlaneIssueTag](
        projectSettings.planeProjectId,
        projectId,
        tags)

    }).andThen { case s =>
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
      s"$baseURL/${projectSettings.planeWorkspace}/projects/${issue.project.id}/issues/${issue.id}"

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

  private def loadLabels(): Future[Set[PlaneLabel]] = {
    log.debug(
      s"Fetch labels for projectId=${projectId.value}, planeProjectId=${projectSettings.planeProjectId}")
    apiService
      .getLabels(maxResults = maxResults,
                 workspace = projectSettings.planeWorkspace,
                 projectId = projectSettings.planeProjectId)
  }

  private def loadStates(): Future[Set[PlaneState]] = {
    log.debug(
      s"Fetch states for projectId=${projectId.value}, planeProjectId=${projectSettings.planeProjectId}")
    apiService
      .getStates(maxResults = maxResults,
                 workspace = projectSettings.planeWorkspace,
                 projectId = projectSettings.planeProjectId)
  }

  def loadIssues(offset: Int,
                 max: Option[Int],
                 labelIds: Set[String],
                 stateIds: Set[String]): Future[Seq[PlaneIssue]] = {
    val newMax = max.getOrElse(maxResults)
    log.debug(
      s"Parse issues projectId=${projectId.value}, project=${projectSettings.planeProjectId}, offset:$offset, max:$max")
    val query = projectSettings.params.getOrElse(defaultParams)
    apiService
      .findIssues(
        workspace = projectSettings.planeWorkspace,
        projectId = projectSettings.planeProjectId,
        paramString = query,
        maxResults = newMax,
        includeOnlyIssuesWithLabelsIds = labelIds,
        includeOnlyIssuesWithStateIds = stateIds
      )
  }

  override def postStop(): Unit = {
    cancellable.map(c => c.cancel())
    cancellable = None
    super.postStop()
  }
}
