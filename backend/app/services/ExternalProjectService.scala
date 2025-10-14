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

import models._
import play.api.libs.ws.WSClient

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}

/** Service for interacting with external issue tracking systems.
  */
trait ExternalProjectService {

  /** Test connectivity to the external service.
    *
    * @param config
    *   Configuration to test
    * @return
    *   ConnectivityTestResult with success status and message
    */
  def testConnectivity(
      config: CreateIssueImporterConfig): Future[ConnectivityTestResult]

  /** List projects/repositories from the external service.
    *
    * @param config
    *   Configuration with credentials
    * @return
    *   Sequence of external projects
    */
  def listProjects(config: IssueImporterConfig): Future[ListProjectsResponse]

  // Configuration constants
  protected val ConnectivityTestTimeout: FiniteDuration = 10000.millis
  protected val ProjectListTimeout: FiniteDuration      = 30000.millis

  /** Helper method to handle common connectivity errors.
    *
    * @param platformName
    *   Name of the platform (e.g., "GitLab", "GitHub")
    * @param f
    *   Future operation to wrap with error handling
    * @return
    *   Future with standardized error handling
    */
  protected def handleConnectivityErrors(platformName: String)(
      f: => Future[ConnectivityTestResult])(implicit
      ec: ExecutionContext): Future[ConnectivityTestResult] = {
    f.recover {
      case e: java.net.UnknownHostException =>
        ConnectivityTestResult(
          success = false,
          message = s"Cannot reach $platformName server: ${e.getMessage}",
          errorCode = Some("unknown_host")
        )
      case e: java.util.concurrent.TimeoutException =>
        ConnectivityTestResult(
          success = false,
          message = "Connection timeout: Server took too long to respond",
          errorCode = Some("timeout")
        )
      case e: Exception =>
        ConnectivityTestResult(
          success = false,
          message = s"Connection error: ${e.getMessage}",
          errorCode = Some("connection_error")
        )
    }
  }

  /** Helper method to validate base URL format.
    *
    * @param url
    *   URL to validate
    * @return
    *   Right(url) if valid, Left(error message) if invalid
    */
  protected def validateBaseUrl(
      url: java.net.URL): Either[String, java.net.URL] = {
    val protocol = url.getProtocol
    if (protocol == "http" || protocol == "https") {
      Right(url)
    } else {
      Left(s"Invalid protocol: $protocol. Must be http or https")
    }
  }

  /** Helper method to create standardized success result.
    *
    * @param platformName
    *   Name of the platform
    * @return
    *   Success ConnectivityTestResult
    */
  protected def successResult(platformName: String): ConnectivityTestResult = {
    ConnectivityTestResult(
      success = true,
      message = s"Successfully connected to $platformName"
    )
  }

  /** Helper method to create standardized authentication failure result.
    *
    * @param credentialType
    *   Type of credential (e.g., "access token", "API key", "OAuth
    *   credentials")
    * @return
    *   Failure ConnectivityTestResult
    */
  protected def authenticationFailedResult(
      credentialType: String): ConnectivityTestResult = {
    ConnectivityTestResult(
      success = false,
      message = s"Authentication failed: Invalid $credentialType",
      errorCode = Some("authentication_failed")
    )
  }

  /** Helper method to create standardized connection failure result.
    *
    * @param status
    *   HTTP status code
    * @param statusText
    *   HTTP status text
    * @return
    *   Failure ConnectivityTestResult
    */
  protected def connectionFailedResult(
      status: Int,
      statusText: String): ConnectivityTestResult = {
    ConnectivityTestResult(
      success = false,
      message = s"Connection failed with status $status: $statusText",
      errorCode = Some("connection_failed")
    )
  }
}

/** Result of connectivity test.
  */
case class ConnectivityTestResult(
    success: Boolean,
    message: String,
    errorCode: Option[String] = None
)

object ExternalProjectService {

  /** Factory method to get the appropriate service for an importer type.
    */
  def forType(importerType: ImporterType, wsClient: WSClient)(implicit
      ec: ExecutionContext): ExternalProjectService = {
    importerType match {
      case ImporterType.Gitlab => new GitlabProjectService(wsClient)
      case ImporterType.Jira   => new JiraProjectService(wsClient)
      case ImporterType.Plane  => new PlaneProjectService(wsClient)
      case ImporterType.Github => new GithubProjectService(wsClient)
    }
  }
}
