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
import play.api.libs.ws.{WSClient, WSRequest, WSResponse}
import org.mockito.ArgumentMatchers.{any, anyString}
import org.mockito.Mockito.when

class IssueImporterConfigControllerSpec
    extends PlaySpecification
    with Mockito
    with Results
    with MockitoMatchers
    with EmbedMongo
    with TestApplication {

  // ===== Unified Config Tests =====

  "get configs" should {

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

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfigs(controller.organisation.id, None)(request)

      status(result) must equalTo(FORBIDDEN)
    }

    "return all configs when user is Administrator" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfigs(controller.organisation.id, None)(request)

      status(result) must equalTo(OK)
      val configs = contentAsJson(result).as[Seq[IssueImporterConfigResponse]]
      configs.size must equalTo(4) // GitLab, Jira, Plane, GitHub
    }

    "return only GitLab configs when filtered by type" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfigs(controller.organisation.id,
                              Some(ImporterType.Gitlab.value))(request)

      status(result) must equalTo(OK)
      val configs = contentAsJson(result).as[Seq[GitlabConfigResponse]]
      configs.size must equalTo(1)
      configs.head.name must equalTo("Test GitLab")
    }
  }

  "get config by ID" should {

    "return config when exists" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request  = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfig(controller.organisation.id, configId)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("Test GitLab")
      gitlabConfig.id must equalTo(controller.gitlabConfig.id)
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

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfig(controller.organisation.id,
                             IssueImporterConfigId())(request)

      status(result) must equalTo(NOT_FOUND)
    }
  }

  "get config for project" should {

    "return config when project has mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfigForProject(controller.organisation.id,
                                       controller.project.id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("Test GitLab")
      gitlabConfig.projects.exists(
        _.projectId == controller.project.id) must beTrue
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

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.getConfigForProject(controller.organisation.id, ProjectId())(
          request)

      status(result) must equalTo(NOT_FOUND)
    }
  }

  "create config" should {

    "successfully create new GitLab config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val createData = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "New GitLab",
        baseUrl = new URL("https://gitlab.new.com"),
        checkFrequency = 600000L,
        accessToken = Some("new-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] =
        controller.createConfig(controller.organisation.id)(request)

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

      val createData = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "",
        baseUrl = new URL("https://gitlab.new.com"),
        checkFrequency = 600000L,
        accessToken = Some("new-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] =
        controller.createConfig(controller.organisation.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      contentAsString(result) must contain("name")
    }

    "return 400 when accessToken is missing for GitLab" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val createData = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "New GitLab",
        baseUrl = new URL("https://gitlab.new.com"),
        checkFrequency = 600000L,
        accessToken = None,
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] =
        controller.createConfig(controller.organisation.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      contentAsString(result) must contain("accessToken")
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

      val createData = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "New GitLab",
        baseUrl = new URL("https://gitlab.new.com"),
        checkFrequency = 600000L,
        accessToken = Some("new-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] =
        controller.createConfig(controller.organisation.id)(request)

      status(result) must equalTo(FORBIDDEN)
    }
  }

  "update config" should {

    "successfully update config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val updateData = UpdateIssueImporterConfig(
        name = Some("Updated GitLab"),
        baseUrl = None,
        checkFrequency = Some(900000L),
        accessToken = Some("updated-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request: FakeRequest[UpdateIssueImporterConfig] =
        FakeRequest().withBody(updateData)
      val result: Future[Result] =
        controller.updateConfig(controller.organisation.id, configId)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.name must equalTo("Updated GitLab")
      gitlabConfig.checkFrequency must equalTo(900000L)
    }
  }

  "delete config" should {

    "successfully delete config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request  = FakeRequest().withBody(())

      // First remove all project mappings
      val removeResult: Future[Result] =
        controller.removeProjectMapping(controller.organisation.id,
                                        configId,
                                        controller.project.id)(request)
      status(removeResult) must equalTo(OK)

      // Now delete the config
      val result: Future[Result] =
        controller.deleteConfig(controller.organisation.id, configId)(request)

      status(result) must equalTo(NO_CONTENT)

      // Verify config is deleted
      val getResult =
        controller.getConfig(controller.organisation.id, configId)(request)
      status(getResult) must equalTo(NOT_FOUND)
    }

    "return 500 when trying to delete config with dependencies" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request  = FakeRequest().withBody(())

      // Try to delete config without removing project mappings first
      val result: Future[Result] =
        controller.deleteConfig(controller.organisation.id, configId)(request)

      status(result) must equalTo(INTERNAL_SERVER_ERROR)
      contentAsString(result) must contain("has_dependencies")
    }
  }

  "add project mapping" should {

    "successfully add GitLab mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val newProject = ProjectId()
      val mapping    = CreateProjectMapping(
        projectId = newProject,
        gitlabProjectId = Some("99"),
        projectKeyPrefix = Some("NEW-"),
        gitlabTagConfig = Some(
          GitlabTagConfiguration(
            useLabels = false,
            labelFilter = Set.empty,
            useMilestone = true,
            useTitle = false
          )
        ),
        jiraProjectKey = None,
        planeProjectId = None,
        planeTagConfig = None,
        maxResults = Some(50),
        params = None
      )

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request: FakeRequest[CreateProjectMapping] =
        FakeRequest().withBody(mapping)
      val result: Future[Result] =
        controller.addProjectMapping(controller.organisation.id, configId)(
          request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.projects.exists(_.projectId == newProject) must beTrue
    }
  }

  "remove project mapping" should {

    "successfully remove mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request  = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.removeProjectMapping(controller.organisation.id,
                                        configId,
                                        controller.project.id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      gitlabConfig.projects.exists(
        _.projectId == controller.project.id) must beFalse
    }
  }

  "update project mapping" should {

    "successfully update GitLab mapping settings" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val newSettings = UpdateProjectMapping(
        gitlabProjectId = Some("999"),
        projectKeyPrefix = Some("UPDATED-"),
        gitlabTagConfig = Some(
          GitlabTagConfiguration(
            useLabels = true,
            labelFilter = Set("critical"),
            useMilestone = true,
            useTitle = true
          )
        ),
        jiraProjectKey = None,
        planeProjectId = None,
        planeTagConfig = None,
        maxResults = Some(200),
        params = Some("custom=param")
      )

      val configId = IssueImporterConfigId(controller.gitlabConfig.id.value)
      val request: FakeRequest[UpdateProjectMapping] =
        FakeRequest().withBody(newSettings)
      val result: Future[Result] =
        controller.updateProjectMapping(controller.organisation.id,
                                        configId,
                                        controller.project.id)(request)

      status(result) must equalTo(OK)
      val gitlabConfig = contentAsJson(result).as[GitlabConfigResponse]
      val mapping      =
        gitlabConfig.projects.find(_.projectId == controller.project.id)
      mapping must beSome
      mapping.get.settings.gitlabProjectId must equalTo("999")
      mapping.get.settings.maxResults must beSome(200)
    }
  }

  // ===== GitHub-Specific Tests =====

  "add GitHub project mapping" should {

    "successfully add GitHub mapping" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val newProject = ProjectId()
      val mapping    = CreateProjectMapping(
        projectId = newProject,
        githubRepoOwner = Some("test-owner"),
        githubRepoName = Some("test-repository"),
        projectKeyPrefix = Some("REPO-"),
        githubTagConfig = Some(
          GithubTagConfiguration(
            useLabels = true,
            labelFilter = Set("duplicate"),
            useMilestone = true,
            useTitle = false,
            useAssignees = true,
            includeOnlyIssuesWithLabels = Set.empty,
            includeOnlyIssuesWithState = Set("open")
          )
        ),
        gitlabProjectId = None,
        gitlabTagConfig = None,
        jiraProjectKey = None,
        planeProjectId = None,
        planeTagConfig = None,
        maxResults = Some(50),
        params = None
      )

      val configId = IssueImporterConfigId(controller.githubConfig.id.value)
      val request: FakeRequest[CreateProjectMapping] =
        FakeRequest().withBody(mapping)
      val result: Future[Result] =
        controller.addProjectMapping(controller.organisation.id, configId)(
          request)

      status(result) must equalTo(OK)
      val githubConfig = contentAsJson(result).as[GithubConfigResponse]
      githubConfig.projects.exists(_.projectId == newProject) must beTrue
    }
  }

  "create GitHub config" should {

    "successfully create new GitHub config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val createData = CreateIssueImporterConfig(
        importerType = ImporterType.Github,
        name = "New GitHub",
        baseUrl = new URL("https://api.github.com"),
        checkFrequency = 600000L,
        accessToken = Some("ghp_new-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None,
        resourceOwner = Some("test-owner"),
        resourceOwnerType = Some("Organization")
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] =
        controller.createConfig(controller.organisation.id)(request)

      status(result) must equalTo(CREATED)
      val githubConfig = contentAsJson(result).as[GithubConfigResponse]
      githubConfig.name must equalTo("New GitHub")
      githubConfig.baseUrl must equalTo(new URL("https://api.github.com"))
    }

    "return 400 when accessToken is missing for GitHub" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

      val createData = CreateIssueImporterConfig(
        importerType = ImporterType.Github,
        name = "New GitHub",
        baseUrl = new URL("https://api.github.com"),
        checkFrequency = 600000L,
        accessToken = None,
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(createData)
      val result: Future[Result] =
        controller.createConfig(controller.organisation.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      contentAsString(result) must contain("accessToken")
    }
  }

  // ===== Test Connectivity Tests =====

  "test connectivity" should {

    "return 200 for valid GitLab config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(200)

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val gitlabConfig = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "Test GitLab",
        baseUrl = new URL("https://gitlab.test.com"),
        checkFrequency = 300000L,
        accessToken = Some("test-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(gitlabConfig)

      val result: Future[Result] =
        controller.testConnectivity(controller.organisation.id)(request)

      status(result) must equalTo(OK)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("success")
      (json \ "message").as[String] must contain("GitLab")
    }

    "return 400 for invalid GitLab credentials" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient with 401 response
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(401)

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val gitlabConfig = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "Test GitLab",
        baseUrl = new URL("https://gitlab.test.com"),
        checkFrequency = 300000L,
        accessToken = Some("invalid-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(gitlabConfig)

      val result: Future[Result] =
        controller.testConnectivity(controller.organisation.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("error")
      (json \ "error").as[String] must equalTo("authentication_failed")
    }

    "return 200 for valid Plane config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(200)

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val planeConfig = CreateIssueImporterConfig(
        importerType = ImporterType.Plane,
        name = "Test Plane",
        baseUrl = new URL("https://plane.test.com"),
        checkFrequency = 300000L,
        accessToken = None,
        consumerKey = None,
        privateKey = None,
        apiKey = Some("test-api-key"),
        workspace = Some("test-workspace")
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(planeConfig)

      val result: Future[Result] =
        controller.testConnectivity(controller.organisation.id)(request)

      status(result) must equalTo(OK)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("success")
      (json \ "message").as[String] must contain("Plane")
    }

    "return 200 for valid GitHub config" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(200)

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val githubConfig = CreateIssueImporterConfig(
        importerType = ImporterType.Github,
        name = "Test GitHub",
        baseUrl = new URL("https://api.github.com"),
        checkFrequency = 300000L,
        accessToken = Some("ghp_test-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None,
        resourceOwner = Some("test-owner"),
        resourceOwnerType = Some("Organization")
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(githubConfig)

      val result: Future[Result] =
        controller.testConnectivity(controller.organisation.id)(request)

      status(result) must equalTo(OK)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("success")
      (json \ "message").as[String] must contain("GitHub")
    }

    "return 400 for timeout" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient with timeout
      val mockWsClient  = mock[WSClient]
      val mockWsRequest = mock[WSRequest]

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(
        Future.failed(new java.util.concurrent.TimeoutException("timeout")))

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val gitlabConfig = CreateIssueImporterConfig(
        importerType = ImporterType.Gitlab,
        name = "Test GitLab",
        baseUrl = new URL("https://gitlab.test.com"),
        checkFrequency = 300000L,
        accessToken = Some("test-token"),
        consumerKey = None,
        privateKey = None,
        apiKey = None
      )

      val request: FakeRequest[CreateIssueImporterConfig] =
        FakeRequest().withBody(gitlabConfig)

      val result: Future[Result] =
        controller.testConnectivity(controller.organisation.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("error")
      (json \ "error").as[String] must equalTo("timeout")
    }
  }

  // ===== List Projects Tests =====

  "list projects" should {

    "return 200 with GitLab projects" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      val projectsJson = Json.arr(
        Json.obj("id" -> 1, "name" -> "Project A"),
        Json.obj("id" -> 2, "name" -> "Project B")
      )

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(200)
      when(mockWsResponse.json).thenReturn(projectsJson)
      when(mockWsResponse.header("Link")).thenReturn(None) // No pagination

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.listProjects(controller.organisation.id,
                                controller.gitlabConfig.id)(request)

      status(result) must equalTo(OK)
      val response = contentAsJson(result).as[ListProjectsResponse]
      response.projects must beSome
      response.projects.get.size must equalTo(2)
      response.projects.get.head.name must equalTo("Project A")
    }

    "return 200 with Plane projects" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      // Plane API fetches projects for the configured workspace
      // The planeConfig in the mock has workspace: "test-workspace"
      val projectsJson = Json.obj(
        "results" -> Json.arr(
          Json.obj("id" -> "proj-1", "name" -> "Project 1"),
          Json.obj("id" -> "proj-2", "name" -> "Project 2")
        )
        // No "next" field = no pagination
      )

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get())
        .thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(200)
      when(mockWsResponse.json)
        .thenReturn(projectsJson) // Fetch projects for test-workspace

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.listProjects(controller.organisation.id,
                                controller.planeConfig.id)(request)

      status(result) must equalTo(OK)
      val response = contentAsJson(result).as[ListProjectsResponse]
      // Plane now returns flat projects list like GitLab/Jira (one workspace per config)
      response.projects must beSome
      response.projects.get.size must equalTo(2)
      response.projects.get.head.name must equalTo("Project 1")
    }

    "return 200 with GitHub repositories" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      val userJson  = Json.obj("login" -> "test-user")
      val reposJson = Json.arr(
        Json.obj("full_name" -> "org/repo-a", "name" -> "Repository A"),
        Json.obj("full_name" -> "org/repo-b", "name" -> "Repository B")
      )

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(200)
      when(mockWsResponse.json)
        .thenReturn(userJson)  // First call: /user
        .thenReturn(reposJson) // Second call: /user/repos or /orgs/{org}/repos
      when(mockWsResponse.header("Link")).thenReturn(None) // No pagination

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.listProjects(controller.organisation.id,
                                controller.githubConfig.id)(request)

      status(result) must equalTo(OK)
      val response = contentAsJson(result).as[ListProjectsResponse]
      response.projects must beSome
      response.projects.get.size must equalTo(2)
      response.projects.get.head.id must equalTo("org/repo-a")
      response.projects.get.head.name must equalTo("Repository A")
    }

    "return 404 when config does not exist" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi,
                                          organisationRole = OrganisationMember)

      val nonExistentId = IssueImporterConfigId()

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.listProjects(controller.organisation.id, nonExistentId)(
          request)

      status(result) must equalTo(NOT_FOUND)
      val json = contentAsJson(result)
      (json \ "error").as[String] must equalTo("not_found")
    }

    "return 403 when config belongs to different organization" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi,
                                          organisationRole = OrganisationMember)

      val differentOrgId = OrganisationId()

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.listProjects(differentOrgId, controller.gitlabConfig.id)(
          request)

      status(result) must equalTo(FORBIDDEN)
    }

    "return 400 when external API fails" in new WithTestApplication {
      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]

      // Mock WSClient with failure
      val mockWsClient   = mock[WSClient]
      val mockWsRequest  = mock[WSRequest]
      val mockWsResponse = mock[WSResponse]

      when(mockWsClient.url(anyString)).thenReturn(mockWsRequest)
      when(mockWsRequest.addHttpHeaders(any[(String, String)]()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.withRequestTimeout(any()))
        .thenReturn(mockWsRequest)
      when(mockWsRequest.get()).thenReturn(Future.successful(mockWsResponse))
      when(mockWsResponse.status).thenReturn(401)

      val controller: IssueImporterConfigControllerMock =
        IssueImporterConfigControllerMock(
          config,
          systemServices,
          authConfig,
          reactiveMongoApi,
          organisationRole = OrganisationMember,
          wsClient = Some(mockWsClient)
        )

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.listProjects(controller.organisation.id,
                                controller.gitlabConfig.id)(request)

      status(result) must equalTo(BAD_REQUEST)
      val json = contentAsJson(result)
      (json \ "error").as[String] must equalTo("list_projects_failed")
    }
  }

  // ===== Refresh Tags Tests =====

  "refresh tags" should {

    "return 202 and trigger immediate refresh when project is mapped" in new WithTestApplication {
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

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.gitlabConfig.id,
                               controller.project.id)(request)

      status(result) must equalTo(ACCEPTED)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("accepted")
      (json \ "message").as[String] must contain("immediately")
      (json \ "configId").as[String] must equalTo(
        controller.gitlabConfig.id.value.toString)
      (json \ "projectId").as[String] must equalTo(
        controller.project.id.value.toString)
      (json \ "importerType").as[String] must equalTo("gitlab")
    }

    "allow OrganisationMember to refresh tags" in new WithTestApplication {
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

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.gitlabConfig.id,
                               controller.project.id)(request)

      status(result) must equalTo(ACCEPTED)
    }

    "return 404 when config not found" in new WithTestApplication {
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

      val nonExistentId = IssueImporterConfigId()

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               nonExistentId,
                               controller.project.id)(request)

      status(result) must equalTo(NOT_FOUND)
      val json = contentAsJson(result)
      (json \ "error").as[String] must equalTo("config_not_found")
    }

    "return 404 when project not mapped to configuration" in new WithTestApplication {
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

      val unmappedProjectId = ProjectId()

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.gitlabConfig.id,
                               unmappedProjectId)(request)

      status(result) must equalTo(NOT_FOUND)
      val json = contentAsJson(result)
      (json \ "status").as[String] must equalTo("error")
      (json \ "error").as[String] must equalTo("project_not_found")
      (json \ "message").as[String] must contain("not mapped")
    }

    "return 403 when config belongs to different organization" in new WithTestApplication {
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

      val differentOrgId = OrganisationId()

      val request                = FakeRequest().withBody(())
      val result: Future[Result] =
        controller.refreshTags(differentOrgId,
                               controller.gitlabConfig.id,
                               controller.project.id)(request)

      status(result) must equalTo(FORBIDDEN)
    }

    "work with all importer types" in new WithTestApplication {
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

      // Test GitLab
      val gitlabResult: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.gitlabConfig.id,
                               controller.project.id)(request)
      status(gitlabResult) must equalTo(ACCEPTED)
      val gitlabJson = contentAsJson(gitlabResult)
      (gitlabJson \ "importerType").as[String] must equalTo("gitlab")

      // Test Jira
      val jiraResult: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.jiraConfig.id,
                               controller.project.id)(request)
      status(jiraResult) must equalTo(ACCEPTED)
      val jiraJson = contentAsJson(jiraResult)
      (jiraJson \ "importerType").as[String] must equalTo("jira")

      // Test Plane
      val planeResult: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.planeConfig.id,
                               controller.project.id)(request)
      status(planeResult) must equalTo(ACCEPTED)
      val planeJson = contentAsJson(planeResult)
      (planeJson \ "importerType").as[String] must equalTo("plane")

      // Test GitHub
      val githubResult: Future[Result] =
        controller.refreshTags(controller.organisation.id,
                               controller.githubConfig.id,
                               controller.project.id)(request)
      status(githubResult) must equalTo(ACCEPTED)
      val githubJson = contentAsJson(githubResult)
      (githubJson \ "importerType").as[String] must equalTo("github")
    }
  }

}
