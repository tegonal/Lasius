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

/** Hides the value of every credential field in `toString`. Debug logs print
  * the issuer configs and the importer credentials.
  */
trait RedactedSecrets { self: Product =>
  override def toString: String =
    productElementNames
      .zip(productIterator)
      .map {
        case (name, _) if RedactedSecrets.secretFields(name) =>
          s"$name=<redacted>"
        case (name, value) => s"$name=$value"
      }
      .mkString(s"$productPrefix(", ",", ")")
}

object RedactedSecrets {
  private val secretFields = Set("accessToken",
                                 "apiKey",
                                 "clientSecret",
                                 "password",
                                 "privateKey",
                                 "token",
                                 "tokenSecret")
}
