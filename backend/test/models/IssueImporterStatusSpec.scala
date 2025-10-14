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

import org.joda.time.DateTime
import org.specs2.mutable.Specification
import play.api.libs.json.{JsString, Json}

import java.util.UUID

class IssueImporterStatusSpec extends Specification {

  "IssueImporterConfigId" should {

    "serialize as plain UUID string" in {
      val uuid = UUID.fromString("123e4567-e89b-12d3-a456-426614174000")
      val id   = IssueImporterConfigId(uuid)
      val json = Json.toJson(id)

      // Should be plain string "123e4567-e89b-12d3-a456-426614174000"
      json must equalTo(JsString("123e4567-e89b-12d3-a456-426614174000"))
    }

    "deserialize from plain UUID string" in {
      val json = JsString("123e4567-e89b-12d3-a456-426614174000")
      val id   = json.as[IssueImporterConfigId]

      id.value.toString must equalTo("123e4567-e89b-12d3-a456-426614174000")
    }
  }

  "ConnectivityStatus" should {

    "serialize and deserialize to/from JSON correctly" in {
      val status: ConnectivityStatus = ConnectivityStatus.Healthy
      val json                       = Json.toJson(status)
      json.as[String] must equalTo("healthy")

      val deserialized = json.as[ConnectivityStatus]
      deserialized must equalTo(ConnectivityStatus.Healthy)
    }

    "parse from string correctly" in {
      ConnectivityStatus.fromString("healthy") must equalTo(
        ConnectivityStatus.Healthy)
      ConnectivityStatus.fromString("degraded") must equalTo(
        ConnectivityStatus.Degraded)
      ConnectivityStatus.fromString("failed") must equalTo(
        ConnectivityStatus.Failed)
      ConnectivityStatus.fromString("unknown") must equalTo(
        ConnectivityStatus.Unknown)
      ConnectivityStatus.fromString("invalid") must equalTo(
        ConnectivityStatus.Unknown)
    }
  }

  "ConnectivityIssue" should {

    "serialize and deserialize to/from JSON correctly" in {
      val issue = ConnectivityIssue(
        errorCode = "authentication_failed",
        message = "Invalid access token",
        timestamp = DateTime.now(),
        httpStatus = Some(401),
        retryCount = 0
      )

      val json = Json.toJson(issue)
      (json \ "errorCode").as[String] must equalTo("authentication_failed")
      (json \ "message").as[String] must equalTo("Invalid access token")
      (json \ "httpStatus").as[Int] must equalTo(401)
      (json \ "retryCount").as[Int] must equalTo(0)

      val deserialized = json.as[ConnectivityIssue]
      deserialized.errorCode must equalTo(issue.errorCode)
      deserialized.message must equalTo(issue.message)
      deserialized.httpStatus must equalTo(issue.httpStatus)
      deserialized.retryCount must equalTo(issue.retryCount)
    }

    "handle missing optional fields" in {
      val issue = ConnectivityIssue(
        errorCode = "timeout",
        message = "Request timed out",
        timestamp = DateTime.now(),
        httpStatus = None,
        retryCount = 0
      )

      val json         = Json.toJson(issue)
      val deserialized = json.as[ConnectivityIssue]
      deserialized.httpStatus must beNone
    }
  }

  "ProjectSyncStats" should {

    "serialize and deserialize to/from JSON correctly" in {
      val stats = ProjectSyncStats(
        projectId = ProjectId(),
        projectName = "Test Project",
        lastSyncAt = Some(DateTime.now()),
        lastSyncIssueCount = 15,
        totalIssuesSynced = 100,
        consecutiveFailures = 0,
        lastError = None
      )

      val json = Json.toJson(stats)
      (json \ "projectName").as[String] must equalTo("Test Project")
      (json \ "lastSyncIssueCount").as[Int] must equalTo(15)
      (json \ "totalIssuesSynced").as[Int] must equalTo(100)
      (json \ "consecutiveFailures").as[Int] must equalTo(0)

      val deserialized = json.as[ProjectSyncStats]
      deserialized.projectName must equalTo(stats.projectName)
      deserialized.lastSyncIssueCount must equalTo(stats.lastSyncIssueCount)
      deserialized.totalIssuesSynced must equalTo(stats.totalIssuesSynced)
      deserialized.consecutiveFailures must equalTo(stats.consecutiveFailures)
    }

    "track consecutive failures correctly" in {
      val stats = ProjectSyncStats(
        projectId = ProjectId(),
        projectName = "Test Project",
        lastSyncAt = Some(DateTime.now()),
        lastSyncIssueCount = 0,
        totalIssuesSynced = 100,
        consecutiveFailures = 5,
        lastError = Some(
          ConnectivityIssue(
            errorCode = "timeout",
            message = "Request timed out",
            timestamp = DateTime.now(),
            httpStatus = None,
            retryCount = 0
          )
        )
      )

      stats.consecutiveFailures must equalTo(5)
      stats.lastError must beSome
      stats.lastError.get.errorCode must equalTo("timeout")
    }
  }

  "ConfigSyncStatus" should {

    "serialize and deserialize to/from JSON correctly" in {
      val syncStatus = ConfigSyncStatus(
        connectivityStatus = ConnectivityStatus.Healthy,
        lastConnectivityCheck = Some(DateTime.now()),
        currentIssue = None,
        projectStats = Seq(
          ProjectSyncStats(
            projectId = ProjectId(),
            projectName = "Project 1",
            lastSyncAt = Some(DateTime.now()),
            lastSyncIssueCount = 10,
            totalIssuesSynced = 100,
            consecutiveFailures = 0,
            lastError = None
          )
        ),
        totalProjectsMapped = 1,
        totalIssuesSynced = 100L,
        lastSuccessfulSync = Some(DateTime.now()),
        nextScheduledSync = None
      )

      val json = Json.toJson(syncStatus)
      (json \ "connectivityStatus").as[String] must equalTo("healthy")
      (json \ "totalProjectsMapped").as[Int] must equalTo(1)
      (json \ "totalIssuesSynced").as[Long] must equalTo(100L)

      val deserialized = json.as[ConfigSyncStatus]
      deserialized.connectivityStatus must equalTo(ConnectivityStatus.Healthy)
      deserialized.totalProjectsMapped must equalTo(1)
      deserialized.totalIssuesSynced must equalTo(100L)
      deserialized.projectStats.size must equalTo(1)
    }

    "create empty status correctly" in {
      val empty = ConfigSyncStatus.empty

      empty.connectivityStatus must equalTo(ConnectivityStatus.Unknown)
      empty.lastConnectivityCheck must beNone
      empty.currentIssue must beNone
      empty.projectStats must beEmpty
      empty.totalProjectsMapped must equalTo(0)
      empty.totalIssuesSynced must equalTo(0L)
      empty.lastSuccessfulSync must beNone
      empty.nextScheduledSync must beNone
    }

    "track failed status with issue" in {
      val issue = ConnectivityIssue(
        errorCode = "authentication_failed",
        message = "Invalid token",
        timestamp = DateTime.now(),
        httpStatus = Some(401),
        retryCount = 0
      )

      val syncStatus = ConfigSyncStatus.empty.copy(
        connectivityStatus = ConnectivityStatus.Failed,
        currentIssue = Some(issue)
      )

      syncStatus.connectivityStatus must equalTo(ConnectivityStatus.Failed)
      syncStatus.currentIssue must beSome
      syncStatus.currentIssue.get.errorCode must equalTo(
        "authentication_failed")
    }

    "calculate aggregate statistics from project stats" in {
      val projectStats = Seq(
        ProjectSyncStats(
          projectId = ProjectId(),
          projectName = "Project 1",
          lastSyncAt = Some(DateTime.now()),
          lastSyncIssueCount = 10,
          totalIssuesSynced = 100,
          consecutiveFailures = 0,
          lastError = None
        ),
        ProjectSyncStats(
          projectId = ProjectId(),
          projectName = "Project 2",
          lastSyncAt = Some(DateTime.now()),
          lastSyncIssueCount = 20,
          totalIssuesSynced = 200,
          consecutiveFailures = 0,
          lastError = None
        )
      )

      val syncStatus = ConfigSyncStatus.empty.copy(
        projectStats = projectStats,
        totalProjectsMapped = 2,
        totalIssuesSynced = 300L // 100 + 200
      )

      syncStatus.totalProjectsMapped must equalTo(2)
      syncStatus.totalIssuesSynced must equalTo(300L)
      syncStatus.projectStats.size must equalTo(2)
    }
  }
}
