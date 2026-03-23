# Auto Org Membership on Project Invite Accept — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When a user accepts a project invitation and isn't yet a member of the project's organisation, automatically add them as `OrganisationMember`.

**Architecture:** Modify the `JoinProjectInvitation` case in `InvitationsController.accept` to look up the org from `sharedByOrganisationReference`, validate it's active, and auto-assign if `maybeUserOrg` is `None`. No model changes, no new endpoints, no frontend changes.

**Tech Stack:** Scala 2.13, Play Framework 3, ReactiveMongo, Specs2

---

### Task 1: Update the existing test expectation

The test `"badrequest if no organisationReference was provided"` currently expects a 400 error when no org reference is given. With the new behavior, this should succeed (auto-add to org). We need to update this test first.

**Files:**
- Modify: `backend/test/controllers/InvitationsControllerSpec.scala:598-621`

**Step 1: Update the test to expect success with auto-org-membership**

Replace the test at line 598-621 with a test that:
- Creates a NEW project (not the default one the user is already assigned to)
- Creates a project invitation with `invitedEmail = controller.user.email`
- Sends `AcceptInvitationRequest(organisationReference = None)`
- Expects `OK` (200)
- Verifies the user was added to the org as `OrganisationMember`
- Verifies the user was added to the project with the correct role

But first — this test uses the mock user who is ALREADY in the org (`controller.organisation`). We need a setup where the user is NOT in the invitation's org. The trick: create a second organisation and project, and create the invitation referencing those. The mock user only belongs to `controller.organisation`.

```scala
"auto-add user to organisation when no organisationReference provided" in new WithTestApplication {
  implicit val executionContext: ExecutionContext =
    inject[ExecutionContext]
  val systemServices: SystemServices        = inject[SystemServices]
  val authConfig: AuthConfig                = inject[AuthConfig]
  val controller: InvitationsControllerMock =
    controllers.InvitationsControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

  // Create a second organisation the user is NOT a member of
  val otherOrg = Organisation(
    id = OrganisationId(),
    key = "otherOrg",
    `private` = false,
    active = true,
    createdBy = controller.userReference,
    deactivatedBy = None
  )
  withDBSession()(implicit dbSession =>
    controller.organisationRepository.upsert(otherOrg)).awaitResult()

  val project = Project(
    id = ProjectId(),
    key = "otherProject",
    organisationReference = otherOrg.getReference,
    bookingCategories = Set(),
    active = true,
    createdBy = controller.userReference,
    deactivatedBy = None
  )
  withDBSession()(implicit dbSession =>
    controller.projectRepository.upsert(project)).awaitResult()

  // Create invitation referencing otherOrg
  val invitationId = InvitationId()
  withDBSession() { implicit dbSession =>
    controller.invitationRepository.upsert(
      JoinProjectInvitation(
        id = invitationId,
        invitedEmail = controller.user.email,
        createDate = DateTime.now(),
        createdBy = controller.userReference,
        expiration = DateTime.now().plusDays(1),
        sharedByOrganisationReference = otherOrg.getReference,
        projectReference = project.getReference,
        role = ProjectMember,
        outcome = None
      ))
  }.awaitResult()

  val request: FakeRequest[AcceptInvitationRequest] = FakeRequest()
    .withBody(AcceptInvitationRequest(organisationReference = None))
  val result: Future[Result] =
    controller.accept(invitationId)(request)

  status(result) must equalTo(OK)
  val invitation = contentAsJson(result).as[Invitation]
  invitation.outcome must beSome
  invitation.outcome.get.status === InvitationAccepted

  // verify user is now a member of otherOrg
  val user = withDBSession()(implicit dbSession =>
    controller.userRepository.findById(controller.userId))
    .awaitResult()
    .get

  val userOrg = user.organisations
    .find(_.organisationReference.id == otherOrg.id)
  userOrg must beSome
  userOrg.get.role === OrganisationMember

  // verify user is assigned to project
  val userProject =
    userOrg.get.projects.find(_.projectReference.id == project.id)
  userProject must beSome
  userProject.get.role === ProjectMember
}
```

**Step 2: Run the test to verify it fails**

Run: `sbt "testOnly controllers.InvitationsControllerSpec -- ex 'auto-add user to organisation'"`
Expected: FAIL — the controller still throws `ValidationFailedException`

**Step 3: Commit the failing test**

```bash
git add backend/test/controllers/InvitationsControllerSpec.scala
git commit -m "test: add failing test for auto-org-membership on project invite accept"
```

---

### Task 2: Implement auto-org-membership in InvitationsController

**Files:**
- Modify: `backend/app/controllers/InvitationsController.scala:107-126`

**Step 1: Modify the JoinProjectInvitation case**

Replace lines 107-126 in `InvitationsController.scala`:

```scala
case i: JoinProjectInvitation =>
  for {
    // Look up the organisation from the invitation
    org <- organisationRepository
      .findById(i.sharedByOrganisationReference.id)
      .noneToFailed(
        s"Organisation ${i.sharedByOrganisationReference.key} does not exist")
    _ <- validate(
      org.active,
      s"Cannot join inactive organisation ${i.sharedByOrganisationReference.key}")
    // Auto-add to organisation if not already a member
    userOrg <- maybeUserOrg match {
      case Some(uo) => Future.successful(uo)
      case None =>
        for {
          _ <- userRepository.assignUserToOrganisation(
            user.id,
            org,
            OrganisationMember,
            WorkingHours())
        } yield UserOrganisation(
          organisationReference = org.getReference,
          `private` = org.`private`,
          role = OrganisationMember,
          plannedWorkingHours = WorkingHours(),
          projects = Seq())
    }
    project <- projectRepository
      .findById(i.projectReference.id)
      .noneToFailed(
        s"Project ${i.projectReference.key} does not exist")
    _ <- validate(
      project.active,
      s"Cannot join inactive project ${i.projectReference.key}")
    result <- userRepository.assignUserToProject(
      user.id,
      userOrg.organisationReference,
      i.projectReference,
      i.role)
  } yield result
```

**Step 2: Run the new test to verify it passes**

Run: `sbt "testOnly controllers.InvitationsControllerSpec -- ex 'auto-add user to organisation'"`
Expected: PASS

**Step 3: Run all invitation tests to verify no regressions**

Run: `sbt "testOnly controllers.InvitationsControllerSpec"`
Expected: All tests PASS (the old "badrequest if no organisationReference" test was replaced in Task 1)

**Step 4: Commit**

```bash
git add backend/app/controllers/InvitationsController.scala
git commit -m "feat: auto-add user to organisation when accepting project invitation"
```

---

### Task 3: Add test for inactive org in auto-add scenario

**Files:**
- Modify: `backend/test/controllers/InvitationsControllerSpec.scala`

**Step 1: Add a test for inactive organisation**

Add this test inside the `"for JoinProjectInvitation"` block:

```scala
"badrequest if invitation's organisation is inactive and user not a member" in new WithTestApplication {
  implicit val executionContext: ExecutionContext =
    inject[ExecutionContext]
  val systemServices: SystemServices        = inject[SystemServices]
  val authConfig: AuthConfig                = inject[AuthConfig]
  val controller: InvitationsControllerMock =
    controllers.InvitationsControllerMock(config,
                                          systemServices,
                                          authConfig,
                                          reactiveMongoApi)

  val inactiveOrg = Organisation(
    id = OrganisationId(),
    key = "inactiveOrg",
    `private` = false,
    active = false,
    createdBy = controller.userReference,
    deactivatedBy = None
  )
  withDBSession()(implicit dbSession =>
    controller.organisationRepository.upsert(inactiveOrg)).awaitResult()

  val project = Project(
    id = ProjectId(),
    key = "someProject",
    organisationReference = inactiveOrg.getReference,
    bookingCategories = Set(),
    active = true,
    createdBy = controller.userReference,
    deactivatedBy = None
  )
  withDBSession()(implicit dbSession =>
    controller.projectRepository.upsert(project)).awaitResult()

  val invitationId = InvitationId()
  withDBSession() { implicit dbSession =>
    controller.invitationRepository.upsert(
      JoinProjectInvitation(
        id = invitationId,
        invitedEmail = controller.user.email,
        createDate = DateTime.now(),
        createdBy = controller.userReference,
        expiration = DateTime.now().plusDays(1),
        sharedByOrganisationReference = inactiveOrg.getReference,
        projectReference = project.getReference,
        role = ProjectMember,
        outcome = None
      ))
  }.awaitResult()

  val request: FakeRequest[AcceptInvitationRequest] = FakeRequest()
    .withBody(AcceptInvitationRequest(organisationReference = None))
  val result: Future[Result] =
    controller.accept(invitationId)(request)

  status(result) must equalTo(BAD_REQUEST)
  contentAsString(result) must equalTo(
    s"Cannot join inactive organisation inactiveOrg")
}
```

**Step 2: Run the test**

Run: `sbt "testOnly controllers.InvitationsControllerSpec -- ex 'inactive and user not a member'"`
Expected: PASS (controller already validates org.active)

**Step 3: Run full test suite**

Run: `sbt "testOnly controllers.InvitationsControllerSpec"`
Expected: All PASS

**Step 4: Commit**

```bash
git add backend/test/controllers/InvitationsControllerSpec.scala
git commit -m "test: add coverage for inactive org in auto-add scenario"
```
