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

import scala.collection.mutable
import scala.concurrent.Future

/** Answers the page requests of an importer and records each requested page.
  * The 11th request fails, so a load without end stops the example.
  */
class StubPages[R](answer: Int => R) {
  val requests: mutable.Buffer[Int] = mutable.Buffer.empty

  def loadPage(page: Int): Future[R] = {
    requests += page
    if (requests.size > 10)
      Future.failed(new IllegalStateException("The load does not end"))
    else Future.successful(answer(page))
  }
}
