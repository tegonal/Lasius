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

package controllers

import com.typesafe.config.Config
import core.{SystemServices, TestDBSupport}
import models._
import org.specs2.mock.Mockito
import play.api.mvc.ControllerComponents
import play.api.test.Helpers
import play.modules.reactivemongo.ReactiveMongoApi
import repositories._
import util.{Awaitable, MockAwaitable}

import java.net.URL
import scala.concurrent.ExecutionContext

class IssueImporterConfigControllerMock(
    conf: Config,
    controllerComponents: ControllerComponents,
    systemServices: SystemServices,
    val gitlabConfigRepository: GitlabConfigMongoRepository,
    val jiraConfigRepository: JiraConfigMongoRepository,
    val planeConfigRepository: PlaneConfigMongoRepository,
    authConfig: AuthConfig,
    reactiveMongoApi: ReactiveMongoApi,
    override val organisationRole: OrganisationRole,
    override val projectRole: ProjectRole,
    override val projectActive: Boolean)(implicit ec: ExecutionContext)
    extends IssueImporterConfigController(
      conf = conf,
      controllerComponents = controllerComponents,
      systemServices = systemServices,
      authConfig = authConfig,
      reactiveMongoApi = reactiveMongoApi,
      gitlabConfigRepository = gitlabConfigRepository,
      jiraConfigRepository = jiraConfigRepository,
      planeConfigRepository = planeConfigRepository
    )
    with SecurityControllerMock
    with TestDBSupport {

  // Test data
  val gitlabConfig: GitlabConfig = GitlabConfig(
    _id = GitlabConfigId(),
    organisationReference = organisation.getReference,
    name = "Test GitLab",
    baseUrl = new URL("https://gitlab.test.com"),
    auth = GitlabAuth("test-token"),
    settings = GitlabSettings(checkFrequency = 300000L),
    projects = Seq(
      GitlabProjectMapping(
        projectId = project.id,
        settings = GitlabProjectSettings(
          gitlabProjectId = "42",
          maxResults = Some(100),
          params = None,
          projectKeyPrefix = Some("TEST-"),
          tagConfiguration = GitlabTagConfiguration(
            useLabels = true,
            labelFilter = Set("bug", "feature"),
            useMilestone = false,
            useTitle = false
          )
        )
      )
    )
  )

  val jiraConfig: JiraConfig = JiraConfig(
    _id = JiraConfigId(),
    organisationReference = organisation.getReference,
    name = "Test Jira",
    baseUrl = new URL("https://jira.test.com"),
    auth = JiraAuth(
      consumerKey = "test-consumer",
      privateKey = "test-private-key",
      accessToken = "test-access-token"
    ),
    settings = JiraSettings(checkFrequency = 300000L),
    projects = Seq(
      JiraProjectMapping(
        projectId = project.id,
        settings = JiraProjectSettings(
          jiraProjectKey = "TEST",
          maxResults = Some(100),
          jql = Some("assignee = currentUser()")
        )
      )
    )
  )

  val planeConfig: PlaneConfig = PlaneConfig(
    _id = PlaneConfigId(),
    organisationReference = organisation.getReference,
    name = "Test Plane",
    baseUrl = new URL("https://plane.test.com"),
    auth = PlaneAuth("test-api-key"),
    settings = PlaneSettings(checkFrequency = 300000L),
    projects = Seq(
      PlaneProjectMapping(
        projectId = project.id,
        settings = PlaneProjectSettings(
          planeWorkspace = "test-workspace",
          planeProjectId = "test-project-123",
          maxResults = Some(100),
          params = None,
          tagConfiguration = PlaneTagConfiguration(
            useLabels = false,
            labelFilter = Set.empty,
            useMilestone = false,
            useTitle = false,
            includeOnlyIssuesWithLabels = Set.empty,
            includeOnlyIssuesWithState = Set.empty
          )
        )
      )
    )
  )
}

object IssueImporterConfigControllerMock
    extends MockAwaitable
    with Mockito
    with Awaitable {
  def apply(
      conf: Config,
      systemServices: SystemServices,
      authConfig: AuthConfig,
      reactiveMongoApi: ReactiveMongoApi,
      organisationRole: OrganisationRole = OrganisationAdministrator,
      projectRole: ProjectRole = ProjectAdministrator,
      projectActive: Boolean = true)(implicit
      ec: ExecutionContext): IssueImporterConfigControllerMock = {

    val gitlabConfigRepository = new GitlabConfigMongoRepository()
    val jiraConfigRepository   = new JiraConfigMongoRepository()
    val planeConfigRepository  = new PlaneConfigMongoRepository()

    val controller = new IssueImporterConfigControllerMock(
      conf = conf,
      controllerComponents = Helpers.stubControllerComponents(),
      systemServices = systemServices,
      gitlabConfigRepository = gitlabConfigRepository,
      jiraConfigRepository = jiraConfigRepository,
      planeConfigRepository = planeConfigRepository,
      authConfig = authConfig,
      reactiveMongoApi = reactiveMongoApi,
      organisationRole = organisationRole,
      projectRole = projectRole,
      projectActive = projectActive
    )

    // Initialize data
    controller
      .withDBSession() { implicit dbSession =>
        for {
          // Initialize test configs
          _ <- gitlabConfigRepository.upsert(controller.gitlabConfig)
          _ <- jiraConfigRepository.upsert(controller.jiraConfig)
          _ <- planeConfigRepository.upsert(controller.planeConfig)
        } yield ()
      }
      .awaitResult()

    controller
  }
}
