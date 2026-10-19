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

import play.api.libs.json.{Format, Json}

/** One page of the filtered bookings, newest first. `total` and `summary` cover
  * the whole filtered set, not only the page.
  */
case class BookingPage(items: Seq[BookingV2],
                       total: Int,
                       summary: Option[BookingSummary])

object BookingPage {
  implicit val format: Format[BookingPage] = Json.format[BookingPage]
}

/** The filters of a booking page. A tag filter needs every tag in `tagIds`. */
case class BookingPageFilter(projectId: Option[String],
                             userId: Option[String],
                             tagIds: Seq[String])
