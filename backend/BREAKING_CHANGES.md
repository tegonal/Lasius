# Breaking Changes

## Organization-Scoped Issue Importer Configurations

**Date:** 2025-10-05

**Change:** Issue importer configurations (GitLab, Jira, Plane) now require an `organisationReference` field and are scoped to organizations.

### What Changed

1. **Data Model:**
   - `GitlabConfig`, `JiraConfig`, and `PlaneConfig` now have a required `organisationReference` field
   - Configs belong to a specific organization and can only be accessed by administrators of that organization

2. **API Endpoints:**
   - All issue importer endpoints now require an organization ID in the path
   - Old: `/issue-importers/gitlab`
   - New: `/organisations/:orgId/issue-importers/gitlab`

3. **Authorization:**
   - Changed from global `Administrator` role to organization-scoped `OrganisationAdministrator` role
   - Users can only see and manage configs belonging to their organizations

### Migration Required

**Existing deployments must migrate their data before upgrading.**

For each existing config in the database:
1. Identify the organization by looking at the `projects` array
2. Get the `organisationReference` from any mapped project
3. Add the `organisationReference` field to the config document

**MongoDB Migration Script:**

```javascript
// Run this in MongoDB shell before deploying the updated backend

// Migrate GitLab configs
db.GitlabConfig.find({"organisationReference": {$exists: false}}).forEach(function(config) {
    if (config.projects && config.projects.length > 0) {
        var projectId = config.projects[0].projectId;
        var project = db.Project.findOne({"id.value": projectId.value});
        if (project && project.organisationReference) {
            db.GitlabConfig.updateOne(
                {_id: config._id},
                {$set: {organisationReference: project.organisationReference}}
            );
            print("Migrated GitLab config: " + config._id);
        } else {
            print("ERROR: Cannot migrate GitLab config " + config._id + " - no project found or project has no org");
        }
    } else {
        print("WARNING: GitLab config " + config._id + " has no projects - manual intervention required");
    }
});

// Migrate Jira configs
db.JiraConfig.find({"organisationReference": {$exists: false}}).forEach(function(config) {
    if (config.projects && config.projects.length > 0) {
        var projectId = config.projects[0].projectId;
        var project = db.Project.findOne({"id.value": projectId.value});
        if (project && project.organisationReference) {
            db.JiraConfig.updateOne(
                {_id: config._id},
                {$set: {organisationReference: project.organisationReference}}
            );
            print("Migrated Jira config: " + config._id);
        } else {
            print("ERROR: Cannot migrate Jira config " + config._id + " - no project found or project has no org");
        }
    } else {
        print("WARNING: Jira config " + config._id + " has no projects - manual intervention required");
    }
});

// Migrate Plane configs
db.PlaneConfig.find({"organisationReference": {$exists: false}}).forEach(function(config) {
    if (config.projects && config.projects.length > 0) {
        var projectId = config.projects[0].projectId;
        var project = db.Project.findOne({"id.value": projectId.value});
        if (project && project.organisationReference) {
            db.PlaneConfig.updateOne(
                {_id: config._id},
                {$set: {organisationReference: project.organisationReference}}
            );
            print("Migrated Plane config: " + config._id);
        } else {
            print("ERROR: Cannot migrate Plane config " + config._id + " - no project found or project has no org");
        }
    } else {
        print("WARNING: Plane config " + config._id + " has no projects - manual intervention required");
    }
});

print("Migration complete!");
```

**Verification:**

```javascript
// Check for any remaining unmigrated configs
db.GitlabConfig.count({"organisationReference": {$exists: false}});
db.JiraConfig.count({"organisationReference": {$exists: false}});
db.PlaneConfig.count({"organisationReference": {$exists: false}});

// Should all return 0
```

### Frontend Changes Required

Update API client to use new organization-scoped endpoints:

```typescript
// Before
GET /issue-importers/gitlab
POST /issue-importers/gitlab

// After
GET /organisations/{orgId}/issue-importers/gitlab
POST /organisations/{orgId}/issue-importers/gitlab
```

### Rollback

If you need to rollback, the `organisationReference` field can be safely ignored by older versions of the backend (they will just not use it). However, the API endpoints have changed, so frontend must also be rolled back.
