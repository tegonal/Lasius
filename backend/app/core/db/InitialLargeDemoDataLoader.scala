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

package core.db

import core.{DBSession, DBSupport, SystemServices}
import domain.UserTimeBookingAggregate.AddBookingCommand
import models.UserId.UserReference
import models._
import org.joda.time.{DateTime, Interval}
import org.mindrot.jbcrypt.BCrypt
import play.api.Logging
import repositories._

import javax.inject.Inject
import scala.annotation.{tailrec, unused}
import scala.concurrent.{ExecutionContext, Future}
import scala.util.Random

/** Initialize database with 15 diverse demo users, projects, and time bookings
  * This creates a larger dataset for testing with varied user names and formats
  */
@unused
class InitialLargeDemoDataLoader @Inject() (
    oauthUserRepository: OAuthUserRepository,
    userRepository: UserRepository,
    projectRepository: ProjectRepository,
    organisationRepository: OrganisationRepository,
    systemServices: SystemServices)(implicit executionContext: ExecutionContext)
    extends Logging
    with DBSupport
    with InitialDataLoader {

  private val randomPhraseList: List[SimpleTag] =
    """   You Can't Teach an Old Dog New Tricks
          Shot In the Dark
          Jack of All Trades Master of None
          It's Not Brain Surgery
          A Bite at the Cherry
          Scot-free
          Let Her Rip
          Keep Your Shirt On
          Beating Around the Bush
          Mouth-watering
          Jig Is Up
          A Chip on Your Shoulder
          Jaws of Death
          Elvis Has Left The Building
          High And Dry
          Cry Wolf
          I Smell a Rat
          A Cold Day in July
          Needle In a Haystack
          Love Birds
          Go Out On a Limb
          Ride Him, Cowboy!
          What Am I, Chopped Liver?
          On Cloud Nine
          Drive Me Nuts
          Top Drawer
          Mountain Out of a Molehill
          A Cat Nap
          Wake Up Call
          Elephant in the Room
          Back To the Drawing Board
          A Guinea Pig
          Swinging For the Fences
          If You Can't Stand the Heat, Get Out of the Kitchen
          Poke Fun At
          Give a Man a Fish
          An Arm and a Leg
          Back to Square One
          Fish Out Of Water
          Drawing a Blank
          Greased Lightning
          A Leg Up
          A Fool and His Money Are Soon Parted
          Read 'Em and Weep
          A Little from Column A, a Little from Column B
          Cry Over Spilt Milk
          Go For Broke
          In a Pickle
          Ugly Duckling
          Long In The Tooth"""
      .split("\n")
      .map(w => SimpleTag(TagId(w.trim)))
      .toList

  // get's overridden b the withinTransaction call
  override val supportTransaction = true

  // Test users with diverse name lengths and edge cases
  private val demoPassword = sys.env.getOrElse("DEMO_PASSWORD", "demo")

  private case class DemoUser(key: String,
                              firstName: String,
                              lastName: String,
                              email: String)

  private val demoUsers = List(
    // Common short names - keep simple demo format
    DemoUser("demo1", "Li", "Wu", "demo1@lasius.ch"),
    DemoUser("demo2", "Ana", "Kim", "demo2@lasius.ch"),
    // Common medium names - realistic email formats
    DemoUser("james.wilson", "James", "Wilson", "james.wilson@lasius.ch"),
    DemoUser("m.garcia", "Maria", "Garcia", "m.garcia@lasius.ch"),
    // Longer names
    DemoUser("c.anderson", "Christopher", "Anderson", "c.anderson@lasius.ch"),
    DemoUser("alexandria.thompson",
             "Alexandria",
             "Thompson",
             "alexandria.thompson@lasius.ch"),
    // Hyphenated and compound names
    DemoUser("jean-pierre.dubois",
             "Jean-Pierre",
             "Dubois",
             "jean-pierre.dubois@lasius.ch"),
    DemoUser("m.oconnor", "Mary-Anne", "O'Connor", "m.oconnor@lasius.ch"),
    // Non-English characters and accents
    DemoUser("f.muller", "François", "Müller", "f.muller@lasius.ch"),
    DemoUser("zoe.gonzalez", "Zoë", "González", "zoe.gonzalez@lasius.ch"),
    // Additional diverse users
    DemoUser("raj.patel", "Raj", "Patel", "raj.patel@lasius.ch"),
    DemoUser("s.nakamura", "Sakura", "Nakamura", "s.nakamura@lasius.ch"),
    DemoUser("abdul.rahman", "Abdul", "Rahman", "abdul.rahman@lasius.ch"),
    DemoUser("l.kovacs", "László", "Kovács", "l.kovacs@lasius.ch"),
    DemoUser("nina.petersen", "Nina", "Petersen", "nina.petersen@lasius.ch")
  )

  override def initializeData(supportTransaction: Boolean)(implicit
      userReference: UserReference): Future[Unit] = {
    logger.debug(
      s"Initialize large demo data with ${demoUsers.length} users...")
    withDBSession(withTransaction = supportTransaction) { implicit dbSession =>
      for {
        (privateOrgs, publicOrg) <- initializeOrganisations()
        projects                 <- initializeProjects(publicOrg)
        users <- initializeUsers(privateOrgs, publicOrg, projects)
        _     <- initializeTimeBookings(publicOrg, projects, users)
      } yield ()
    }
  }

  private def initializeOrganisations()(implicit
      dbSession: DBSession,
      userReference: UserReference)
      : Future[(Map[String, Organisation], Organisation)] = {

    // Create private organisation for each demo user
    val privateOrgs = demoUsers.map { user =>
      Organisation(
        OrganisationId(),
        user.key,
        `private` = true,
        active = true,
        userReference,
        None
      )
    }

    // Create one shared public organisation
    val publicOrg =
      Organisation(OrganisationId(),
                   "DemoOrg",
                   `private` = false,
                   active = true,
                   userReference,
                   None)

    organisationRepository
      .bulkInsert(privateOrgs :+ publicOrg)
      .map(_ => (privateOrgs.map(o => o.key -> o).toMap, publicOrg))
  }

  private def initializeProjects(org: Organisation)(implicit
      dbSession: DBSession,
      userReference: UserReference): Future[Seq[Project]] = {
    val projects = List(
      Project(
        ProjectId(),
        "Lasius",
        org.getReference,
        Set(
          TagGroup(TagId("Development"),
                   relatedTags = Seq(SimpleTag(TagId("Billable")))),
          TagGroup(TagId("Planning"),
                   relatedTags = Seq(SimpleTag(TagId("Billable")),
                                     SimpleTag(TagId("Admin")))),
          TagGroup(TagId("Administration"),
                   relatedTags = Seq(SimpleTag(TagId("Non-Billable")),
                                     SimpleTag(TagId("Admin"))))
        ),
        active = true,
        userReference,
        None
      ),
      Project(
        ProjectId(),
        "Marketing",
        org.getReference,
        Set(
          TagGroup(TagId("Sales"),
                   relatedTags = Seq(SimpleTag(TagId("Non-Billable")),
                                     SimpleTag(TagId("Customer Contact")))),
          TagGroup(TagId("Cold Aquisition"),
                   relatedTags = Seq(SimpleTag(TagId("Non Billable")),
                                     SimpleTag(TagId("No Customer Contact"))))
        ),
        active = true,
        userReference,
        None
      ),
      Project(
        ProjectId(),
        "KnowHow",
        org.getReference,
        Set(SimpleTag(TagId("Billable")), SimpleTag(TagId("Non-Billable"))),
        active = true,
        userReference,
        None),
      Project(
        ProjectId(),
        "Others",
        org.getReference,
        Set(SimpleTag(TagId("Billable")), SimpleTag(TagId("Non-Billable"))),
        active = true,
        userReference,
        None)
    )

    projectRepository.bulkInsert(projects).map(_ => projects)
  }

  private def initializeUsers(privateOrgs: Map[String, Organisation],
                              publicOrg: Organisation,
                              projects: Seq[Project])(implicit
      dbSession: DBSession): Future[List[User]] = {

    val passwordHash = BCrypt.hashpw(demoPassword, BCrypt.gensalt())

    // Create OAuth users and app users for all demo users
    val usersData = demoUsers.zipWithIndex.map { case (demoUser, index) =>
      val email      = demoUser.email
      val privateOrg = privateOrgs(demoUser.key)

      // Alternate between different project role assignments for variety
      val (adminProjects, memberProjects) = index % 2 match {
        case 0 =>
          (Seq("Lasius", "KnowHow"), Seq("Marketing", "Others"))
        case _ =>
          (Seq("Marketing", "Others"), Seq("Lasius", "KnowHow"))
      }

      // Vary working hours for each user
      val workingHours = index % 3 match {
        case 0 =>
          WorkingHours(monday = 8,
                       tuesday = 8,
                       wednesday = 8,
                       thursday = 8,
                       friday = 8)
        case 1 => WorkingHours(monday = 8, tuesday = 4, wednesday = 2)
        case _ => WorkingHours(monday = 6, wednesday = 6, friday = 6)
      }

      val oauthUser = OAuthUser(
        id = OAuthUserId(),
        email = email,
        password = passwordHash,
        firstName = Some(demoUser.firstName),
        lastName = Some(demoUser.lastName),
        active = true,
      )

      val user = User(
        id = UserId(),
        key = demoUser.key,
        email = email,
        firstName = demoUser.firstName,
        lastName = demoUser.lastName,
        active = true,
        role = FreeUser,
        organisations = Seq(
          UserOrganisation(
            privateOrg.getReference,
            `private` = privateOrg.`private`,
            OrganisationAdministrator,
            WorkingHours(),
            Seq()
          ),
          UserOrganisation(
            publicOrg.getReference,
            publicOrg.`private`,
            OrganisationAdministrator,
            workingHours,
            projects
              .filter(p => adminProjects.contains(p.key))
              .map(p =>
                UserProject(None, p.getReference, ProjectAdministrator)) ++
              projects
                .filter(p => memberProjects.contains(p.key))
                .map(p => UserProject(None, p.getReference, ProjectMember))
          )
        ),
        settings =
          Some(
            UserSettings(lastSelectedOrganisation =
              Some(publicOrg.getReference))),
        acceptedTOS = None
      )

      (oauthUser, user)
    }

    val (oauthUsers, users) = usersData.unzip

    oauthUserRepository.bulkInsert(oauthUsers.toList)
    userRepository.bulkInsert(users.toList).map(_ => users.toList)
  }

  private def initializeTimeBookings(
      org: Organisation,
      projects: Seq[Project],
      users: Seq[User]): Future[Seq[Seq[Seq[Unit]]]] =
    Future {
      users.map(initializeUserTimeBookings(org, projects, _))
    }

  /** Generate time bookings for a given user for the last 60 days
    */
  private def initializeUserTimeBookings(org: Organisation,
                                         projects: Seq[Project],
                                         user: User): Seq[Seq[Unit]] = {
    val now           = DateTime.now()
    val orgRef        = org.getReference
    val random        = new Random
    val userReference = user.getReference
    (1 to 60).map { dayDiff =>
      val day = now.minusDays(dayDiff)
      generateRandomTimeSlots(day).map { timeSlot =>
        // pick random project
        val project = projects(random.nextInt(projects.length))

        // pick a random tag from the list
        val projectTags = random
          .shuffle(project.bookingCategories)
          .take(random.between(1, project.bookingCategories.size))
        val randomPhrase = random.shuffle(randomPhraseList).head

        systemServices.timeBookingViewService ! AddBookingCommand(
          userReference = userReference,
          organisationReference = orgRef,
          projectReference = project.getReference,
          tags = projectTags + randomPhrase,
          start = timeSlot._1,
          end = timeSlot._2
        )
      }
    }
  }

  private def generateRandomTimeSlots(
      day: DateTime): Seq[(DateTime, DateTime)] = {
    val rand       = Random
    val startOfDay = day.withHourOfDay(8).plusMinutes(rand.between(-30, 30))
    val endOfDay   = day.withHourOfDay(17).plusMinutes(rand.between(-90, 75))

    val secondsBetween =
      new Interval(startOfDay, endOfDay).toDuration.getMillis / 1000
    val numberOfSplits = rand.between(2, 10)

    generateTimeSlots(startOfDay,
                      endOfDay,
                      numberOfSplits,
                      secondsBetween,
                      Seq())
  }

  @tailrec
  private def generateTimeSlots(
      start: DateTime,
      end: DateTime,
      numberOfSplits: Int,
      rangeSeconds: Long,
      splits: Seq[(DateTime, DateTime)]): Seq[(DateTime, DateTime)] = {
    val randomBreak = Random.nextInt(300)
    val nextStart   = start.plusSeconds(randomBreak)
    if (numberOfSplits > 0) {
      val workingSeconds =
        Random.between(60, (rangeSeconds - randomBreak) / numberOfSplits).toInt
      val nextEnd = nextStart.plusSeconds(workingSeconds)
      generateTimeSlots(start = nextEnd,
                        end = end,
                        numberOfSplits = numberOfSplits - 1,
                        rangeSeconds = rangeSeconds - workingSeconds,
                        splits = splits :+ (nextStart, nextEnd))
    } else if (end.isAfter(nextStart)) {
      splits :+ (nextStart, end)
    } else {
      splits
    }
  }
}
