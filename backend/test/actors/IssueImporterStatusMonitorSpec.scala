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

import actors.IssueImporterStatusMonitor.UpdateProjectSyncStats
import core.{DBSession, MockServices}
import models._
import mongo.EmbedMongo
import org.apache.pekko.actor.ActorRef
import org.joda.time.DateTime
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
  private val project        = ProjectId()

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

    def syncStatus: ConfigSyncStatus = config.get().syncStatus
  }

  private def administrators(admins: Seq[User]): UserRepository = {
    val userRepository = mock[UserRepository]
    userRepository
      .findAdministratorsByOrganisation(any[OrganisationId])(any[DBSession])
      .returns(Future.successful(admins))
    userRepository
  }

  private def monitor(
      scope: ActorTestScope,
      repository: IssueImporterConfigRepository,
      userRepository: UserRepository = administrators(Seq.empty),
      clientReceiver: ClientReceiver = mock[ClientReceiver]): ActorRef =
    scope.system.actorOf(
      IssueImporterStatusMonitor.props(repository,
                                       userRepository,
                                       clientReceiver,
                                       new MockServices(scope.system),
                                       reactiveMongoApi))

  private def result(config: IssueImporterConfig,
                     projectId: ProjectId = project,
                     success: Boolean): UpdateProjectSyncStats =
    UpdateProjectSyncStats(
      config.id,
      organisationId,
      projectId,
      "Project",
      issueCount = if (success) 3 else 0,
      success = success,
      error = Option.unless(success)(
        ConnectivityIssue("connection_error", "refused", DateTime.now))
    )

  "IssueImporterStatusMonitor" should {
    "write only the sync status of the config" in new ActorTestScope {
      private val stored = new StoredConfig(planeConfig())

      monitor(this, stored.repository) ! result(stored.config.get(),
                                                success = true)

      awaitAssert(stored.syncStatus.connectivityStatus must equalTo(
                    ConnectivityStatus.Healthy),
                  3.seconds)
      there.was(
        no(stored.repository).upsert(any[IssueImporterConfig])(
          any[Writes[IssueImporterConfigId]],
          any[DBSession]))
    }

    "apply each result to the status that the previous result wrote" in new ActorTestScope {
      private val stored      = new StoredConfig(planeConfig())
      private val config      = stored.config.get()
      private val second      = ProjectId()
      private val statusActor = monitor(this, stored.repository)

      statusActor ! result(config, success = true)
      statusActor ! result(config, second, success = true)

      awaitAssert(stored.syncStatus.projectStats.map(_.projectId) must
                    containTheSameElementsAs(Seq(project, second)),
                  3.seconds)
    }

    "report Degraded after one failure and Failed from the failure threshold on" in new ActorTestScope {
      private val stored      = new StoredConfig(planeConfig())
      private val config      = stored.config.get()
      private val statusActor = monitor(this, stored.repository)

      statusActor ! result(config, success = false)
      awaitAssert(stored.syncStatus.connectivityStatus must equalTo(
                    ConnectivityStatus.Degraded),
                  3.seconds)
      stored.syncStatus.currentIssue.map(_.errorCode) must beSome(
        "connection_error")

      (2 to 5).foreach(_ => statusActor ! result(config, success = false))
      awaitAssert(stored.syncStatus.connectivityStatus must equalTo(
                    ConnectivityStatus.Failed),
                  5.seconds)

      statusActor ! result(config, success = true)
      awaitAssert(stored.syncStatus.connectivityStatus must equalTo(
                    ConnectivityStatus.Healthy),
                  3.seconds)
      stored.syncStatus.currentIssue must beNone
    }

    "notify the administrators only when the status changes" in new ActorTestScope {
      private val stored         = new StoredConfig(planeConfig())
      private val config         = stored.config.get()
      private val clientReceiver = mock[ClientReceiver]
      private val admin          = mock[User]
      admin.id.returns(UserId())
      private val statusActor = monitor(this,
                                        stored.repository,
                                        administrators(Seq(admin)),
                                        clientReceiver)

      statusActor ! result(config, success = false)
      statusActor ! result(config, success = false)
      awaitAssert(stored.syncStatus.projectStats.map(_.consecutiveFailures) must
                    equalTo(Seq(2)),
                  3.seconds)

      there.was(
        one(clientReceiver).send(any[UserId], any[OutEvent], any[List[UserId]]))
    }

    "send no notice for a config without administrators" in new ActorTestScope {
      private val stored         = new StoredConfig(planeConfig())
      private val clientReceiver = mock[ClientReceiver]

      monitor(this,
              stored.repository,
              administrators(Seq.empty),
              clientReceiver) ! result(stored.config.get(), success = false)
      awaitAssert(stored.syncStatus.connectivityStatus must equalTo(
                    ConnectivityStatus.Degraded),
                  3.seconds)

      there.was(noCallsTo(clientReceiver))
    }
  }
}
