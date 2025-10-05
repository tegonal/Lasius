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

import core.{SystemServices, TestApplication}
import models._
import mongo.EmbedMongo
import org.specs2.mock.Mockito
import org.specs2.mock.mockito.MockitoMatchers
import play.api.libs.json._
import play.api.mvc._
import play.api.test._

import java.net.URL
import scala.concurrent.{ExecutionContext, Future}

class IssueImporterConfigControllerSpec
    extends PlaySpecification
    with Mockito
    with Results
    with MockitoMatchers
    with EmbedMongo
    with TestApplication {

  // ===== GitLab Config Tests =====

  "get GitLab configs" should {

    "return 403 when user is not Administrator" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember
        )

      val request = FakeRequest().withBody(())
      val result: Future[Result]     = controller.getGitlabConfigs(controller.organisation.id)(request)

      status(result) must equalTo(FORBIDDEN)
    }

    "return all GitLab configs when user is Administrator" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result]     = controller.getGitlabConfigs(controller.organisation.id)(request)

      status(result) must equalTo(OK)
      val configs = contentAsJson(result).as[Seq[GitlabConfigResponse]]
      configs must not be empty
      configs.head.name must equalTo("Test GitLab")
    }
  }

  "get GitLab config by ID" should {

    "return config when exists" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getGitlabConfig(controller.organisation.id, controller.gitlabConfig._id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("Test GitLab")
      gitlabConfig.id must equalTo(controller.gitlabConfig._id)
    }

    "return 404 when config not found" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getGitlabConfig(controller.organisation.id, GitlabConfigId())(request)

      status(result) must equalTo(NOT_FOUND)
    }
  }

  "get GitLab config for project" should {

    "return config when project has mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getGitlabConfigForProject(controller.organisation.id, controller.project.id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("Test GitLab")
      gitlabConfig.projects.exists(_.projectId == controller.project.id) must beTrue
    }

    "return 404 when project has no mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getGitlabConfigForProject(controller.organisation.id, ProjectId())(request)

      status(result) must equalTo(NOT_FOUND)
    }
  }

  "create GitLab config" should {

    "successfully create new config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val createData = CreateGitlabConfig(
        name = "New GitLab",
        baseUrl = new URL("https://gitlab.new.com"),
        accessToken = "new-token",
        checkFrequency = 600000L,
        projects = Seq.empty
      )

      val request: FakeRequest[CreateGitlabConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] = controller.createGitlabConfig(controller.organisation.id)(request)

      status(result) must equalTo(CREATED)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("New GitLab")
      gitlabConfig.baseUrl must equalTo(new URL("https://gitlab.new.com"))
    }

    "return 400 when name is blank" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val createData = CreateGitlabConfig(
        name = "",
        baseUrl = new URL("https://gitlab.new.com"),
        accessToken = "new-token",
        checkFrequency = 600000L,
        projects = Seq.empty
      )

      val request: FakeRequest[CreateGitlabConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] = controller.createGitlabConfig(controller.organisation.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      contentAsString(result) must contain("expected non-blank String for field 'name'")
    }

    "return 403 when user is not Administrator" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember
        )

      val createData = CreateGitlabConfig(
        name = "New GitLab",
        baseUrl = new URL("https://gitlab.new.com"),
        accessToken = "new-token",
        checkFrequency = 600000L,
        projects = Seq.empty
      )

      val request: FakeRequest[CreateGitlabConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] = controller.createGitlabConfig(controller.organisation.id)(request)

      status(result) must equalTo(FORBIDDEN)
    }
  }

  "update GitLab config" should {

    "successfully update config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val updateData = UpdateGitlabConfig(
        name = Some("Updated GitLab"),
        baseUrl = None,
        accessToken = Some("updated-token"),
        checkFrequency = Some(900000L),
        projects = None
      )

      val request: FakeRequest[UpdateGitlabConfig] =
        FakeRequest().withBody(updateData)
      val result: Future[Result] =
        controller.updateGitlabConfig(controller.organisation.id, controller.gitlabConfig._id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("Updated GitLab")
      gitlabConfig.checkFrequency must equalTo(900000L)
    }
  }

  "delete GitLab config" should {

    "successfully delete config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.deleteGitlabConfig(controller.organisation.id, controller.gitlabConfig._id)(request)

      status(result) must equalTo(OK)

      // Verify config is deleted
      val getResult =
        controller.getGitlabConfig(controller.organisation.id, controller.gitlabConfig._id)(request)
      status(getResult) must equalTo(NOT_FOUND)
    }
  }

  "add GitLab project mapping" should {

    "successfully add mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val newProject = ProjectId()
      val mapping = GitlabProjectMapping(
        projectId = newProject,
        settings = GitlabProjectSettings(
          gitlabProjectId = "99",
          maxResults = Some(50),
          params = None,
          projectKeyPrefix = Some("NEW-"),
          tagConfiguration = GitlabTagConfiguration(
            useLabels = false,
            labelFilter = Set.empty,
            useMilestone = true,
            useTitle = false
          )
        )
      )

      val request: FakeRequest[GitlabProjectMapping] =
        FakeRequest().withBody(mapping)
      val result: Future[Result] =
        controller.addGitlabProjectMapping(controller.organisation.id, controller.gitlabConfig._id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.projects.exists(_.projectId == newProject) must beTrue
    }
  }

  "remove GitLab project mapping" should {

    "successfully remove mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.removeGitlabProjectMapping(controller.organisation.id,
                                              controller.gitlabConfig._id,
                                              controller.project.id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.projects.exists(_.projectId == controller.project.id) must beFalse
    }
  }

  "update GitLab project mapping" should {

    "successfully update mapping settings" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val newSettings = GitlabProjectSettings(
        gitlabProjectId = "999",
        maxResults = Some(200),
        params = Some("custom=param"),
        projectKeyPrefix = Some("UPDATED-"),
        tagConfiguration = GitlabTagConfiguration(
          useLabels = true,
          labelFilter = Set("critical"),
          useMilestone = true,
          useTitle = true
        )
      )

      val request: FakeRequest[GitlabProjectSettings] =
        FakeRequest().withBody(newSettings)
      val result: Future[Result] =
        controller.updateGitlabProjectMapping(controller.organisation.id,
                                              controller.gitlabConfig._id,
                                              controller.project.id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      val mapping =
        gitlabConfig.projects.find(_.projectId == controller.project.id)
      mapping must beSome
      mapping.get.settings.gitlabProjectId must equalTo("999")
      mapping.get.settings.maxResults must beSome(200)
    }
  }

  // ===== Jira Config Tests =====

  "get Jira configs" should {

    "return all Jira configs when user is Administrator" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result]     = controller.getJiraConfigs(controller.organisation.id)(request)

      status(result) must equalTo(OK)
      val configs = contentAsJson(result).as[Seq[JiraConfigResponse]]
      configs must not be empty
      configs.head.name must equalTo("Test Jira")
    }
  }

  "get Jira config for project" should {

    "return config when project has mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getJiraConfigForProject(controller.organisation.id, controller.project.id)(request)

      status(result) must equalTo(OK)
      val jiraConfig = contentAsJson(result).as[JiraConfigResponse]
      jiraConfig.name must equalTo("Test Jira")
    }
  }

  // ===== Plane Config Tests =====

  "get Plane configs" should {

    "return all Plane configs when user is Administrator" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result]     = controller.getPlaneConfigs(controller.organisation.id)(request)

      status(result) must equalTo(OK)
      val configs = contentAsJson(result).as[Seq[PlaneConfigResponse]]
      configs must not be empty
      configs.head.name must equalTo("Test Plane")
    }
  }

  "get Plane config for project" should {

    "return config when project has mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getPlaneConfigForProject(controller.organisation.id, controller.project.id)(request)

      status(result) must equalTo(OK)
      val planeConfig = contentAsJson(result).as[PlaneConfigResponse]
      planeConfig.name must equalTo("Test Plane")
    }
  }
}
