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

package helpers

import core.Validation.ValidationFailedException

import scala.concurrent.Future.{failed, successful}
import scala.concurrent.{ExecutionContext, Future}

trait FutureHelper {
  implicit class FutureOptionHelper[T](self: Future[Option[T]]) {
    def noneToFailed(errorMsg: => String)(implicit
        executionContext: ExecutionContext): Future[T] = self.flatMap {
      case Some(result) => successful(result)
      case _            => failed(ValidationFailedException(errorMsg))
    }

    def someToFailed(errorMsg: => String)(implicit
        executionContext: ExecutionContext): Future[Option[T]] = self.flatMap {
      case Some(_) => failed(ValidationFailedException(errorMsg))
      case _       => successful(None)
    }

  }

  implicit class OptionHelper[T](self: Option[T]) {
    def noneToFailed(errorMsg: => String): Future[T] = self match {
      case Some(result) => successful(result)
      case _            => failed(ValidationFailedException(errorMsg))
    }

    def someToFailed(errorMsg: => String): Future[Option[T]] = self match {
      case Some(_) => failed(ValidationFailedException(errorMsg))
      case _       => successful(None)
    }

  }

  implicit class FutureHelper[T](self: Future[T]) {

    def failIf(predicate: T => Boolean, errorMsg: => String)(implicit
        executionContext: ExecutionContext): Future[T] = self.flatMap {
      result =>
        if (predicate(result))
          failed(ValidationFailedException(errorMsg))
        else successful(result)
    }
  }

  implicit class FutureBooleanHelper(self: Future[Boolean]) {

    def failIfTrue(errorMsg: => String)(implicit
        executionContext: ExecutionContext): Future[Boolean] =
      self.failIf(_ == true, errorMsg)
  }
}
