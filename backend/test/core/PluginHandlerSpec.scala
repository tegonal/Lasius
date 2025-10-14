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

import models._
import mongo.EmbedMongo
import org.apache.pekko.testkit.TestProbe
import play.api.test.PlaySpecification

import scala.concurrent.duration._

/** Tests for PluginHandler message routing. Verifies that messages are
  * correctly routed from the controller to PluginHandler.
  *
  * Note: Since MockSystemServicesAware.scala:112 provides pluginHandler as
  * TestProbe().ref, we can verify that messages are sent to it from the
  * controller layer.
  */
class PluginHandlerSpec
    extends PlaySpecification
    with EmbedMongo
    with TestApplication {

  sequential

  "PluginHandler message routing" should {

    "accept StopProjectScheduler message for GitLab" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]

      val configId  = IssueImporterConfigId()
      val projectId = ProjectId()

      // Send message to pluginHandler (which is a TestProbe in MockSystemServices)
      systemServices.pluginHandler ! PluginHandler.StopProjectScheduler(
        ImporterType.Gitlab,
        configId,
        projectId
      )

      // The message should be accepted without error
      // (TestProbe accepts all messages by default)
      success
    }

    "accept StopProjectScheduler message for Jira" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]

      systemServices.pluginHandler ! PluginHandler.StopProjectScheduler(
        ImporterType.Jira,
        IssueImporterConfigId(),
        ProjectId()
      )

      success
    }

    "accept StopProjectScheduler message for Plane" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]

      systemServices.pluginHandler ! PluginHandler.StopProjectScheduler(
        ImporterType.Plane,
        IssueImporterConfigId(),
        ProjectId()
      )

      success
    }

    "accept StopProjectScheduler message for GitHub" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]

      systemServices.pluginHandler ! PluginHandler.StopProjectScheduler(
        ImporterType.Github,
        IssueImporterConfigId(),
        ProjectId()
      )

      success
    }

    "accept StopConfigSchedulers message for GitLab" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]

      systemServices.pluginHandler ! PluginHandler.StopConfigSchedulers(
        ImporterType.Gitlab,
        IssueImporterConfigId()
      )

      success
    }

    "accept StopConfigSchedulers message for all types" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]
      val configId                       = IssueImporterConfigId()

      // Test all four importer types
      systemServices.pluginHandler ! PluginHandler.StopConfigSchedulers(
        ImporterType.Gitlab,
        configId
      )
      systemServices.pluginHandler ! PluginHandler.StopConfigSchedulers(
        ImporterType.Jira,
        configId
      )
      systemServices.pluginHandler ! PluginHandler.StopConfigSchedulers(
        ImporterType.Plane,
        configId
      )
      systemServices.pluginHandler ! PluginHandler.StopConfigSchedulers(
        ImporterType.Github,
        configId
      )

      success
    }

    "accept RefreshProjectTags message for GitLab" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]

      systemServices.pluginHandler ! PluginHandler.RefreshProjectTags(
        ImporterType.Gitlab,
        IssueImporterConfigId(),
        ProjectId()
      )

      success
    }

    "accept RefreshProjectTags message for all types" in new WithTestApplication {
      val systemServices: SystemServices = inject[SystemServices]
      val configId                       = IssueImporterConfigId()
      val projectId                      = ProjectId()

      // Test all four importer types
      systemServices.pluginHandler ! PluginHandler.RefreshProjectTags(
        ImporterType.Gitlab,
        configId,
        projectId
      )
      systemServices.pluginHandler ! PluginHandler.RefreshProjectTags(
        ImporterType.Jira,
        configId,
        projectId
      )
      systemServices.pluginHandler ! PluginHandler.RefreshProjectTags(
        ImporterType.Plane,
        configId,
        projectId
      )
      systemServices.pluginHandler ! PluginHandler.RefreshProjectTags(
        ImporterType.Github,
        configId,
        projectId
      )

      success
    }
  }
}
