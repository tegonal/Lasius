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

package services

import actors.scheduler.ServiceConfiguration
import models._
import play.api.libs.json.JsArray
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

/** Service for GitHub API interactions.
  */
class GithubProjectService(wsClient: WSClient)(implicit ec: ExecutionContext)
    extends ExternalProjectService {

  /** Lists available resource owners (user + organizations) for the given
    * token. This helps users select the correct resource owner when creating
    * org-scoped tokens.
    *
    * Note: Fine-grained tokens don't populate /user/orgs (returns empty array).
    * Instead, we infer resource owners by listing repositories the token can
    * access and extracting unique owners.
    *
    * For organization-scoped tokens, /user/repos only returns repos where the
    * authenticated user is a direct collaborator, NOT the org's repos. We use
    * the affiliation parameter to try to capture all accessible repos.
    */
  def listResourceOwners(baseUrl: String,
                         accessToken: String): Future[Seq[ExternalProject]] = {
    val userUrl = baseUrl + "/user"
    // Use affiliation=owner,collaborator,organization_member to get all types
    val initialReposUrl =
      baseUrl + "/user/repos?per_page=100&affiliation=owner,collaborator,organization_member"

    // Fetch all repository pages to discover all resource owners
    def fetchAllRepos(url: String,
                      accumulated: Seq[play.api.libs.json.JsValue] = Seq.empty)
        : Future[Seq[play.api.libs.json.JsValue]] = {
      wsClient
        .url(url)
        .addHttpHeaders("Authorization" -> s"Bearer $accessToken")
        .withRequestTimeout(ConnectivityTestTimeout)
        .get()
        .flatMap { response =>
          val repos    = response.json.as[JsArray].value
          val allRepos = accumulated ++ repos

          // Check for next page in Link header
          response.header("Link") match {
            case Some(linkHeader) =>
              val nextPageRegex = """<([^>]+)>;\s*rel="next"""".r
              nextPageRegex.findFirstMatchIn(linkHeader) match {
                case Some(m) =>
                  val nextUrl = m.group(1)
                  fetchAllRepos(nextUrl, allRepos)
                case None =>
                  Future.successful(allRepos)
              }
            case None =>
              Future.successful(allRepos)
          }
        }
    }

    for {
      // Fetch authenticated user info
      userResponse <- wsClient
        .url(userUrl)
        .addHttpHeaders("Authorization" -> s"Bearer $accessToken")
        .withRequestTimeout(ConnectivityTestTimeout)
        .get()

      // Fetch all repositories accessible to this token (with pagination)
      // This includes owner, collaborator, and organization_member repos
      allRepos <- fetchAllRepos(initialReposUrl)
    } yield {
      val username = (userResponse.json \ "login").as[String]

      // Extract unique owners from repositories with their types
      val owners = allRepos
        .flatMap { repo =>
          val ownerObj = repo \ "owner"
          for {
            login     <- (ownerObj \ "login").asOpt[String]
            ownerType <- (ownerObj \ "type")
              .asOpt[String]
              .orElse(Some("User")) // fallback to User if type missing
          } yield (login, ownerType)
        }
        .groupBy(_._1) // group by login to deduplicate
        .map { case (login, entries) =>
          // Take the first type (they should all be the same for a given login)
          (login, entries.head._2)
        }
        .toSeq

      // Build resource owner list with correct type labels
      val resourceOwners = owners.map { case (owner, ownerType) =>
        val label = ownerType match {
          case "Organization" => s"$owner (Organization)"
          case "User"         => s"$owner (Personal Account)"
          case _              => s"$owner (${ownerType})"
        }
        ExternalProject(owner, label, Some(ownerType))
      }

      // If no repos found, at least return the authenticated user
      if (resourceOwners.isEmpty) {
        Seq(
          ExternalProject(username,
                          s"$username (Personal Account)",
                          Some("User")))
      } else {
        resourceOwners
      }
    }
  }

  override def testConnectivity(
      config: CreateIssueImporterConfig): Future[ConnectivityTestResult] = {
    val serviceConfig = ServiceConfiguration(config.baseUrl.toString)
    val testUrl       = serviceConfig.baseUrl + "/user"

    handleConnectivityErrors("GitHub") {
      wsClient
        .url(testUrl)
        .addHttpHeaders("Authorization" -> s"Bearer ${config.accessToken.get}")
        .withRequestTimeout(ConnectivityTestTimeout)
        .get()
        .map { response =>
          response.status match {
            case 200       => successResult("GitHub")
            case 401 | 403 => authenticationFailedResult("access token")
            case status => connectionFailedResult(status, response.statusText)
          }
        }
    }
  }

  override def listProjects(
      config: IssueImporterConfig): Future[ListProjectsResponse] = {
    config match {
      case c: GithubConfig =>
        listGithubRepositories(c).map { projects =>
          ListProjectsResponse(projects = Some(projects))
        }
      case _ =>
        Future.failed(
          new IllegalArgumentException(
            "GithubProjectService requires GithubConfig"))
    }
  }

  private def listGithubRepositories(
      config: GithubConfig): Future[Seq[ExternalProject]] = {
    // Determine the correct endpoint based on resourceOwner and resourceOwnerType
    val initialReposUrl =
      (config.auth.resourceOwner, config.auth.resourceOwnerType) match {
        case (Some(owner), Some("Organization")) =>
          // Organization: use /orgs/{org}/repos
          config.baseUrl.toString + s"/orgs/$owner/repos?per_page=100"
        case (Some(user), Some("User")) =>
          // Specific user: use /users/{user}/repos (shows public repos)
          // Better: use /user/repos with affiliation to get all accessible repos
          config.baseUrl.toString + "/user/repos?per_page=100&affiliation=owner,collaborator"
        case (Some(owner), _) =>
          // Fallback: no type specified, assume organization for backward compatibility
          config.baseUrl.toString + s"/orgs/$owner/repos?per_page=100"
        case (None, _) =>
          // User-scoped token: use /user/repos
          config.baseUrl.toString + "/user/repos?per_page=100&affiliation=owner,collaborator"
      }

    // Debug: log which config/token is being used
    val tokenSuffix = config.auth.accessToken.takeRight(8)
    val scopeInfo   = config.auth.resourceOwner match {
      case Some(org) => s"org-scoped ($org)"
      case None      => "user-scoped"
    }
    play.api
      .Logger(getClass)
      .debug(
        s"Fetching GitHub repos for config ${config.id.value} (token ends: ...${tokenSuffix}, $scopeInfo)")

    // First, fetch user info to see which GitHub account this token belongs to
    val userUrl = config.baseUrl.toString + "/user"
    wsClient
      .url(userUrl)
      .addHttpHeaders("Authorization" -> s"Bearer ${config.auth.accessToken}")
      .withRequestTimeout(ProjectListTimeout)
      .get()
      .flatMap { userResponse =>
        val githubUsername =
          (userResponse.json \ "login").asOpt[String].getOrElse("unknown")
        play.api
          .Logger(getClass)
          .debug(
            s"Config ${config.id.value} authenticated as GitHub user: ${githubUsername}")

        // GitHub uses Link headers for pagination (RFC 5988)
        def fetchPage(url: String,
                      accumulated: Seq[ExternalProject] = Seq.empty)
            : Future[Seq[ExternalProject]] = {
          wsClient
            .url(url)
            .addHttpHeaders(
              "Authorization" -> s"Bearer ${config.auth.accessToken}")
            .withRequestTimeout(ProjectListTimeout)
            .get()
            .flatMap { response =>
              response.status match {
                case 200 =>
                  val repos = (response.json.as[JsArray].value).map { repo =>
                    val fullName = (repo \ "full_name").as[String]
                    val name     = (repo \ "name").as[String]
                    ExternalProject(fullName, name)
                  }
                  val allRepos = accumulated ++ repos

                  // Check for next page in Link header
                  response.header("Link") match {
                    case Some(linkHeader) =>
                      // Parse Link header: <url>; rel="next"
                      val nextPageRegex = """<([^>]+)>;\s*rel="next"""".r
                      nextPageRegex.findFirstMatchIn(linkHeader) match {
                        case Some(m) =>
                          val nextUrl = m.group(1)
                          fetchPage(nextUrl, allRepos)
                        case None =>
                          Future.successful(allRepos)
                      }
                    case None =>
                      Future.successful(allRepos)
                  }

                case _ =>
                  throw new Exception(
                    s"Failed to fetch GitHub repositories: HTTP ${response.status}")
              }
            }
        }

        // Fetch all pages and enrich with labels
        fetchPage(initialReposUrl).flatMap { repos =>
          // Debug: Log all repo names
          val repoNames = repos.map(_.id).mkString(", ")
          play.api
            .Logger(getClass)
            .debug(
              s"Config ${config.id.value} (user: ${githubUsername}) returned ${repos.size} repos: ${repoNames}")

          // Debug: Log token type
          val tokenType =
            if (config.auth.accessToken.startsWith("github_pat_")) {
              "fine-grained"
            } else if (config.auth.accessToken.startsWith("ghp_")) {
              "classic"
            } else {
              "unknown"
            }
          play.api
            .Logger(getClass)
            .debug(s"Config ${config.id.value} token type: ${tokenType}")

          // Enrich each repository with available labels
          Future
            .sequence(repos.map { repo =>
              enrichProjectWithLabels(config, repo)
            })
            .map(_.sortBy(_.name))
        }
      }
  }

  private def enrichProjectWithLabels(
      config: GithubConfig,
      project: ExternalProject): Future[ExternalProject] = {
    fetchProjectLabels(config, project.id).map { labels =>
      project.copy(
        availableLabels = if (labels.nonEmpty) Some(labels) else None,
        availableStates =
          Some(Seq("open", "closed", "all")) // GitHub fixed states
      )
    }
  }

  private def fetchProjectLabels(config: GithubConfig,
                                 repoFullName: String): Future[Seq[String]] = {
    val labelsUrl =
      s"${config.baseUrl}/repos/$repoFullName/labels?per_page=100"

    wsClient
      .url(labelsUrl)
      .addHttpHeaders("Authorization" -> s"Bearer ${config.auth.accessToken}")
      .withRequestTimeout(ProjectListTimeout)
      .get()
      .map { response =>
        response.status match {
          case 200 =>
            response.json
              .as[JsArray]
              .value
              .map(label => (label \ "name").as[String])
              .toSeq
          case _ => Seq.empty // Gracefully handle failures
        }
      }
      .recover { case _ => Seq.empty } // Gracefully handle errors
  }
}
