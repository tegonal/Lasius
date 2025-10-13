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

import models.BaseFormat.UUIDBaseId
import play.api.libs.json.Format

import java.util.UUID

/** Unified ID type for all issue importer configurations. Uses UUID like other
  * entity IDs (ProjectId, OrganisationId, etc.) for consistent JSON
  * serialization.
  */
case class IssueImporterConfigId(value: UUID = UUID.randomUUID())
    extends UUIDBaseId

object IssueImporterConfigId {
  implicit val idFormat: Format[IssueImporterConfigId] =
    BaseFormat.idformat[IssueImporterConfigId](IssueImporterConfigId.apply _)
}
