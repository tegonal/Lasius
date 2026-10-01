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
  ServiceAuthentication,
  ServiceConfiguration,
  TagParseWorker
}
import core.SystemServices
import models._
import org.apache.pekko.actor.Props
import play.api.libs.ws.WSClient

import java.net.URL
import scala.concurrent.Future
import scala.concurrent.duration._

object PlaneTagParseWorker {
  def props(wsClient: WSClient,
            systemServices: SystemServices,
            config: ServiceConfiguration,
            baseURL: URL,
            settings: PlaneSettings,
            projectSettings: PlaneProjectSettings,
            auth: ServiceAuthentication,
            configId: IssueImporterConfigId,
            organisationId: OrganisationId,
            projectId: ProjectId): Props =
    Props(classOf[PlaneTagParseWorker],
          wsClient,
          systemServices,
          config,
          baseURL,
          settings,
          projectSettings,
          auth,
          configId,
          organisationId,
          projectId)

  /** Plane ignores the labels and state query parameters, so the importer
    * filters itself. None means no filter; an empty set matches no issue.
    */
  def matchesFilters(issue: PlaneIssue,
                     labelIds: Option[Set[String]],
                     stateIds: Option[Set[String]]): Boolean =
    labelIds.forall(ids =>
      issue.labels.exists(_.exists(label => ids.contains(label.id)))) &&
      stateIds.forall(ids => issue.stateId.exists(ids.contains))

  /** True when a configured filter resolves to no id. The import then has no
    * issue to load.
    */
  def filtersAdmitNoIssue(labelIds: Option[Set[String]],
                          stateIds: Option[Set[String]]): Boolean =
    labelIds.exists(_.isEmpty) || stateIds.exists(_.isEmpty)
}

class PlaneTagParseWorker(wsClient: WSClient,
                          protected val systemServices: SystemServices,
                          config: ServiceConfiguration,
                          baseURL: URL,
                          settings: PlaneSettings,
                          projectSettings: PlaneProjectSettings,
                          private implicit val auth: ServiceAuthentication,
                          protected val configId: IssueImporterConfigId,
                          protected val organisationId: OrganisationId,
                          protected val projectId: ProjectId)
    extends TagParseWorker[PlaneIssueTag] {

  import PlaneTagParseWorker.{filtersAdmitNoIssue, matchesFilters}

  private val apiService       = new PlaneApiServiceImpl(wsClient, config)
  private val tagConfiguration = projectSettings.tagConfiguration
  private val workspace        = settings.workspace
  private val planeProjectId   = projectSettings.planeProjectId
  private val maxResults       = projectSettings.maxResults.getOrElse(100)

  override protected val externalProjectId: String = planeProjectId
  override protected val projectName: String       =
    projectSettings.externalProjectName.getOrElse(
      s"Plane Project $planeProjectId")
  override protected val checkFrequency: FiniteDuration =
    settings.checkFrequency.milliseconds

  override protected def loadTags(): Future[Set[PlaneIssueTag]] =
    for {
      labelIds <- idsOfNames(
        tagConfiguration.includeOnlyIssuesWithLabels,
        apiService.getLabels(maxResults, workspace, planeProjectId))
      stateIds <- idsOfNames(
        tagConfiguration.includeOnlyIssuesWithState,
        apiService.getStates(maxResults, workspace, planeProjectId))
      issues <-
        if (filtersAdmitNoIssue(labelIds, stateIds))
          Future.successful(Seq.empty)
        else
          apiService.findIssues(
            workspace = workspace,
            projectId = planeProjectId,
            paramString =
              projectSettings.params.getOrElse("expand=labels,state,project"),
            maxResults = maxResults,
            includeOnlyIssuesWithLabelsIds = labelIds.getOrElse(Set.empty),
            includeOnlyIssuesWithStateIds = stateIds.getOrElse(Set.empty)
          )
    } yield issues
      .filter(matchesFilters(_, labelIds, stateIds))
      .map(toPlaneIssueTag)
      .toSet

  /** Resolves the configured names to Plane ids. It loads the entities only
    * when a filter is configured.
    */
  private def idsOfNames(
      names: Set[String],
      entities: => Future[Iterable[PlaneEntity]]): Future[Option[Set[String]]] =
    if (names.isEmpty) Future.successful(None)
    else
      entities.map(all =>
        Some(all.collect { case e if names.contains(e.name) => e.id }.toSet))

  private def toPlaneIssueTag(issue: PlaneIssue): PlaneIssueTag = {
    val labelTags =
      if (tagConfiguration.useLabels)
        issue.labels
          .getOrElse(Seq.empty)
          .map(_.name)
          .filterNot(tagConfiguration.labelFilter.contains)
          .map(name => SimpleTag(TagId(name)))
      else Seq.empty
    val titleTag =
      Option.when(tagConfiguration.useTitle)(SimpleTag(TagId(issue.name)))

    PlaneIssueTag(
      TagId(s"${issue.project.identifier}-${issue.sequence_id}"),
      issue.project.id,
      Some(issue.name),
      labelTags ++ titleTag,
      s"$baseURL/$workspace/projects/${issue.project.id}/issues/${issue.id}"
    )
  }
}
