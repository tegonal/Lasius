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

package models

import models.BaseFormat._
import org.joda.time.DateTime
import play.api.libs.json._

/** Represents the connectivity status of an issue importer configuration */
sealed trait ConnectivityStatus {
  def value: String
}

object ConnectivityStatus {
  case object Healthy extends ConnectivityStatus {
    val value = "healthy"
  }
  case object Degraded extends ConnectivityStatus {
    val value = "degraded"
  }
  case object Failed extends ConnectivityStatus {
    val value = "failed"
  }
  case object Unknown extends ConnectivityStatus {
    val value = "unknown"
  }

  def fromString(s: String): ConnectivityStatus = s.toLowerCase match {
    case "healthy"  => Healthy
    case "degraded" => Degraded
    case "failed"   => Failed
    case _          => Unknown
  }

  implicit val format: Format[ConnectivityStatus] =
    new Format[ConnectivityStatus] {
      def reads(json: JsValue): JsResult[ConnectivityStatus] =
        json.validate[String].map(fromString)
      def writes(status: ConnectivityStatus): JsValue = JsString(status.value)
    }
}

/** Detailed information about a connectivity or sync issue */
case class ConnectivityIssue(
    errorCode: String,
    message: String,
    timestamp: DateTime,
    httpStatus: Option[Int] = None,
    retryCount: Int = 0
)

object ConnectivityIssue {
  implicit val format: Format[ConnectivityIssue] =
    Json.format[ConnectivityIssue]
}

/** Tracks sync activity for a specific project mapping */
case class ProjectSyncStats(
    projectId: ProjectId,
    projectName: String,
    lastSyncAt: Option[DateTime],
    lastSyncIssueCount: Int,
    totalIssuesSynced: Int,
    consecutiveFailures: Int,
    lastError: Option[ConnectivityIssue]
)

object ProjectSyncStats {
  implicit val format: Format[ProjectSyncStats] =
    Json.format[ProjectSyncStats]
}

/** Overall health and sync statistics for an issue importer config */
case class ConfigSyncStatus(
    connectivityStatus: ConnectivityStatus,
    lastConnectivityCheck: Option[DateTime],
    currentIssue: Option[ConnectivityIssue],
    projectStats: Seq[ProjectSyncStats],
    totalProjectsMapped: Int,
    totalIssuesSynced: Long,
    lastSuccessfulSync: Option[DateTime],
    nextScheduledSync: Option[DateTime]
)

object ConfigSyncStatus {
  implicit val format: Format[ConfigSyncStatus] =
    Json.format[ConfigSyncStatus]

  def empty: ConfigSyncStatus = ConfigSyncStatus(
    connectivityStatus = ConnectivityStatus.Unknown,
    lastConnectivityCheck = None,
    currentIssue = None,
    projectStats = Seq.empty,
    totalProjectsMapped = 0,
    totalIssuesSynced = 0L,
    lastSuccessfulSync = None,
    nextScheduledSync = None
  )

  def fromProjects(projects: Seq[ProjectId]): ConfigSyncStatus = {
    ConfigSyncStatus(
      connectivityStatus = ConnectivityStatus.Unknown,
      lastConnectivityCheck = None,
      currentIssue = None,
      projectStats = projects.map(pid =>
        ProjectSyncStats(
          projectId = pid,
          projectName = "Unknown",
          lastSyncAt = None,
          lastSyncIssueCount = 0,
          totalIssuesSynced = 0,
          consecutiveFailures = 0,
          lastError = None
        )),
      totalProjectsMapped = projects.size,
      totalIssuesSynced = 0L,
      lastSuccessfulSync = None,
      nextScheduledSync = None
    )
  }
}
