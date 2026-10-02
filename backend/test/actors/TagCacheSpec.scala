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

import actors.TagCache.{CachedTags, GetTags, TagsUpdated}
import models._
import org.apache.pekko.testkit.{ImplicitSender, TestProbe}
import org.specs2.mutable.Specification
import pekko.ActorTestScope

import scala.concurrent.duration.DurationInt

class TagCacheSpec extends Specification {

  private def tag(id: String): SimpleTag = SimpleTag(TagId(id))

  "TagCache" should {
    "return the tags of the first update for a project" in new ActorTestScope
      with ImplicitSender {
      val projectId = ProjectId()
      val cache     = system.actorOf(TagCache.props)

      cache ! TagsUpdated("plane-project", projectId, Set(tag("LAS-1")))
      cache ! GetTags(projectId)

      expectMsg(CachedTags(projectId, Set[Tag](tag("LAS-1"))))
    }

    "replace the tags of one external project and keep the others" in new ActorTestScope
      with ImplicitSender {
      val projectId = ProjectId()
      val cache     = system.actorOf(TagCache.props)

      cache ! TagsUpdated("plane-project", projectId, Set(tag("LAS-1")))
      cache ! TagsUpdated("github-repo", projectId, Set(tag("GH-1")))
      cache ! TagsUpdated("plane-project", projectId, Set(tag("LAS-2")))
      cache ! GetTags(projectId)

      expectMsg(CachedTags(projectId, Set[Tag](tag("LAS-2"), tag("GH-1"))))
    }

    "return no tags for an unknown project" in new ActorTestScope
      with ImplicitSender {
      val projectId = ProjectId()
      val cache     = system.actorOf(TagCache.props)

      cache ! GetTags(projectId)

      expectMsg(CachedTags(projectId, Set.empty[Tag]))
    }

    "remove the tags of a worker that stops" in new ActorTestScope
      with ImplicitSender {
      val projectId = ProjectId()
      val cache     = system.actorOf(TagCache.props)
      val worker    = TestProbe()

      worker.send(cache,
                  TagsUpdated("plane-project", projectId, Set(tag("LAS-1"))))
      cache ! TagsUpdated("github-repo", projectId, Set(tag("GH-1")))
      system.stop(worker.ref)

      awaitAssert {
        cache ! GetTags(projectId)
        expectMsg(CachedTags(projectId, Set[Tag](tag("GH-1"))))
      }
    }

    "keep the tags that the next worker of a mapping wrote" in new ActorTestScope
      with ImplicitSender {
      val projectId = ProjectId()
      val cache     = system.actorOf(TagCache.props)
      val previous  = TestProbe()
      val next      = TestProbe()

      previous.send(cache,
                    TagsUpdated("plane-project", projectId, Set(tag("LAS-1"))))
      next.send(cache,
                TagsUpdated("plane-project", projectId, Set(tag("LAS-1"))))
      system.stop(previous.ref)
      expectNoMessage(200.millis)

      cache ! GetTags(projectId)
      expectMsg(CachedTags(projectId, Set[Tag](tag("LAS-1"))))
    }
  }
}
