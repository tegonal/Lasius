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

package repositories

import models._
import mongo.EmbedMongo

import java.net.URI

class IssueImporterConfigRepositorySpec extends EmbedMongo {

  val repository = new IssueImporterConfigMongoRepository()

  private def mapping(planeProjectId: String): PlaneProjectMapping =
    PlaneProjectMapping(
      projectId = ProjectId(),
      settings = PlaneProjectSettings(
        planeProjectId = planeProjectId,
        maxResults = None,
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

  "IssueImporterConfigRepository updateSyncStatus" should {
    "write the sync status and keep a mapping that another write added" in {
      val read = PlaneConfig(
        id = IssueImporterConfigId(),
        organisationReference = EntityReference(OrganisationId(), "org"),
        name = "Plane",
        baseUrl = URI.create("https://plane.example.com").toURL,
        auth = PlaneAuth("key"),
        settings = PlaneSettings(checkFrequency = 300000L, workspace = "ws"),
        projects = Seq(mapping("first")),
        audit = AuditInfo.initial(UserId())
      )
      val edited = read.copy(projects = read.projects :+ mapping("second"))
      val syncStatus = ConfigSyncStatus.empty.copy(
        connectivityStatus = ConnectivityStatus.Healthy,
        totalIssuesSynced = 7L)

      // The status comes from the first read, and the mapping edit lands
      // before the status write.
      val stored = withDBSession() { implicit dbSession =>
        for {
          _      <- repository.upsert(read)
          _      <- repository.upsert(edited)
          _      <- repository.updateSyncStatus(read.id, syncStatus)
          stored <- repository.findById(read.id)
        } yield stored
      }.awaitResult()

      stored must beSome[IssueImporterConfig].like { case c: PlaneConfig =>
        c.syncStatus must equalTo(syncStatus)
        c.projects.map(_.id) must equalTo(edited.projects.map(_.id))
      }
    }
  }
}
