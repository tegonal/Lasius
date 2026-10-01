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

import org.apache.pekko.actor._
import models._

object TagCache {

  case class GetTags(projectId: ProjectId)

  case class CachedTags(projectId: ProjectId, tags: Set[Tag])

  case class TagsUpdated[X <: Tag](externalProjectId: String,
                                   projectId: ProjectId,
                                   tags: Set[X])(implicit m: Manifest[X]) {
    val manifest: Manifest[X] = m
  }

  def props: Props = Props(classOf[TagCache])
}

/** Holds the imported issue tags of each Lasius project in memory. Clients read
  * them through the tag endpoint; the cache sends no notification.
  */
class TagCache extends Actor with ActorLogging {

  import TagCache._

  /** Tags by Lasius project, by external project, and by tag type. */
  private var tagCache
      : Map[ProjectId, Map[String, Map[Manifest[_], Set[Tag]]]] =
    Map.empty

  val receive: Receive = {
    case update @ TagsUpdated(externalProjectId, projectId, tags) =>
      updateTags(update.manifest, externalProjectId, projectId, tags.toSet[Tag])

    case GetTags(projectId) =>
      val projectTags =
        tagCache
          .getOrElse(projectId, Map.empty)
          .values
          .flatMap(_.values)
          .flatten
      sender() ! CachedTags(projectId, projectTags.toSet)
  }

  private def updateTags(tagType: Manifest[_],
                         externalProjectId: String,
                         projectId: ProjectId,
                         tags: Set[Tag]): Unit = {
    val projectTags  = tagCache.getOrElse(projectId, Map.empty)
    val externalTags = projectTags.getOrElse(externalProjectId, Map.empty)
    val current      = externalTags.getOrElse(tagType, Set.empty)

    if (current != tags) {
      log.debug(
        s"TagCache updated for project $projectId: removed=${(current -- tags).size}, added=${(tags -- current).size}")
      tagCache += projectId ->
        (projectTags + (externalProjectId -> (externalTags + (tagType -> tags))))
    }
  }
}
