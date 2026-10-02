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

package core

import actors.scheduler.TagParseWorker
import core.PluginHandler._
import core.PluginHandlerSpec._
import models._
import org.apache.pekko.actor.{Actor, ActorRef, Props}
import org.apache.pekko.testkit.TestProbe
import org.specs2.mock.Mockito
import org.specs2.mutable.Specification
import pekko.ActorTestScope
import play.api.libs.ws.WSClient
import play.modules.reactivemongo.ReactiveMongoApi
import repositories.{IssueImporterConfigRepository, UserRepository}

import java.net.URI

class PluginHandlerSpec extends Specification with Mockito {

  private val first  = ProjectMappingId()
  private val second = ProjectMappingId()

  private def mapping(id: ProjectMappingId): PlaneProjectMapping =
    PlaneProjectMapping(
      id = id,
      projectId = ProjectId(),
      settings = PlaneProjectSettings(
        planeProjectId = s"plane-${id.value}",
        tagConfiguration =
          PlaneTagConfiguration(useLabels = false, labelFilter = Set.empty))
    )

  private val config = PlaneConfig(
    id = IssueImporterConfigId(),
    organisationReference = EntityReference(OrganisationId(), "org"),
    name = "Plane",
    baseUrl = URI.create("https://plane.example.com").toURL,
    auth = PlaneAuth("key"),
    settings = PlaneSettings(checkFrequency = 300000L, workspace = "ws"),
    projects = Seq(mapping(first), mapping(second)),
    audit = AuditInfo.initial(UserId())
  )

  /** A plugin handler whose workers report to the probe. */
  private def pluginHandler(scope: ActorTestScope, probe: TestProbe): ActorRef =
    scope.system.actorOf(
      Props(
        new PluginHandler(mock[UserRepository],
                          mock[IssueImporterConfigRepository],
                          mock[SystemServices],
                          mock[WSClient],
                          mock[LasiusConfig],
                          mock[ReactiveMongoApi]) {
          override protected def workerProps(
              config: IssueImporterConfig): Seq[(ProjectMappingId, Props)] =
            Seq(first, second).map(id =>
              id -> Props(classOf[ProbeWorker], probe.ref, id))
        }))

  "PluginHandler" should {
    "start one worker for each mapping of a config" in new ActorTestScope {
      private val probe   = TestProbe()
      private val handler = pluginHandler(this, probe)

      handler ! StartConfigWorkers(config)

      probe
        .receiveN(2)
        .collect { case Started(id, _) => id }
        .toSet must equalTo(Set(first, second))
    }

    "replace the running worker when a mapping starts again" in new ActorTestScope {
      private val probe   = TestProbe()
      private val handler = pluginHandler(this, probe)

      handler ! StartMappingWorker(config, first)
      private val running = probe.expectMsgType[Started].worker
      handler ! StartMappingWorker(config, first)

      private val events = probe.receiveN(2)
      events must contain(Stopped(first, running))
      events.collect { case Started(`first`, worker) => worker } must
        haveSize[Seq[ActorRef]](1).and(not(contain(running)))
    }

    "stop the worker of a mapping" in new ActorTestScope {
      private val probe   = TestProbe()
      private val handler = pluginHandler(this, probe)

      handler ! StartMappingWorker(config, first)
      private val running = probe.expectMsgType[Started].worker
      handler ! StopMappingWorker(config.id, first)

      probe.expectMsg(Stopped(first, running))
    }

    "stop the workers of a config" in new ActorTestScope {
      private val probe   = TestProbe()
      private val handler = pluginHandler(this, probe)

      handler ! StartConfigWorkers(config)
      probe.receiveN(2)
      handler ! StopConfigWorkers(config.id)

      probe
        .receiveN(2)
        .collect { case Stopped(id, _) => id }
        .toSet must equalTo(Set(first, second))
    }

    "send a parse request to the worker of a refreshed mapping" in new ActorTestScope {
      private val probe   = TestProbe()
      private val handler = pluginHandler(this, probe)

      handler ! StartMappingWorker(config, first)
      probe.expectMsgType[Started]
      handler ! RefreshMappingTags(config.id, first)

      probe.expectMsg(Received(first, TagParseWorker.Parse))
    }
  }
}

object PluginHandlerSpec {
  final case class Started(mappingId: ProjectMappingId, worker: ActorRef)
  final case class Stopped(mappingId: ProjectMappingId, worker: ActorRef)
  final case class Received(mappingId: ProjectMappingId, message: Any)

  /** Reports its start, its stop and each message to the probe. */
  class ProbeWorker(probe: ActorRef, mappingId: ProjectMappingId)
      extends Actor {
    override def preStart(): Unit = probe ! Started(mappingId, self)

    override def postStop(): Unit = probe ! Stopped(mappingId, self)

    override def receive: Receive = { case message =>
      probe ! Received(mappingId, message)
    }
  }
}
