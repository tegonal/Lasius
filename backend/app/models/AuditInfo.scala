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

import org.joda.time.DateTime
import play.api.libs.json._
import models.BaseFormat._

/** Audit information tracking who created and last modified an entity.
  *
  * @param createdBy
  *   User who created the entity
  * @param createdAt
  *   Timestamp when entity was created
  * @param updatedBy
  *   User who last updated the entity
  * @param updatedAt
  *   Timestamp when entity was last updated
  */
case class AuditInfo(
    createdBy: UserId,
    createdAt: DateTime,
    updatedBy: UserId,
    updatedAt: DateTime
)

object AuditInfo {
  implicit val format: Format[AuditInfo] = Json.format[AuditInfo]

  /** Creates initial audit info for a newly created entity.
    *
    * @param userId
    *   User creating the entity
    * @return
    *   AuditInfo with both created and updated fields set to the same user and
    *   current timestamp
    */
  def initial(userId: UserId): AuditInfo = {
    val now = DateTime.now()
    AuditInfo(
      createdBy = userId,
      createdAt = now,
      updatedBy = userId,
      updatedAt = now
    )
  }

  /** Updates audit info when entity is modified.
    *
    * @param current
    *   Current audit info
    * @param userId
    *   User modifying the entity
    * @return
    *   Updated AuditInfo with new updatedBy and updatedAt
    */
  def updated(current: AuditInfo, userId: UserId): AuditInfo = {
    current.copy(
      updatedBy = userId,
      updatedAt = DateTime.now()
    )
  }
}

/** Audit information response with full user details for API responses.
  *
  * @param createdBy
  *   User who created the entity (with full details)
  * @param createdAt
  *   Timestamp when entity was created
  * @param updatedBy
  *   User who last updated the entity (with full details)
  * @param updatedAt
  *   Timestamp when entity was last updated
  */
case class AuditInfoResponse(
    createdBy: UserStub,
    createdAt: DateTime,
    updatedBy: UserStub,
    updatedAt: DateTime
)

object AuditInfoResponse {
  implicit val format: Format[AuditInfoResponse] =
    Json.format[AuditInfoResponse]
}
