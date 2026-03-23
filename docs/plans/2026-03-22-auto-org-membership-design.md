# Auto-add organisation membership on project invite accept

## Problem

When a user accepts a `JoinProjectInvitation`, they must already be an `OrganisationMember` of the project's organisation. If not, acceptance fails with "Need to specify binding organisation when joining a project". This requires a separate org invitation flow before the project invitation can be accepted.

## Solution

Modify `InvitationsController.accept` to auto-assign `OrganisationMember` role when a user accepts a project invitation and isn't yet in the organisation.

## Design

### File: `InvitationsController.scala` — `accept` method

In the `JoinProjectInvitation` case:

1. Look up the organisation from `i.sharedByOrganisationReference`
2. Validate the org exists and is active
3. If `maybeUserOrg` is `None`, call `userRepository.assignUserToOrganisation` with `OrganisationMember` role and default `WorkingHours`
4. Construct the `UserOrganisation` needed for project assignment
5. Proceed with existing project assignment logic

### Role

Always `OrganisationMember` — least privilege. Org admin requires a separate explicit invitation.

### What doesn't change

- `AcceptInvitationRequest` model
- Frontend invitation acceptance flow
- `JoinOrganisationInvitation` flow
- No new API endpoints

### Edge cases

- User already in org: no-op, existing `maybeUserOrg` is `Some`
- Org inactive: fails before auto-add
- Project inactive: fails after org add (user stays in org — acceptable)
