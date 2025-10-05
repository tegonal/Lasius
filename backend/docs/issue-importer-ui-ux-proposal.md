# Issue Importer Configuration - UI/UX Proposal

## Overview

The issue importer system allows organisations to connect Lasius projects to external issue trackers (GitLab, Jira, Plane). The architecture separates **organisation-level configuration** (API credentials) from **project-level mapping** (which tracker project to sync with).

## Data Model

### Current Architecture
- **One Config → Many Projects**: A single importer config (e.g., "Company GitLab") can serve multiple Lasius projects
- **Shared Credentials**: API keys/tokens are stored at the config level and shared across projects
- **Project-Specific Settings**: Each project mapping includes tracker-specific settings (project ID, filters, etc.)

```
GitlabConfig {
  _id: "config123"
  name: "Company GitLab"
  auth: { accessToken: "token123" }
  baseUrl: "https://gitlab.company.com"
  projects: [
    { projectId: "lasius-A", settings: { gitlabProjectId: "42", ... } },
    { projectId: "lasius-B", settings: { gitlabProjectId: "73", ... } },
    { projectId: "lasius-C", settings: { gitlabProjectId: "91", ... } }
  ]
}
```

## Two-Level UI Architecture

### 1. Organisation Settings (Administrator only)

**Location:** `/organisation/settings/issue-importers`

**Purpose:** Manage shared importer configurations (API keys, base URLs)

**UI Layout:**
```
┌─ Issue Importer Configurations ─────────────────┐
│                                                  │
│ [+ Add Configuration]                            │
│                                                  │
│ ┌─ GitLab - Company Instance ──────────────┐   │
│ │ Name: Company GitLab                      │   │
│ │ URL: https://gitlab.company.com           │   │
│ │ API Token: ••••••••••••                   │   │
│ │ Used by: 3 projects                       │   │
│ │ [Edit] [Delete]                           │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ ┌─ Jira - Client Portal ────────────────────┐   │
│ │ Name: Client Jira                         │   │
│ │ URL: https://client.atlassian.net         │   │
│ │ Auth: OAuth configured                    │   │
│ │ Used by: 1 project                        │   │
│ │ [Edit] [Delete]                           │   │
│ └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Features:**
- List all importer configurations
- Create/Edit/Delete configs (name, URL, API credentials)
- See usage count (how many projects use each config)
- **Cannot** configure project mappings at this level
- Warning when deleting configs that are in use

**User Actions:**
- Add new configuration (opens form with name, URL, auth fields)
- Edit existing configuration (update URL, rotate API token)
- Delete unused configurations
- View which projects are using each config

---

### 2. Project Settings (Project Administrator)

**Location:** `/project/{id}/settings/issue-importer`

**Purpose:** Select organisation config and configure project-specific tracker settings

**UI Layout:**
```
┌─ Issue Importer ─────────────────────────────────┐
│                                                   │
│ Configuration                                     │
│ ┌─────────────────────────────────────────────┐  │
│ │ [Select Configuration ▼]                    │  │
│ │  - Company GitLab                           │  │
│ │  - Client Jira                              │  │
│ │  - Internal Plane                           │  │
│ │  - None (disable importer)                  │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ✓ Using: Company GitLab                          │
│   (https://gitlab.company.com)                   │
│                                                   │
│ Project Settings                                  │
│ ┌─────────────────────────────────────────────┐  │
│ │ GitLab Project ID: 42                       │  │
│ │ Max Results: 100                            │  │
│ │ Project Key Prefix: BACKEND-               │  │
│ │ Additional Params: (optional)               │  │
│ │                                             │  │
│ │ Tag Configuration:                          │  │
│ │ ☑ Use Labels                                │  │
│ │   Label Filter: bug, feature, enhancement   │  │
│ │ ☐ Use Milestone                             │  │
│ │ ☐ Use Title                                 │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ [Test Connection] [Save]                         │
│                                                   │
│ ℹ No organisation configs available?             │
│   Ask your administrator to create one.          │
└───────────────────────────────────────────────────┘
```

**Features:**
- Dropdown to select from available organisation configs
- Show selected config details (name, URL) - read-only
- Configure project-specific settings:
  - **GitLab**: Project ID, label filters, milestone/title usage
  - **Jira**: Project key, JQL query, max results
  - **Plane**: Workspace slug, project ID, filters
- Test connection before saving
- Clear feedback if no configs are available

**User Actions:**
- Select configuration from dropdown
- Enter tracker project identifier (GitLab project ID, Jira project key, etc.)
- Configure tag/label mapping rules
- Test connection to verify settings
- Save project mapping
- Disconnect from importer (select "None")

---

## API Endpoints

### Organisation-Level (Administrator only)

#### List All Configs
```http
GET /issue-importers/gitlab
GET /issue-importers/jira
GET /issue-importers/plane
```
**Response:** Array of configs (without sensitive auth data)

#### Get Single Config
```http
GET /issue-importers/gitlab/{configId}
GET /issue-importers/jira/{configId}
GET /issue-importers/plane/{configId}
```
**Response:** Config details with all project mappings

#### Create Config
```http
POST /issue-importers/gitlab
Content-Type: application/json

{
  "name": "Company GitLab",
  "baseUrl": "https://gitlab.company.com",
  "accessToken": "glpat-xxx",
  "checkFrequency": 300000,
  "projects": []
}
```
**Response:** Created config with ID

#### Update Config
```http
POST /issue-importers/gitlab/{configId}
Content-Type: application/json

{
  "name": "Company GitLab (Updated)",
  "accessToken": "new-token",
  "checkFrequency": 600000
}
```
**Response:** Updated config

#### Delete Config
```http
DELETE /issue-importers/gitlab/{configId}
```
**Response:** 200 OK (fails if config has project mappings)

---

### Project-Level (Project Administrator)

#### Get Config for Specific Project
```http
GET /issue-importers/gitlab/for-project/{projectId}
GET /issue-importers/jira/for-project/{projectId}
GET /issue-importers/plane/for-project/{projectId}
```
**Response:** Config containing mapping for this project, or 404 if not configured

#### Add Project Mapping
```http
POST /issue-importers/gitlab/{configId}/projects
Content-Type: application/json

{
  "projectId": "uuid-of-lasius-project",
  "settings": {
    "gitlabProjectId": "42",
    "maxResults": 100,
    "projectKeyPrefix": "BACKEND-",
    "tagConfiguration": {
      "useLabels": true,
      "labelFilter": ["bug", "feature"],
      "useMilestone": false,
      "useTitle": false
    }
  }
}
```
**Response:** Updated config with new mapping

#### Update Project Mapping
```http
POST /issue-importers/gitlab/{configId}/projects/{projectId}
Content-Type: application/json

{
  "gitlabProjectId": "73",
  "maxResults": 200,
  "tagConfiguration": { ... }
}
```
**Response:** Updated config

#### Remove Project Mapping
```http
DELETE /issue-importers/gitlab/{configId}/projects/{projectId}
```
**Response:** Updated config without this project mapping

---

## User Flows

### Flow 1: Organisation Admin Sets Up GitLab Integration

1. Navigate to `/organisation/settings/issue-importers`
2. Click **[+ Add Configuration]**
3. Select importer type (GitLab)
4. Fill in form:
   - Name: "Company GitLab"
   - Base URL: "https://gitlab.company.com"
   - Access Token: "glpat-xxxx"
   - Check Frequency: 5 minutes
5. Click **[Save]**
6. Config is created and available to all projects in organisation

### Flow 2: Project Admin Connects Project to GitLab

1. Navigate to `/project/{id}/settings/issue-importer`
2. See dropdown with available configs
3. Select "Company GitLab" from dropdown
4. Config details appear (URL shown, token hidden)
5. Fill in project-specific settings:
   - GitLab Project ID: 42
   - Max Results: 100
   - Enable "Use Labels"
   - Label Filter: "bug, feature"
6. Click **[Test Connection]** → Success ✓
7. Click **[Save]**
8. Mapping is created in the config's `projects` array

### Flow 3: Project Admin Discovers No Configs Available

1. Navigate to `/project/{id}/settings/issue-importer`
2. Dropdown shows: "No configurations available"
3. See message: "ℹ Ask your organisation administrator to create an importer configuration"
4. Link to organisation settings (if user has permission)

### Flow 4: Organisation Admin Updates API Token

1. Navigate to `/organisation/settings/issue-importers`
2. Click **[Edit]** on "Company GitLab" config
3. Update Access Token field
4. Click **[Save]**
5. All projects using this config now use the new token
6. No project-level changes needed

### Flow 5: Project Admin Disconnects Importer

1. Navigate to `/project/{id}/settings/issue-importer`
2. See current config: "Company GitLab"
3. Select "None (disable importer)" from dropdown
4. Click **[Save]**
5. Mapping is removed from config
6. Project no longer syncs issues

---

## Benefits

### ✅ Clear Separation of Concerns
- **Org Admins:** Manage credentials and infrastructure
- **Project Admins:** Configure project-specific settings
- No credential exposure to project admins

### ✅ No Duplication
- One API key serves many projects
- Update token once, affects all projects
- Consistent connection settings

### ✅ Simple Project UX
- Just pick a config + set project ID
- No need to know API credentials
- Clear visual feedback

### ✅ Flexibility
- Can have multiple configs (internal + external GitLab)
- Each project can use different configs
- Easy to switch between configs

### ✅ Security
- Project admins never see API tokens
- Credentials stored at organisation level
- Clear audit trail of who uses what

---

## Additional Considerations

### Config Deletion Protection
- Prevent deletion of configs with active project mappings
- Show warning: "This config is used by 3 projects. Remove all mappings first."
- Alternative: Cascade delete (remove all mappings)

### Permission Model
- **Administrator (Org or Project):** Full access to read/write configs and mappings
- Consider more granular roles in future:
  - **Org Admin:** Manage configs
  - **Project Admin:** Manage mappings for their projects

### Error Handling
- Test connection before saving project mapping
- Show clear errors if GitLab project ID is invalid
- Validate API token when creating/updating config

### Migration Path
- If existing projects have embedded configs, migrate to shared configs
- Provide migration tool/script
- Document migration process

---

## Next Steps - Frontend Implementation

1. **Create Organisation Settings Page**
   - List all importer configs
   - CRUD operations for configs
   - Show usage count per config

2. **Create Project Settings Page**
   - Dropdown to select config
   - Dynamic form based on importer type (GitLab/Jira/Plane)
   - Test connection functionality
   - Save/update project mapping

3. **Add Helper Endpoint**
   - `GET /issue-importers/{type}/for-project/{projectId}`
   - Returns config + mapping for specific project
   - Simplifies frontend data fetching

4. **Shared Components**
   - Config selector dropdown
   - Connection status indicator
   - Tag configuration form (reusable across importers)

5. **API Client Integration**
   - Type-safe API calls
   - Error handling
   - Loading states
