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

package actors.scheduler

import actors.IssueImporterStatusMonitor.{
  UpdateConnectivityStatus,
  UpdateProjectSyncStats
}
import actors.TagCache.TagsUpdated
import actors.scheduler.TagParseWorker.{Parse, StartParsing}
import actors.scheduler.TagParseWorkerSpec.TestWorker
import core.SystemServices
import models._
import org.apache.pekko.actor.Props
import org.apache.pekko.testkit.TestProbe
import org.specs2.mock.Mockito
import org.specs2.mutable.Specification
import pekko.ActorTestScope

import java.nio.channels.ClosedChannelException
import java.util.concurrent.atomic.AtomicInteger
import scala.concurrent.duration._
import scala.concurrent.{Future, Promise}

class TagParseWorkerSpec extends Specification with Mockito {

  private val tag = SimpleTag(TagId("LAS-1"))

  private class Probes(implicit scope: ActorTestScope) {
    val tagCache: TestProbe = TestProbe()(scope.system)
    val monitor: TestProbe  = TestProbe()(scope.system)
    val services: SystemServices = {
      val services = mock[SystemServices]
      services.tagCache returns tagCache.ref
      services.issueImporterStatusMonitor returns monitor.ref
      services
    }
  }

  "A TagParseWorker" should {
    "publish the loaded tags and report a healthy sync" in new ActorTestScope {
      private val probes = new Probes()(this)
      private val worker = system.actorOf(
        Props(new TestWorker(probes.services,
                             () => Future.successful(Set(tag)),
                             1.hour)))

      worker ! StartParsing

      probes.tagCache.expectMsgType[TagsUpdated[SimpleTag]].tags must equalTo(
        Set(tag))
      private val stats = probes.monitor.expectMsgType[UpdateProjectSyncStats]
      stats.success must beTrue
      stats.issueCount must equalTo(1)
      probes.monitor
        .expectMsgType[UpdateConnectivityStatus]
        .status must equalTo(ConnectivityStatus.Healthy)
    }

    "report a failed load with a message and load again after the frequency" in new ActorTestScope {
      private val probes = new Probes()(this)
      private val loads  = new AtomicInteger()
      private val worker = system.actorOf(Props(new TestWorker(
        probes.services,
        () => {
          loads.incrementAndGet()
          Future.failed(new ClosedChannelException)
        },
        200.millis)))

      worker ! StartParsing

      private val stats = probes.monitor.expectMsgType[UpdateProjectSyncStats]
      stats.success must beFalse
      stats.error.map(_.message) must beSome("ClosedChannelException")
      probes.monitor
        .expectMsgType[UpdateConnectivityStatus]
        .status must equalTo(ConnectivityStatus.Failed)
      probes.monitor.expectMsgType[UpdateProjectSyncStats](3.seconds)
      loads.get must beGreaterThanOrEqualTo(2)
      probes.tagCache.expectNoMessage(100.millis)
    }

    "start no second load while a load runs" in new ActorTestScope {
      private val probes  = new Probes()(this)
      private val loads   = new AtomicInteger()
      private val pending = Promise[Set[SimpleTag]]()
      private val worker = system.actorOf(Props(new TestWorker(probes.services,
                                                               () => {
                                                                 loads
                                                                   .incrementAndGet()
                                                                 pending.future
                                                               },
                                                               1.hour)))

      worker ! StartParsing
      worker ! Parse
      worker ! Parse
      probes.tagCache.expectNoMessage(200.millis)
      loads.get must equalTo(1)

      pending.success(Set(tag))
      probes.tagCache.expectMsgType[TagsUpdated[SimpleTag]].tags must equalTo(
        Set(tag))
      loads.get must equalTo(1)
    }
  }
}

object TagParseWorkerSpec {

  class TestWorker(protected val systemServices: SystemServices,
                   load: () => Future[Set[SimpleTag]],
                   protected val checkFrequency: FiniteDuration)
      extends TagParseWorker[SimpleTag] {
    protected val configId: IssueImporterConfigId = IssueImporterConfigId()
    protected val organisationId: OrganisationId  = OrganisationId()
    protected val projectId: ProjectId            = ProjectId()
    protected val externalProjectId: String       = "external-project"
    protected val projectName: String             = "External Project"

    override protected def loadTags(): Future[Set[SimpleTag]] = load()
  }
}
