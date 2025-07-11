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

package repositories

import com.google.inject.ImplementedBy
import core.{DBSession, Validation}
import models._
import org.joda.time.DateTime
import play.api.Logging
import play.api.libs.json._
import reactivemongo.api.bson.collection.BSONCollection

import javax.inject.Inject
import scala.concurrent._
import scala.util.Random

@ImplementedBy(classOf[OAuthAuthorizationCodeMongoRepository])
trait OAuthAuthorizationCodeRepository
    extends BaseRepository[OAuthAuthorizationCode, OAuthAuthorizationCodeId]
    with DropAllSupport[OAuthAuthorizationCode, OAuthAuthorizationCodeId] {
  def register(loginRequest: OAuthAuthorizationCodeLoginRequest,
               user: OAuthUser)(implicit
      dbSession: DBSession): Future[OAuthAuthorizationCode]

  def findByCode(code: String)(implicit
      dbSession: DBSession): Future[Option[OAuthAuthorizationCode]]

  def removeByCode(code: String)(implicit dbSession: DBSession): Future[Boolean]

  val MAX_CODE_LENGTH = 45
}

class OAuthAuthorizationCodeMongoRepository @Inject() (
    override implicit protected val executionContext: ExecutionContext)
    extends BaseReactiveMongoRepository[OAuthAuthorizationCode,
                                        OAuthAuthorizationCodeId]
    with OAuthAuthorizationCodeRepository
    with MongoDropAllSupport[OAuthAuthorizationCode, OAuthAuthorizationCodeId]
    with Validation
    with Logging {
  override protected[repositories] def coll(implicit
      dbSession: DBSession): BSONCollection =
    dbSession.db.collection[BSONCollection]("OAuthAuthorizationCode")

  override def register(loginRequest: OAuthAuthorizationCodeLoginRequest,
                        user: OAuthUser)(implicit
      dbSession: DBSession): Future[OAuthAuthorizationCode] = {
    val code = generateRandomCode()
    for {
      _       <- findByCode(code).someToFailed(s"Duplicate code")
      newCode <- Future.successful(
        OAuthAuthorizationCode(
          id = OAuthAuthorizationCodeId(),
          clientId = loginRequest.clientId,
          code = code,
          scope = loginRequest.scope,
          redirectUri = loginRequest.redirectUri,
          codeChallenge = loginRequest.codeChallenge,
          codeChallengeMethod = loginRequest.codeChallengeMethod,
          userId = user.id,
          createdAt = DateTime.now(),
        ))
      _ <- upsert(newCode)
    } yield newCode
  }

  private def generateRandomCode(): String =
    Random.alphanumeric.take(MAX_CODE_LENGTH).mkString

  override def findByCode(code: String)(implicit
      dbSession: DBSession): Future[Option[OAuthAuthorizationCode]] = {
    val sel =
      Json.obj("code" -> code)
    findFirst(sel).map(_.map(_._1))
  }

  override def removeByCode(code: String)(implicit
      dbSession: DBSession): Future[Boolean] = {
    val sel = Json.obj("code" -> code)
    remove(sel)
  }
}
