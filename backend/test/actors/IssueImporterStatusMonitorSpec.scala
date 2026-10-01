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

package actors

import actors.IssueImporterStatusMonitor.{
  UpdateConnectivityStatus,
  UpdateProjectSyncStats
}
import core.{DBSession, MockServices}
import models._
import mongo.EmbedMongo
import org.apache.pekko.actor.ActorRef
import org.mockito.Mockito.when
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.specs2.mock.Mockito
import org.specs2.mutable.Specification
import pekko.ActorTestScope
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json.Writes
import repositories.{IssueImporterConfigRepository, UserRepository}

import java.net.URI
import java.util.concurrent.atomic.AtomicReference
import scala.concurrent.Future
import scala.concurrent.duration._

class IssueImporterStatusMonitorSpec
    extends Specification
    with Mockito
    with EmbedMongo {
  sequential

  private val organisationId = OrganisationId()

  private def planeConfig(): PlaneConfig = PlaneConfig(
    id = IssueImporterConfigId(),
    organisationReference = EntityReference(organisationId, "org"),
    name = "Plane",
    baseUrl = URI.create("https://plane.example.com").toURL,
    auth = PlaneAuth("key"),
    settings = PlaneSettings(checkFrequency = 300000L, workspace = "ws"),
    projects = Seq.empty,
    audit = AuditInfo.initial(UserId())
  )

  /** A repository that holds one config. A status write takes 100 ms, so a
    * second read during the write sees the old status.
    */
  private class StoredConfig(initial: IssueImporterConfig) {
    val config: AtomicReference[IssueImporterConfig] =
      new AtomicReference(initial)
    val repository: IssueImporterConfigRepository =
      mock[IssueImporterConfigRepository]

    when(
      repository.findById(any[IssueImporterConfigId])(
        any[IssueImporterConfigId => JsValueWrapper],
        any[DBSession]))
      .thenAnswer(new Answer[Future[Option[IssueImporterConfig]]] {
        override def answer(
            invocation: InvocationOnMock): Future[Option[IssueImporterConfig]] =
          Future.successful(Some(config.get()))
      })

    when(
      repository.updateSyncStatus(any[IssueImporterConfigId],
                                  any[ConfigSyncStatus])(any[DBSession]))
      .thenAnswer(new Answer[Future[Boolean]] {
        override def answer(invocation: InvocationOnMock): Future[Boolean] = {
          val syncStatus = invocation.getArgument[ConfigSyncStatus](1)
          Future {
            Thread.sleep(100)
            config.updateAndGet {
              case c: PlaneConfig => c.copy(syncStatus = syncStatus)
              case c              => c
            }
            true
          }
        }
      })
  }

  private def monitor(scope: ActorTestScope,
                      repository: IssueImporterConfigRepository): ActorRef =
    scope.system.actorOf(
      IssueImporterStatusMonitor.props(repository,
                                       mock[UserRepository],
                                       mock[ClientReceiver],
                                       new MockServices(scope.system),
                                       reactiveMongoApi))

  "IssueImporterStatusMonitor" should {
    "write only the sync status of the config" in new ActorTestScope {
      private val stored = new StoredConfig(planeConfig())
      private val config = stored.config.get()

      monitor(this, stored.repository) ! UpdateConnectivityStatus(
        config.id,
        organisationId,
        ConnectivityStatus.Healthy,
        None)

      awaitAssert(
        stored.config.get().syncStatus.connectivityStatus must equalTo(
          ConnectivityStatus.Healthy),
        3.seconds)
      there.was(
        no(stored.repository).upsert(any[IssueImporterConfig])(
          any[Writes[IssueImporterConfigId]],
          any[DBSession]))
    }

    "apply each update to the status that the previous update wrote" in new ActorTestScope {
      private val stored     = new StoredConfig(planeConfig())
      private val config     = stored.config.get()
      private val first      = ProjectId()
      private val second     = ProjectId()
      private val statusActor = monitor(this, stored.repository)

      statusActor ! UpdateProjectSyncStats(config.id,
                                           organisationId,
                                           first,
                                           "First",
                                           issueCount = 3,
                                           success = true)
      statusActor ! UpdateProjectSyncStats(config.id,
                                           organisationId,
                                           second,
                                           "Second",
                                           issueCount = 4,
                                           success = true)

      awaitAssert(
        stored.config
          .get()
          .syncStatus
          .projectStats
          .map(_.projectId) must containTheSameElementsAs(Seq(first, second)),
        3.seconds)
    }
  }
}
