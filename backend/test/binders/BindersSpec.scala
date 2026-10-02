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

package binders

import org.joda.time.{LocalDate, LocalDateTime}
import org.specs2.mutable.Specification
import play.api.mvc.QueryStringBindable

class BindersSpec extends Specification {

  private implicit val strings: QueryStringBindable[String] =
    QueryStringBindable.bindableString

  private def bindLocalDateTime(
      value: String): Option[Either[String, LocalDateTime]] =
    Binders.localDateTimeQueryStringBinder
      .bind("to", Map("to" -> Seq(value)))

  private def bindLocalDate(value: String): Option[Either[String, LocalDate]] =
    Binders.localDateQueryStringBinder.bind("day", Map("day" -> Seq(value)))

  "Binders.localDateTimeQueryStringBinder" should {
    "keep the wall time that the client sent with an offset" in {
      val wallTime = new LocalDateTime(2026, 10, 2, 14, 30)

      bindLocalDateTime("2026-10-02T14:30:00.000+02:00") must beSome(
        Right(wallTime))
      bindLocalDateTime("2026-10-02T14:30:00.000-05:00") must beSome(
        Right(wallTime))
    }

    "read a value without an offset" in {
      bindLocalDateTime("2026-10-02T14:30:00.000") must beSome(
        Right(new LocalDateTime(2026, 10, 2, 14, 30)))
    }

    "reject a value that matches no pattern" in {
      bindLocalDateTime("02.10.2026 14:30") must beSome(beLeft[String])
    }
  }

  "Binders.localDateQueryStringBinder" should {
    "keep the date that the client sent with an offset" in {
      bindLocalDate("2026-10-02T23:30:00.000-05:00") must beSome(
        Right(new LocalDate(2026, 10, 2)))
      bindLocalDate("2026-10-02T00:30:00.000+02:00") must beSome(
        Right(new LocalDate(2026, 10, 2)))
    }

    "read a date-time without an offset and a plain date" in {
      bindLocalDate("2026-10-02T14:30:00.000") must beSome(
        Right(new LocalDate(2026, 10, 2)))
      bindLocalDate("2026-10-02") must beSome(Right(new LocalDate(2026, 10, 2)))
    }
  }
}
