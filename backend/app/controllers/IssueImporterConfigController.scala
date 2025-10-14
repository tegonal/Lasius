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
import controllers.errors.ConfigErrorResponses
import core.{PluginHandler, SystemServices}
import models._
import play.api.libs.json.Json
import play.api.mvc.{Action, ControllerComponents, Result}
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.IssueImporterConfigRepository
import services.ExternalProjectService

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}

/** Unified controller for all issue importer configurations (GitLab, Jira,
  * Plane).
  *
  * Design note: This uses 10 unified endpoints with type discrimination,
  * diverging from the Invitation pattern (which uses separate endpoints per
  * type). This is intentional because:
  *   1. All importer types are created in the same context (organization)
  *   2. Type is configuration data, not a different resource paradigm
  *   3. Makes adding new types (GitHub, BitBucket) trivial
  *
  * Endpoints reduced from 27 to 10:
  *   - 5 org-level config CRUD
  *   - 3 project mapping CRUD
  *   - 1 convenience lookup by project
  */
class IssueImporterConfigController @Inject() (
    override val conf: Config,
    override val controllerComponents: ControllerComponents,
    override val systemServices: SystemServices,
    override val authConfig: AuthConfig,
    override val reactiveMongoApi: ReactiveMongoApi,
    issueImporterRepository: IssueImporterConfigRepository,
    userRepository: repositories.UserRepository,
    wsClient: play.api.libs.ws.WSClient
)(implicit ec: ExecutionContext)
    extends BaseLasiusController() {

  // ===== Organisation-level Config CRUD (5 endpoints) =====

  def getConfigs(orgId: OrganisationId,
                 importerType: Option[String]): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          val typeFilter = importerType.flatMap(ImporterType.fromString)
          issueImporterRepository
            .findByOrganisation(userOrg.organisationReference.id, typeFilter)
            .flatMap { configs =>
              Future
                .sequence(configs.map(toResponse))
                .map(responses => Ok(Json.toJson(responses)))
            }
        }
    }

  def getConfig(orgId: OrganisationId,
                configId: IssueImporterConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          issueImporterRepository
            .findById(configId)
            .flatMap {
              case Some(config) =>
                validateConfigOwnership(config,
                                        userOrg.organisationReference.id)
                  .flatMap(_ =>
                    toResponseAsync(config).map(response =>
                      Ok(Json.toJson(response))))
              case None =>
                Future.successful(NotFound(
                  Json.parse(ConfigErrorResponses.configNotFound(configId))))
            }
        }
    }

  def createConfig(orgId: OrganisationId): Action[CreateIssueImporterConfig] =
    HasUserRole(FreeUser,
                validateJson[CreateIssueImporterConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            _      <- validateNonBlankString("name", request.body.name)
            _      <- validateConfigForType(request.body)
            config <- issueImporterRepository.create(
              userOrg.organisationReference,
              request.body,
              user.id)
            _        <- Future.successful(startSchedulersForConfig(config))
            response <- toResponse(config)
          } yield Created(Json.toJson(response))
        }
    }

  def updateConfig(
      orgId: OrganisationId,
      configId: IssueImporterConfigId): Action[UpdateIssueImporterConfig] =
    HasUserRole(FreeUser,
                validateJson[UpdateIssueImporterConfig],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- issueImporterRepository
              .findById(configId)
              .noneToFailed(ConfigErrorResponses.configNotFound(configId))
            _ <- validateConfigOwnership(config,
                                         userOrg.organisationReference.id)
            _ <- request.body.name.fold(success())(name =>
              validateNonBlankString("name", name))
            // Check if changes require scheduler restart
            needsRestart = requiresSchedulerRestart(request.body)
            _ <- Future.successful(
              if (needsRestart) stopSchedulersForConfig(config) else ())
            updated <- issueImporterRepository.update(configId,
                                                      request.body,
                                                      user.id)
            _ <- validateUpdatedGithubConfig(updated)
            _ <- Future.successful(
              if (needsRestart) startSchedulersForConfig(updated) else ())
            response <- toResponse(updated)
          } yield Ok(Json.toJson(response))
        }
    }

  def deleteConfig(orgId: OrganisationId,
                   configId: IssueImporterConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- issueImporterRepository
              .findById(configId)
              .noneToFailed(ConfigErrorResponses.configNotFound(configId))
            _ <- validateConfigOwnership(config,
                                         userOrg.organisationReference.id)
            _ <- validateNoProjectDependencies(config)
            _ <- issueImporterRepository.removeById(configId)
          } yield NoContent
        }
    }

  // ===== Project Mapping CRUD (3 endpoints) =====

  def addProjectMapping(
      orgId: OrganisationId,
      configId: IssueImporterConfigId): Action[CreateProjectMapping] =
    HasUserRole(FreeUser,
                validateJson[CreateProjectMapping],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- issueImporterRepository
              .findById(configId)
              .noneToFailed(ConfigErrorResponses.configNotFound(configId))
            _ <- validateConfigOwnership(config,
                                         userOrg.organisationReference.id)
            _ <- validateProjectMappingForType(config.importerType,
                                               request.body)
            updated <- issueImporterRepository
              .addProjectMapping(configId, request.body)
            _ <- Future.successful(
              startSchedulerForProject(updated, request.body.projectId))
            response <- toResponse(updated)
          } yield Ok(Json.toJson(response))
        }
    }

  def updateProjectMapping(orgId: OrganisationId,
                           configId: IssueImporterConfigId,
                           projectId: ProjectId): Action[UpdateProjectMapping] =
    HasUserRole(FreeUser,
                validateJson[UpdateProjectMapping],
                withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- issueImporterRepository
              .findById(configId)
              .noneToFailed(ConfigErrorResponses.configNotFound(configId))
            _ <- validateConfigOwnership(config,
                                         userOrg.organisationReference.id)
            updated <- issueImporterRepository
              .updateProjectMapping(configId, projectId, request.body)
            response <- toResponse(updated)
          } yield Ok(Json.toJson(response))
        }
    }

  def removeProjectMapping(orgId: OrganisationId,
                           configId: IssueImporterConfigId,
                           projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = true) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          for {
            config <- issueImporterRepository
              .findById(configId)
              .noneToFailed(ConfigErrorResponses.configNotFound(configId))
            _ <- validateConfigOwnership(config,
                                         userOrg.organisationReference.id)
            _ <- Future.successful(stopSchedulerForProject(config, projectId))
            updated <- issueImporterRepository
              .removeProjectMapping(configId, projectId)
            response <- toResponse(updated)
          } yield Ok(Json.toJson(response))
        }
    }

  // ===== Convenience Lookup (1 endpoint) =====

  def getConfigForProject(orgId: OrganisationId,
                          projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationAdministrator) { userOrg =>
          issueImporterRepository
            .findByProjectId(projectId)
            .flatMap {
              case Some(config) =>
                validateConfigOwnership(config,
                                        userOrg.organisationReference.id)
                  .flatMap(_ =>
                    toResponse(config).map(response =>
                      Ok(Json.toJson(response))))
              case None =>
                Future.successful(NotFound(
                  ConfigErrorResponses.configNotFoundForProject(projectId)))
            }
        }
    }

  // ===== Force Tag Refresh (1 endpoint) =====

  /** Forces an immediate tag refresh for a specific project mapping. Useful for
    * testing integrations or when you need fresh data immediately.
    */
  def refreshTags(orgId: OrganisationId,
                  configId: IssueImporterConfigId,
                  projectId: ProjectId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          issueImporterRepository
            .findById(configId)
            .flatMap {
              case Some(config) =>
                for {
                  _      <- validateConfigOwnership(config, orgId)
                  result <- triggerRefreshForConfig(config, projectId)
                } yield result

              case None =>
                Future.successful(NotFound(
                  Json.parse(ConfigErrorResponses.configNotFound(configId))))
            }
        }
    }

  private def triggerRefreshForConfig(config: IssueImporterConfig,
                                      projectId: ProjectId): Future[Result] = {
    // Find the project mapping
    val projectMappingOpt = config match {
      case c: GitlabConfig => c.projects.find(_.projectId == projectId)
      case c: JiraConfig   => c.projects.find(_.projectId == projectId)
      case c: PlaneConfig  => c.projects.find(_.projectId == projectId)
      case c: GithubConfig => c.projects.find(_.projectId == projectId)
    }

    projectMappingOpt match {
      case Some(projectMapping) =>
        val importerType = config.importerType.value

        // Trigger immediate refresh via PluginHandler
        systemServices.pluginHandler ! PluginHandler.RefreshProjectTags(
          config.importerType,
          config.id,
          projectId
        )

        Future.successful(
          Accepted(
            Json.obj(
              "status" -> "accepted",
              "message" -> s"Tag refresh triggered immediately. Tags will be updated shortly.",
              "configId"     -> config.id.value.toString,
              "projectId"    -> projectId.value.toString,
              "importerType" -> importerType
            ))
        )

      case None =>
        Future.successful(
          NotFound(
            Json.obj(
              "status" -> "error",
              "message" -> s"Project ${projectId.value} is not mapped to this configuration",
              "error"     -> "project_not_found",
              "configId"  -> config.id.value.toString,
              "projectId" -> projectId.value.toString
            ))
        )
    }
  }

  // ===== Test Connectivity =====

  /** Tests connectivity to the external service without saving configuration.
    * Useful for validating credentials before creating a config.
    */
  def testConnectivity(
      orgId: OrganisationId): Action[CreateIssueImporterConfig] =
    HasUserRole(FreeUser,
                parse.json[CreateIssueImporterConfig],
                withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          val config = request.body

          // Validate required fields first
          validateConfigForType(config).flatMap { _ =>
            testConnectivityForType(config)
              .map { testResult =>
                if (testResult.success) {
                  Ok(
                    Json.obj(
                      "status"  -> "success",
                      "message" -> testResult.message
                    ))
                } else {
                  BadRequest(
                    Json.obj(
                      "status"  -> "error",
                      "message" -> testResult.message,
                      "error"   -> (testResult.errorCode.getOrElse(
                        "connection_failed"): String)
                    ))
                }
              }
              .recover { case e: Exception =>
                logger.error(
                  s"Connectivity test failed for ${config.importerType}",
                  e)
                BadRequest(
                  Json.obj(
                    "status"  -> "error",
                    "message" -> e.getMessage,
                    "error"   -> "connection_failed"
                  ))
              }
          }
        }
    }

  /** Tests connectivity for an existing configuration. Useful for validating
    * that saved credentials still work or testing after updating configuration.
    */
  def testExistingConfig(orgId: OrganisationId,
                         configId: IssueImporterConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          issueImporterRepository
            .findById(configId)
            .flatMap {
              case None =>
                Future.successful(NotFound(
                  Json.parse(ConfigErrorResponses.configNotFound(configId))))

              case Some(config) =>
                validateConfigOwnership(config, orgId).flatMap { _ =>
                  // Convert domain config to DTO for testing
                  val testConfig = configToCreateDTO(config)

                  testConnectivityForType(testConfig)
                    .map { testResult =>
                      if (testResult.success) {
                        Ok(
                          Json.obj(
                            "status"  -> "success",
                            "message" -> testResult.message
                          ))
                      } else {
                        BadRequest(
                          Json.obj(
                            "status"  -> "error",
                            "message" -> testResult.message,
                            "error"   -> (testResult.errorCode.getOrElse(
                              "connection_failed"): String)
                          ))
                      }
                    }
                    .recover { case e: Exception =>
                      logger.error(
                        s"Connectivity test failed for config ${configId.value}",
                        e)
                      BadRequest(
                        Json.obj(
                          "status"  -> "error",
                          "message" -> e.getMessage,
                          "error"   -> "connection_failed"
                        ))
                    }
                }
            }
        }
    }

  def listProjects(orgId: OrganisationId,
                   configId: IssueImporterConfigId): Action[Unit] =
    HasUserRole(FreeUser, parse.empty, withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          // Fetch the config
          issueImporterRepository
            .findById(configId)
            .flatMap {
              case None =>
                Future.successful(
                  NotFound(ConfigErrorResponses.External.notFound(configId)))

              case Some(config) =>
                // Verify config belongs to the organization
                validateConfigOwnership(config, orgId).flatMap { _ =>
                  // List projects based on importer type
                  listProjectsForConfig(config)
                    .map { response =>
                      Ok(Json.toJson(response))
                    }
                    .recover { case e: Exception =>
                      logger.error(
                        s"Failed to list projects for config ${configId.value}",
                        e)
                      BadRequest(
                        ConfigErrorResponses.External.listProjectsFailed(e))
                    }
                }
            }
        }
    }

  /** Lists available resource owners (user + organizations) for a GitHub token.
    * This is GitHub-specific and helps users select the correct resource owner
    * when creating organization-scoped fine-grained tokens.
    */
  def listGithubResourceOwners(
      orgId: OrganisationId): Action[CreateIssueImporterConfig] =
    HasUserRole(FreeUser,
                parse.json[CreateIssueImporterConfig],
                withinTransaction = false) {
      implicit dbSession => _ => user => implicit request =>
        HasOrganisationRole(user, orgId, OrganisationMember) { userOrg =>
          val config = request.body

          // Only works for GitHub
          config.importerType match {
            case ImporterType.Github =>
              config.accessToken match {
                case Some(token) =>
                  val githubService =
                    new services.GithubProjectService(wsClient)
                  githubService
                    .listResourceOwners(config.baseUrl.toString, token)
                    .map { owners =>
                      Ok(Json.toJson(
                        ListProjectsResponse(projects = Some(owners))))
                    }
                    .recover { case e: Exception =>
                      logger.error(s"Failed to list GitHub resource owners", e)
                      BadRequest(
                        Json.obj(
                          "status"  -> "error",
                          "message" -> e.getMessage,
                          "error"   -> "list_resource_owners_failed"
                        ))
                    }

                case None =>
                  Future.successful(
                    BadRequest(
                      Json.obj(
                        "status" -> "error",
                        "message" -> "accessToken is required to list resource owners",
                        "error" -> "missing_access_token"
                      )))
              }

            case _ =>
              Future.successful(
                BadRequest(Json.obj(
                  "status"  -> "error",
                  "message" -> "Resource owners are only available for GitHub",
                  "error"   -> "invalid_importer_type"
                )))
          }
        }
    }

  // ===== Helper Methods =====

  /** Fetches a user by ID and converts to UserStub. Returns a placeholder if
    * user not found.
    */
  private def getUserStub(userId: UserId)(implicit
      dbSession: core.DBSession): Future[UserStub] = {
    userRepository.findById(userId).map {
      case Some(user) => user.toStub
      case None       =>
        // User was deleted - create placeholder
        UserStub(
          id = userId,
          key = "deleted-user",
          email = "deleted@lasius.ch",
          firstName = "Deleted",
          lastName = "User",
          active = false,
          role = FreeUser
        )
    }
  }

  private def toResponse(config: IssueImporterConfig)(implicit
      dbSession: core.DBSession): Future[IssueImporterConfigResponse] = {
    val auditInfo = config match {
      case c: GitlabConfig => c.audit
      case c: JiraConfig   => c.audit
      case c: PlaneConfig  => c.audit
      case c: GithubConfig => c.audit
    }

    for {
      createdBy <- getUserStub(auditInfo.createdBy)
      updatedBy <- getUserStub(auditInfo.updatedBy)
    } yield config match {
      case c: GitlabConfig =>
        GitlabConfigResponse.fromConfig(c, createdBy, updatedBy)
      case c: JiraConfig =>
        JiraConfigResponse.fromConfig(c, createdBy, updatedBy)
      case c: PlaneConfig =>
        PlaneConfigResponse.fromConfig(c, createdBy, updatedBy)
      case c: GithubConfig =>
        GithubConfigResponse.fromConfig(c, createdBy, updatedBy)
    }
  }

  /** Async version of toResponse that enriches GitHub configs with available
    * resource owners. Falls back to sync version if fetching fails.
    */
  private def toResponseAsync(config: IssueImporterConfig)(implicit
      dbSession: core.DBSession): Future[IssueImporterConfigResponse] = {
    val auditInfo = config match {
      case c: GitlabConfig => c.audit
      case c: JiraConfig   => c.audit
      case c: PlaneConfig  => c.audit
      case c: GithubConfig => c.audit
    }

    for {
      createdBy <- getUserStub(auditInfo.createdBy)
      updatedBy <- getUserStub(auditInfo.updatedBy)
      response  <- config match {
        case c: GithubConfig =>
          // Fetch available resource owners for GitHub configs
          val githubService = new services.GithubProjectService(wsClient)
          githubService
            .listResourceOwners(c.baseUrl.toString, c.auth.accessToken)
            .map { owners =>
              GithubConfigResponse
                .fromConfig(c, createdBy, updatedBy, Some(owners))
            }
            .recover { case e: Exception =>
              // If fetching fails, return config without resource owners
              logger.warn(
                s"Failed to fetch resource owners for config ${c.id.value}",
                e)
              GithubConfigResponse.fromConfig(c, createdBy, updatedBy, None)
            }

        case c: GitlabConfig =>
          Future.successful(
            GitlabConfigResponse.fromConfig(c, createdBy, updatedBy))
        case c: JiraConfig =>
          Future.successful(
            JiraConfigResponse.fromConfig(c, createdBy, updatedBy))
        case c: PlaneConfig =>
          Future.successful(
            PlaneConfigResponse.fromConfig(c, createdBy, updatedBy))
      }
    } yield response
  }

  /** Validates that a config belongs to the specified organization.
    *
    * @param config
    *   The config to check
    * @param orgId
    *   The expected organization ID
    * @return
    *   Future[Result] that fails with Forbidden error if ownership check fails
    */
  private def validateConfigOwnership(config: IssueImporterConfig,
                                      orgId: OrganisationId): Future[Result] = {
    validate(
      config.organisationReference.id == orgId,
      ConfigErrorResponses.accessDenied(config.id)
    )
  }

  /** Validates that a config has no project dependencies before deletion.
    *
    * @param config
    *   The config to check
    * @return
    *   Future[Result] that fails with error if config still has project
    *   mappings
    */
  private def validateNoProjectDependencies(
      config: IssueImporterConfig): Future[Result] = {
    val projectCount = config match {
      case c: GitlabConfig => c.projects.size
      case c: JiraConfig   => c.projects.size
      case c: PlaneConfig  => c.projects.size
      case c: GithubConfig => c.projects.size
    }

    if (projectCount > 0) {
      Future.failed(
        new IllegalStateException(ConfigErrorResponses.hasDependencies(config)))
    } else {
      success()
    }
  }

  private def validateConfigForType(
      config: CreateIssueImporterConfig): Future[Result] = {
    // Validate check frequency (minimum 5 minutes = 300,000 milliseconds)
    val minCheckFrequency        = 300000L
    val checkFrequencyValidation = validate(
      config.checkFrequency >= minCheckFrequency,
      ConfigErrorResponses.validationFailed(
        "checkFrequency",
        s"checkFrequency must be at least 5 minutes (${minCheckFrequency}ms), got ${config.checkFrequency}ms",
        config.importerType)
    )

    checkFrequencyValidation.flatMap { _ =>
      config.importerType match {
        case ImporterType.Gitlab =>
          validate(
            config.accessToken.isDefined,
            ConfigErrorResponses.validationFailed(
              "accessToken",
              "accessToken is required for GitLab configurations",
              ImporterType.Gitlab)
          )

        case ImporterType.Jira =>
          for {
            _ <- validate(
              config.consumerKey.isDefined,
              ConfigErrorResponses.validationFailed(
                "consumerKey",
                "consumerKey is required for Jira configurations",
                ImporterType.Jira)
            )
            _ <- validate(
              config.privateKey.isDefined,
              ConfigErrorResponses.validationFailed(
                "privateKey",
                "privateKey is required for Jira configurations",
                ImporterType.Jira)
            )
            _ <- validate(
              config.accessToken.isDefined,
              ConfigErrorResponses.validationFailed(
                "accessToken",
                "accessToken is required for Jira configurations",
                ImporterType.Jira)
            )
          } yield Ok

        case ImporterType.Plane =>
          validate(
            config.apiKey.isDefined,
            ConfigErrorResponses.validationFailed(
              "apiKey",
              "apiKey is required for Plane configurations",
              ImporterType.Plane)
          )

        case ImporterType.Github =>
          for {
            _ <- validate(
              config.accessToken.isDefined,
              ConfigErrorResponses.validationFailed(
                "accessToken",
                "accessToken is required for GitHub configurations",
                ImporterType.Github)
            )
            _ <- validate(
              config.resourceOwner.isDefined,
              ConfigErrorResponses.validationFailed(
                "resourceOwner",
                "resourceOwner is required for GitHub configurations",
                ImporterType.Github)
            )
            _ <- validate(
              config.resourceOwnerType.isDefined,
              ConfigErrorResponses.validationFailed(
                "resourceOwnerType",
                "resourceOwnerType is required for GitHub configurations",
                ImporterType.Github)
            )
          } yield Ok
      }
    }
  }

  /** Validates that a GitHub config has a resourceOwner after update. Since
    * updates can be partial, we need to validate the final result, not the
    * input DTO.
    */
  private def validateUpdatedGithubConfig(
      config: IssueImporterConfig): Future[Result] = {
    config match {
      case c: GithubConfig =>
        for {
          _ <- validate(
            c.auth.resourceOwner.isDefined,
            ConfigErrorResponses.validationFailed(
              "resourceOwner",
              "resourceOwner is required for GitHub configurations",
              ImporterType.Github)
          )
          _ <- validate(
            c.auth.resourceOwnerType.isDefined,
            ConfigErrorResponses.validationFailed(
              "resourceOwnerType",
              "resourceOwnerType is required for GitHub configurations",
              ImporterType.Github)
          )
        } yield Ok
      case _ => success()
    }
  }

  private def validateProjectMappingForType(
      importerType: ImporterType,
      mapping: CreateProjectMapping): Future[Result] = {
    importerType match {
      case ImporterType.Gitlab =>
        for {
          _ <- validate(
            mapping.gitlabProjectId.isDefined,
            ConfigErrorResponses.validationFailed(
              "gitlabProjectId",
              "gitlabProjectId is required for GitLab project mappings",
              ImporterType.Gitlab)
          )
          _ <- validate(
            mapping.gitlabTagConfig.isDefined,
            ConfigErrorResponses.validationFailed(
              "gitlabTagConfig",
              "gitlabTagConfig is required for GitLab project mappings",
              ImporterType.Gitlab)
          )
        } yield Ok

      case ImporterType.Jira =>
        validate(
          mapping.jiraProjectKey.isDefined,
          ConfigErrorResponses.validationFailed(
            "jiraProjectKey",
            "jiraProjectKey is required for Jira project mappings",
            ImporterType.Jira)
        )

      case ImporterType.Plane =>
        for {
          _ <- validate(
            mapping.planeProjectId.isDefined,
            ConfigErrorResponses.validationFailed(
              "planeProjectId",
              "planeProjectId is required for Plane project mappings",
              ImporterType.Plane)
          )
          _ <- validate(
            mapping.planeWorkspaceSlug.isDefined,
            ConfigErrorResponses.validationFailed(
              "planeWorkspaceSlug",
              "planeWorkspaceSlug is required for Plane project mappings",
              ImporterType.Plane)
          )
          _ <- validate(
            mapping.planeTagConfig.isDefined,
            ConfigErrorResponses.validationFailed(
              "planeTagConfig",
              "planeTagConfig is required for Plane project mappings",
              ImporterType.Plane)
          )
        } yield Ok

      case ImporterType.Github =>
        for {
          _ <- validate(
            mapping.githubRepoOwner.isDefined,
            ConfigErrorResponses.validationFailed(
              "githubRepoOwner",
              "githubRepoOwner is required for GitHub project mappings",
              ImporterType.Github)
          )
          _ <- validate(
            mapping.githubRepoName.isDefined,
            ConfigErrorResponses.validationFailed(
              "githubRepoName",
              "githubRepoName is required for GitHub project mappings",
              ImporterType.Github)
          )
          _ <- validate(
            mapping.githubTagConfig.isDefined,
            ConfigErrorResponses.validationFailed(
              "githubTagConfig",
              "githubTagConfig is required for GitHub project mappings",
              ImporterType.Github)
          )
        } yield Ok
    }
  }

  private def testConnectivityForType(
      config: CreateIssueImporterConfig)(implicit
      ec: ExecutionContext): Future[services.ConnectivityTestResult] = {
    val service = ExternalProjectService.forType(config.importerType, wsClient)
    service.testConnectivity(config)
  }

  private def listProjectsForConfig(config: IssueImporterConfig)(implicit
      ec: ExecutionContext): Future[ListProjectsResponse] = {
    val service = ExternalProjectService.forType(config.importerType, wsClient)
    service.listProjects(config)
  }

  /** Converts a domain config to CreateIssueImporterConfig DTO for testing
    * connectivity.
    */
  private def configToCreateDTO(
      config: IssueImporterConfig): CreateIssueImporterConfig = {
    config match {
      case c: GitlabConfig =>
        CreateIssueImporterConfig(
          importerType = ImporterType.Gitlab,
          name = c.name,
          baseUrl = c.baseUrl,
          checkFrequency = c.settings.checkFrequency,
          accessToken = Some(c.auth.accessToken)
        )

      case c: JiraConfig =>
        CreateIssueImporterConfig(
          importerType = ImporterType.Jira,
          name = c.name,
          baseUrl = c.baseUrl,
          checkFrequency = c.settings.checkFrequency,
          consumerKey = Some(c.auth.consumerKey),
          privateKey = Some(c.auth.privateKey),
          accessToken = Some(c.auth.accessToken)
        )

      case c: PlaneConfig =>
        CreateIssueImporterConfig(
          importerType = ImporterType.Plane,
          name = c.name,
          baseUrl = c.baseUrl,
          checkFrequency = c.settings.checkFrequency,
          apiKey = Some(c.auth.apiKey)
        )

      case c: GithubConfig =>
        CreateIssueImporterConfig(
          importerType = ImporterType.Github,
          name = c.name,
          baseUrl = c.baseUrl,
          checkFrequency = c.settings.checkFrequency,
          accessToken = Some(c.auth.accessToken),
          resourceOwner = c.auth.resourceOwner,
          resourceOwnerType = c.auth.resourceOwnerType
        )
    }
  }

  // ===== Scheduler Management =====

  /** Starts schedulers for all project mappings in a config. Called after
    * creating a new config.
    */
  private def startSchedulersForConfig(config: IssueImporterConfig): Unit = {
    systemServices.pluginHandler ! PluginHandler.StartConfigSchedulers(config)
  }

  /** Starts a scheduler for a single project mapping. Called after adding a
    * project mapping to an existing config.
    */
  private def startSchedulerForProject(config: IssueImporterConfig,
                                       projectId: ProjectId): Unit = {
    systemServices.pluginHandler ! PluginHandler.StartProjectScheduler(
      config.importerType,
      config,
      projectId
    )
  }

  /** Stops scheduler for a single project mapping. Called after removing a
    * project mapping.
    */
  private def stopSchedulerForProject(config: IssueImporterConfig,
                                      projectId: ProjectId): Unit = {
    systemServices.pluginHandler ! PluginHandler.StopProjectScheduler(
      config.importerType,
      config.id,
      projectId
    )
  }

  /** Stops all schedulers for a config. Called before updating config with
    * credential/connection changes.
    */
  private def stopSchedulersForConfig(config: IssueImporterConfig): Unit = {
    systemServices.pluginHandler ! PluginHandler.StopConfigSchedulers(
      config.importerType,
      config.id
    )
  }

  /** Determines if an update requires scheduler restart. Returns true if any of
    * the following fields are being updated: - baseUrl (API endpoint changes) -
    * checkFrequency (polling interval changes) - Any authentication credentials
    * (accessToken, consumerKey, privateKey, apiKey, resourceOwner)
    */
  private def requiresSchedulerRestart(
      update: UpdateIssueImporterConfig): Boolean = {
    update.baseUrl.isDefined ||
    update.checkFrequency.isDefined ||
    update.accessToken.isDefined ||
    update.consumerKey.isDefined ||
    update.privateKey.isDefined ||
    update.apiKey.isDefined ||
    update.resourceOwner.isDefined ||
    update.resourceOwnerType.isDefined
  }
}
