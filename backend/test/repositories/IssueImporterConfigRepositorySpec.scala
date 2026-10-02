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

import core.DBSession
import core.Validation.ValidationFailedException
import models._
import mongo.EmbedMongo
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json.{JsArray, JsObject, Json}
import reactivemongo.play.json.compat.json2bson._

import java.net.URI
import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.Future

class IssueImporterConfigRepositorySpec extends EmbedMongo {

  val repository = new IssueImporterConfigMongoRepository()

  /** Lets one other write land after the first read of the next call, as a
    * concurrent request does.
    */
  private class InterleavedRepository(otherWrite: DBSession => Future[_])
      extends IssueImporterConfigMongoRepository() {
    private val pending = new AtomicBoolean(true)

    override def findById(id: IssueImporterConfigId)(implicit
        fact: IssueImporterConfigId => JsValueWrapper,
        dbSession: DBSession): Future[Option[IssueImporterConfig]] =
      super.findById(id).flatMap { config =>
        if (pending.getAndSet(false)) otherWrite(dbSession).map(_ => config)
        else Future.successful(config)
      }
  }

  private val firstProject  = ProjectId()
  private val secondProject = ProjectId()

  private val noTags =
    PlaneTagConfiguration(useLabels = false, labelFilter = Set.empty)

  private def mapping(projectId: ProjectId,
                      planeProjectId: String): PlaneProjectMapping =
    PlaneProjectMapping(projectId = projectId,
                        settings =
                          PlaneProjectSettings(planeProjectId = planeProjectId,
                                               tagConfiguration = noTags))

  private def addRequest(projectId: ProjectId,
                         planeProjectId: String,
                         tags: PlaneTagConfiguration = noTags) =
    CreateProjectMapping(projectId = projectId,
                         planeProjectId = Some(planeProjectId),
                         planeTagConfig = Some(tags))

  private def storedConfig(mappings: PlaneProjectMapping*): PlaneConfig = {
    val config = PlaneConfig(
      id = IssueImporterConfigId(),
      organisationReference = EntityReference(OrganisationId(), "org"),
      name = "Plane",
      baseUrl = URI.create("https://plane.example.com").toURL,
      auth = PlaneAuth("key"),
      settings = PlaneSettings(checkFrequency = 300000L, workspace = "ws"),
      projects = mappings,
      audit = AuditInfo.initial(UserId())
    )
    withDBSession()(implicit dbSession => repository.upsert(config))
      .awaitResult()
    config
  }

  private def reload(config: IssueImporterConfig): PlaneConfig =
    withDBSession()(implicit dbSession => repository.findById(config.id))
      .awaitResult() match {
      case Some(stored: PlaneConfig) => stored
      case other => throw new IllegalStateException(s"Unexpected $other")
    }

  private def pairs(config: PlaneConfig): Set[(ProjectId, String)] =
    config.projects.map(m => m.projectId -> m.externalProjectId).toSet

  "IssueImporterConfigRepository addProjectMapping" should {
    "append a mapping for a new pair of projects" in {
      val config = storedConfig(mapping(firstProject, "plane-1"))

      val saved = withDBSession()(implicit dbSession =>
        repository.addProjectMapping(config.id,
                                     addRequest(secondProject, "plane-2")))
        .awaitResult()

      pairs(reload(config)) must equalTo(
        Set(firstProject -> "plane-1", secondProject -> "plane-2"))
      saved.config.mapping(saved.mappingId).map(_.projectId) must beSome(
        secondProject)
    }

    "give an existing pair the new settings and keep its mapping id" in {
      val existing = mapping(firstProject, "plane-1")
      val config   = storedConfig(existing)
      val newTags  = noTags.copy(useTitle = true)

      val saved = withDBSession()(implicit dbSession =>
        repository.addProjectMapping(config.id,
                                     addRequest(firstProject,
                                                "plane-1",
                                                newTags))).awaitResult()

      saved.mappingId must equalTo(existing.id)
      reload(config).projects.map(m =>
        m.id -> m.settings.tagConfiguration) must equalTo(
        Seq(existing.id -> newTags))
    }

    "keep a mapping that another request added in the meantime" in {
      val config      = storedConfig(mapping(firstProject, "plane-1"))
      val interleaved = new InterleavedRepository(implicit dbSession =>
        repository.addProjectMapping(config.id,
                                     addRequest(secondProject, "plane-3")))

      withDBSession()(implicit dbSession =>
        interleaved.addProjectMapping(config.id,
                                      addRequest(secondProject, "plane-2")))
        .awaitResult()

      pairs(reload(config)) must equalTo(
        Set(firstProject  -> "plane-1",
            secondProject -> "plane-3",
            secondProject -> "plane-2"))
    }
  }

  "IssueImporterConfigRepository updateProjectMapping" should {
    "change the settings of one mapping and keep a mapping added in the meantime" in {
      val existing    = mapping(firstProject, "plane-1")
      val config      = storedConfig(existing)
      val newTags     = noTags.copy(useTitle = true)
      val interleaved = new InterleavedRepository(implicit dbSession =>
        repository.addProjectMapping(config.id,
                                     addRequest(secondProject, "plane-2")))

      val updated = withDBSession()(implicit dbSession =>
        interleaved.updateProjectMapping(config.id,
                                         existing.id,
                                         UpdateProjectMapping(planeTagConfig =
                                           Some(newTags))))
        .awaitResult()

      updated must beSome[IssueImporterConfig]
      val stored = reload(config)
      pairs(stored) must equalTo(
        Set(firstProject -> "plane-1", secondProject -> "plane-2"))
      stored.projects
        .find(_.id == existing.id)
        .map(_.settings.tagConfiguration) must beSome(newTags)
    }

    "answer None for an unknown mapping id" in {
      val config = storedConfig(mapping(firstProject, "plane-1"))

      withDBSession()(implicit dbSession =>
        repository.updateProjectMapping(config.id,
                                        ProjectMappingId(),
                                        UpdateProjectMapping()))
        .awaitResult() must beNone
    }

    "reject a change to the pair of projects of another mapping" in {
      val moved  = mapping(firstProject, "plane-1")
      val config = storedConfig(moved, mapping(firstProject, "plane-2"))

      withDBSession()(implicit dbSession =>
        repository.updateProjectMapping(config.id,
                                        moved.id,
                                        UpdateProjectMapping(planeProjectId =
                                          Some("plane-2"))))
        .awaitResult() must throwA[ValidationFailedException]
      pairs(reload(config)) must equalTo(
        Set(firstProject -> "plane-1", firstProject -> "plane-2"))
    }
  }

  "IssueImporterConfigRepository removeProjectMapping" should {
    "remove one mapping and keep the others" in {
      val removed = mapping(firstProject, "plane-1")
      val config  = storedConfig(removed, mapping(secondProject, "plane-2"))

      withDBSession()(implicit dbSession =>
        repository.removeProjectMapping(config.id, removed.id))
        .awaitResult() must beSome[IssueImporterConfig]

      pairs(reload(config)) must equalTo(Set(secondProject -> "plane-2"))
    }

    "answer None for an unknown mapping id" in {
      val config = storedConfig(mapping(firstProject, "plane-1"))

      withDBSession()(implicit dbSession =>
        repository.removeProjectMapping(config.id, ProjectMappingId()))
        .awaitResult() must beNone
      reload(config).projects must haveSize(1)
    }
  }

  "IssueImporterConfigRepository update" should {
    "write the config fields and keep a mapping and a status written in the meantime" in {
      val config     = storedConfig(mapping(firstProject, "plane-1"))
      val syncStatus =
        ConfigSyncStatus.empty.copy(connectivityStatus =
                                      ConnectivityStatus.Healthy,
                                    totalIssuesSynced = 7L)
      val interleaved = new InterleavedRepository(implicit dbSession =>
        for {
          _ <- repository.addProjectMapping(config.id,
                                            addRequest(secondProject,
                                                       "plane-2"))
          _ <- repository.updateSyncStatus(config.id, syncStatus)
        } yield ())

      withDBSession()(implicit dbSession =>
        interleaved.update(config.id,
                           UpdateIssueImporterConfig(name = Some("Renamed")),
                           UserId())).awaitResult()

      val stored = reload(config)
      stored.name must equalTo("Renamed")
      pairs(stored) must equalTo(
        Set(firstProject -> "plane-1", secondProject -> "plane-2"))
      stored.syncStatus must equalTo(syncStatus)
    }
  }

  "IssueImporterConfigRepository updateSyncStatus" should {
    "write the sync status and keep a mapping that another write added" in {
      val config     = storedConfig(mapping(firstProject, "plane-1"))
      val syncStatus = ConfigSyncStatus.empty.copy(connectivityStatus =
                                                     ConnectivityStatus.Healthy,
                                                   totalIssuesSynced = 7L)

      withDBSession() { implicit dbSession =>
        for {
          _ <- repository.addProjectMapping(config.id,
                                            addRequest(secondProject,
                                                       "plane-2"))
          _ <- repository.updateSyncStatus(config.id, syncStatus)
        } yield ()
      }.awaitResult()

      val stored = reload(config)
      stored.syncStatus must equalTo(syncStatus)
      pairs(stored) must haveSize(2)
    }
  }

  "IssueImporterConfigRepository migrateProjectMappingIds" should {
    "store a mapping id for a mapping without one" in {
      val config    = storedConfig()
      val withoutId =
        Json.toJson(mapping(firstProject, "plane-1")).as[JsObject] - "id"
      withDBSession()(implicit dbSession =>
        repository.coll.update
          .one(Json.obj("id" -> config.id),
               Json.obj(
                 "$set" -> Json.obj("projects" -> JsArray(Seq(withoutId))))))
        .awaitResult()

      val migrated = withDBSession()(implicit dbSession =>
        repository.migrateProjectMappingIds()).awaitResult()

      migrated must equalTo(1)
      // A read of a mapping without a stored id generates a new id each time.
      reload(config).projects.map(_.id) must equalTo(
        reload(config).projects.map(_.id))
    }
  }
}
