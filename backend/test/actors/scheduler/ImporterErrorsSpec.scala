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

import org.specs2.mutable.Specification

import java.io.IOException
import java.nio.channels.ClosedChannelException

class ImporterErrorsSpec extends Specification {

  "ImporterErrors.classify" should {
    "report a parse error as parse_error, also when its message holds 404" in {
      ImporterErrors.classify(new ApiParseException(
        "Could not parse the response of /x at /results(404)/estimate_point")) must
        equalTo(("parse_error", None))
    }

    "map the HTTP status of a failed request" in {
      ImporterErrors.classify(
        new HttpStatusException(401, "Http status:401")) must
        equalTo(("authentication_failed", Some(401)))
      ImporterErrors.classify(
        new HttpStatusException(429, "Http status:429")) must
        equalTo(("unknown_error", Some(429)))
    }

    "keep the message checks for other exceptions" in {
      ImporterErrors.classify(new IOException("Http status:404:Not Found")) must
        equalTo(("resource_not_found", Some(404)))
      ImporterErrors.classify(new ClosedChannelException) must
        equalTo(("unknown_error", None))
    }
  }

  "ImporterErrors.connectivityIssue" should {
    "use the exception class as the message when the exception has none" in {
      val issue = ImporterErrors.connectivityIssue(new ClosedChannelException)

      issue.message must equalTo("ClosedChannelException")
      issue.errorCode must equalTo("unknown_error")
    }

    "keep the classification and the message of the exception" in {
      val issue = ImporterErrors.connectivityIssue(
        new HttpStatusException(403, "Http status:403:Forbidden"))

      issue.message must equalTo("Http status:403:Forbidden")
      issue.errorCode must equalTo("permission_denied")
      issue.httpStatus must beSome(403)
    }
  }
}
