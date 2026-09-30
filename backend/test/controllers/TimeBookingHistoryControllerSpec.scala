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

package controllers

import core.{SystemServices, TestApplication}
import models._
import mongo.EmbedMongo
import org.joda.time.LocalDateTime
import org.specs2.mock.Mockito
import org.specs2.mock.mockito.MockitoMatchers
import play.api.libs.json.Json
import play.api.mvc._
import play.api.test._

import scala.concurrent.{ExecutionContext, Future}

class TimeBookingHistoryControllerSpec
    extends PlaySpecification
    with Mockito
    with Results
    with MockitoMatchers
    with EmbedMongo
    with TestApplication {

  private val to: LocalDateTime   = LocalDateTime.now()
  private val from: LocalDateTime = to.minusDays(7)

  private def getHistoryByProject(controller: TimeBookingHistoryControllerMock,
                                  projectId: ProjectId): Future[Result] =
    controller.getTimeBookingHistoryByProject(controller.organisationId,
                                              projectId,
                                              from,
                                              to,
                                              None,
                                              None)(FakeRequest().withBody(()))

  private def upsertProject(controller: TimeBookingHistoryControllerMock,
                            project: Project): Unit =
    withDBSession()(implicit dbSession =>
      controller.projectRepository.upsert(project)).awaitResult()

  "get time booking history by project" should {

    "badrequest if OrganisationAdministrator requests a project of another organisation" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationAdministrator)

      val foreignProject: Project = Project(
        id = ProjectId(),
        key = "foreignProject",
        organisationReference = EntityReference(OrganisationId(), "otherOrg"),
        bookingCategories = Set(),
        active = true,
        createdBy = EntityReference(UserId(), "otherUser"),
        deactivatedBy = None
      )
      upsertProject(controller, foreignProject)

      val result: Future[Result] =
        getHistoryByProject(controller, foreignProject.id)

      status(result) must equalTo(BAD_REQUEST)
      contentAsString(result) must equalTo(
        s"Project ${foreignProject.id.value} is not assigned to organisation ${controller.organisationId.value}")
    }

    "successful if OrganisationAdministrator requests a project of the own organisation" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationAdministrator,
                                                     projectRole =
                                                       ProjectMember)

      val result: Future[Result] =
        getHistoryByProject(controller, controller.project.id)

      status(result) must equalTo(OK)
      contentAsJson(result) must equalTo(Json.arr())
    }

    "successful if OrganisationAdministrator is ProjectAdministrator of a project shared by another organisation" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationAdministrator,
                                                     projectRole =
                                                       ProjectAdministrator)

      // An accepted project invitation stores a project of another
      // organisation under the organisation that the invited user selects.
      upsertProject(controller,
                    controller.project.copy(organisationReference =
                      EntityReference(OrganisationId(), "sharingOrg")))

      val result: Future[Result] =
        getHistoryByProject(controller, controller.project.id)

      status(result) must equalTo(OK)
    }

    "badrequest if OrganisationAdministrator is only ProjectMember of a project shared by another organisation" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationAdministrator,
                                                     projectRole =
                                                       ProjectMember)

      upsertProject(controller,
                    controller.project.copy(organisationReference =
                      EntityReference(OrganisationId(), "sharingOrg")))

      val result: Future[Result] =
        getHistoryByProject(controller, controller.project.id)

      status(result) must equalTo(BAD_REQUEST)
      contentAsString(result) must equalTo(
        s"Project ${controller.project.id.value} is not assigned to organisation ${controller.organisationId.value}")
    }

    "successful with an empty list if OrganisationAdministrator requests an unknown project" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationAdministrator,
                                                     projectRole =
                                                       ProjectMember)

      val result: Future[Result] = getHistoryByProject(controller, ProjectId())

      status(result) must equalTo(OK)
      contentAsJson(result) must equalTo(Json.arr())
    }

    "successful if OrganisationMember is ProjectAdministrator" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationMember,
                                                     projectRole =
                                                       ProjectAdministrator)

      val result: Future[Result] =
        getHistoryByProject(controller, controller.project.id)

      status(result) must equalTo(OK)
    }

    "forbidden if OrganisationMember is only ProjectMember" in new WithTestApplication {

      implicit val executionContext: ExecutionContext = inject[ExecutionContext]
      val systemServices: SystemServices              = inject[SystemServices]
      val authConfig: AuthConfig                      = inject[AuthConfig]
      val controller: TimeBookingHistoryControllerMock =
        controllers.TimeBookingHistoryControllerMock(config,
                                                     systemServices,
                                                     authConfig,
                                                     reactiveMongoApi,
                                                     organisationRole =
                                                       OrganisationMember,
                                                     projectRole =
                                                       ProjectMember)

      val result: Future[Result] =
        getHistoryByProject(controller, controller.project.id)

      status(result) must equalTo(FORBIDDEN)
    }
  }
}
