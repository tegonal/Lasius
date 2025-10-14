# Issue Importer API Reference

This document provides a comprehensive reference for all supported issue tracking platforms, their API requirements, authentication methods, and implementation-specific details.

**Last Verified**: 2025-10-09
**Verification Status**:
- ✅ GitLab API documentation verified online
- ✅ GitHub API documentation verified online
- ✅ Plane API documentation verified online
- ⚠️ Jira OAuth 1.0a deprecated (documented for Server/DC compatibility)
- ✅ All code references verified against codebase
- ✅ Direct links to implementation files included

## Table of Contents

1. [Token/API Key Setup Guide](#tokenapi-key-setup-guide)
2. [GitLab](#gitlab)
3. [Jira](#jira)
4. [Plane](#plane)
5. [GitHub](#github)
6. [Comparison Matrix](#comparison-matrix)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Token/API Key Setup Guide

This section provides verified, step-by-step instructions for creating authentication credentials for each platform.

### GitLab - Personal Access Token

**Last Verified**: 2025-10-09
**Official Documentation**: https://docs.gitlab.com/user/profile/personal_access_tokens/

#### Step-by-Step Instructions

1. **Navigate to Token Settings**
   - Click your **avatar** (top-right corner)
   - Select **"Edit profile"**
   - Click **"Access tokens"** in the left sidebar

2. **Create New Token**
   - Click **"Add new token"** button

3. **Configure Token Details**
   - **Token name**: Enter a descriptive name (e.g., "Lasius Integration")
   - **Description** (optional): Add notes about usage
   - **Expiration date**: Set expiration (defaults to 365 days, max 400 days)
     - ⚠️ **Important**: Non-expiring tokens were removed in GitLab 16.0

4. **Select Required Scopes**
   - ✅ **Minimum (Recommended)**: `read_api`
     - Read-only access to the API (sufficient for Lasius)
   - **Alternative**: `api`
     - Complete read/write API access (not needed for Lasius)

5. **Generate and Save Token**
   - Click **"Create personal access token"**
   - ⚠️ **CRITICAL**: Copy the token immediately
   - 🔒 **Security**: Token is shown only once and cannot be retrieved later

#### What You'll Need for Lasius
- **Base URL**: Your GitLab instance URL (e.g., `https://gitlab.com` or `https://gitlab.example.com`)
- **Access Token**: The token you just created
- **Project ID**: Numeric ID or namespace/project path

#### Token Format
```
glpat-xxxxxxxxxxxxxxxxxxxx
```

#### Security Best Practices
- ✅ Use `read_api` scope (not `api`)
- ✅ Set reasonable expiration (90-365 days)
- ✅ Rotate tokens regularly
- ❌ Never commit tokens to version control
- ❌ Never share tokens in plain text

---

### GitHub - Fine-Grained Personal Access Token

**Last Verified**: 2025-10-09
**Official Documentation**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

#### Step-by-Step Instructions

1. **Verify Email** (if not already done)
   - GitHub requires verified email for token creation

2. **Navigate to Token Settings**
   - Click your **profile picture** (top-right corner)
   - Select **"Settings"**
   - Click **"Developer settings"** (bottom of left sidebar)
   - Click **"Personal access tokens"**
   - Select **"Fine-grained tokens"**

3. **Generate New Token**
   - Click **"Generate new token"**

4. **Configure Token Details**
   - **Token name**: Enter descriptive name (e.g., "Lasius Issue Importer")
   - **Expiration**: Select duration (default 30 days, max 1 year)
   - **Description** (optional): Add usage notes

5. **Set Resource Owner**
   - Choose your **user account** or **organization**

6. **Configure Repository Access**
   - Select repositories this token can access:
     - **"All repositories"** - Access to all repos (simpler setup)
     - **"Only select repositories"** - Choose specific repos (more secure)

7. **Set Permissions (Scopes)**
   - ✅ **Required for Lasius**:
     - `Repository permissions`:
       - **Metadata**: Read (automatically included)
       - **Issues**: Read
       - **Contents**: Read (if you want to access repo metadata)

   - **NOT Required**:
     - Write permissions (Lasius only reads)
     - Actions, Deployments, etc.

8. **Generate Token**
   - Click **"Generate token"**
   - ⚠️ **CRITICAL**: Copy the token immediately
   - 🔒 **Security**: Token shown only once

#### What You'll Need for Lasius
- **Base URL**: `https://api.github.com` (for GitHub.com)
  - For GitHub Enterprise: `https://github.example.com/api/v3`
- **Access Token**: The fine-grained PAT you just created
- **Repository Owner**: GitHub username or organization (e.g., "facebook")
- **Repository Name**: Repository name (e.g., "react")

#### Token Format
```
github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Important Notes
- 📊 **Limit**: Maximum 50 fine-grained tokens per account
- 🔄 **Rate Limit**: 5,000 requests/hour with authenticated token
- 🔒 **Permissions**: Use most restrictive permissions possible

#### Security Best Practices
- ✅ Use fine-grained tokens (not classic tokens)
- ✅ Select only required repositories
- ✅ Use minimal permissions (Issues: Read only)
- ✅ Set expiration (30-90 days recommended)
- ❌ Never use `repo` scope (too broad)

---

### Jira - OAuth Setup

**Last Verified**: 2025-10-09
**Official Documentation**:
- OAuth 2.0 (Recommended): https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
- OAuth 1.0a (Legacy): https://developer.atlassian.com/cloud/jira/software/jira-rest-api-oauth-authentication/

⚠️ **IMPORTANT**: This implementation currently uses **OAuth 1.0a** for compatibility with **Jira Server/Data Center**. For new **Jira Cloud** integrations, migrate to **OAuth 2.0 (3LO)**.

#### OAuth 2.0 (3LO) - Recommended for Jira Cloud

**Step-by-Step Instructions**

1. **Access Atlassian Developer Console**
   - Go to https://developer.atlassian.com/
   - Click your **profile icon** (top-right)
   - Select **"Developer console"**

2. **Create New App**
   - Click **"Create"** button
   - Select **"OAuth 2.0 integration"**
   - Enter app name (e.g., "Lasius Issue Importer")

3. **Enable OAuth 2.0 (3LO)**
   - Select your app from the list
   - Click **"Authorization"** in left menu
   - Next to **"OAuth 2.0 (3LO)"**, click **"Configure"**

4. **Set Callback URL**
   - Enter your **Callback URL** (redirect URI)
   - Example: `https://your-app.com/oauth/callback`
   - ⚠️ This must match exactly when implementing OAuth flow

5. **Configure Permissions (Scopes)**
   - Click **"Permissions"** tab
   - ✅ **Required for Lasius**:
     - `read:jira-work` - Read Jira project and issue data
     - `read:jira-user` - Read user information

   - Full list: https://developer.atlassian.com/cloud/jira/platform/scopes-for-oauth-2-3LO-and-forge-apps/

6. **Get Credentials**
   - Navigate to **"Settings"** → **"Authentication Details"**
   - Copy **Client ID** and **Client Secret**

#### OAuth 1.0a - Current Implementation (Jira Server/DC)

**Prerequisites**
- RSA key pair (public/private keys)
- Application link configured in Jira

**Step-by-Step Instructions**

1. **Generate RSA Key Pair**
   ```bash
   # Generate private key
   openssl genrsa -out jira_privatekey.pem 2048

   # Generate public key
   openssl req -newkey rsa:2048 -x509 -key jira_privatekey.pem -out jira_publickey.cer -days 365

   # Extract public key in PEM format
   openssl x509 -pubkey -noout -in jira_publickey.cer > jira_publickey.pem
   ```

2. **Configure Application Link in Jira**
   - Log in as Jira administrator
   - Go to **"Administration"** → **"Applications"** → **"Application links"**
   - Enter your application URL
   - Click **"Create new link"**

3. **Configure OAuth Settings**
   - **Consumer Key**: Your chosen identifier (e.g., "lasius-importer")
   - **Consumer Name**: Display name (e.g., "Lasius Issue Importer")
   - **Public Key**: Paste contents of `jira_publickey.pem`

4. **Perform OAuth Dance** (3-legged flow)
   - Request temporary token
   - User authorizes application
   - Exchange for access token

#### What You'll Need for Lasius

**OAuth 2.0 (Future)**:
- Base URL: `https://<site>.atlassian.net`
- Client ID
- Client Secret
- Access Token (from OAuth flow)

**OAuth 1.0a (Current)**:
- **Base URL**: `https://<site>.atlassian.net` (Cloud) or custom (Server/DC)
- **Consumer Key**: Your application key
- **Private Key**: RSA private key (PEM format)
- **Access Token**: OAuth access token
- **Project Key**: Jira project identifier (e.g., "PROJ")

#### Security Best Practices
- ✅ Use OAuth 2.0 for new Cloud integrations
- ✅ Store private keys securely (encrypted)
- ✅ Use minimal required scopes
- ✅ Rotate credentials regularly
- ❌ Never commit private keys to version control

---

### Plane - API Key

**Last Verified**: 2025-10-09
**Official Documentation**: https://developers.plane.so/api-reference/introduction

#### Step-by-Step Instructions

1. **Log Into Plane**
   - Go to your Plane instance (e.g., `https://app.plane.so`)
   - Log in with your credentials

2. **Navigate to Token Settings**
   - Click your **profile/avatar**
   - Select **"Profile Settings"**
   - Click **"Personal Access Tokens"** tab

3. **Create New Token**
   - Click **"Add personal access token"** button

4. **Configure Token Details**
   - **Title**: Enter descriptive name (e.g., "Lasius Integration")
   - **Description** (optional): Add usage notes
   - **Expiration** (optional): Set expiration date
     - ⚠️ No expiration = token never expires (less secure)

5. **Generate and Save Token**
   - Click **"Generate token"** or **"Create"**
   - ⚠️ **CRITICAL**: Copy the token immediately
   - 🔒 **Security**: Token may only be shown once

#### What You'll Need for Lasius
- **Base URL**: Your Plane instance URL
  - SaaS: `https://app.plane.so`
  - Self-hosted: Your custom URL (e.g., `https://plane.example.com`)
- **API Key**: The token you just created
- **Workspace Slug**: URL-friendly workspace identifier (e.g., "my-workspace")
- **Project ID**: UUID of the project

#### Token Format
```
plane_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Finding Workspace and Project IDs

**Workspace Slug**:
- Found in URL: `https://app.plane.so/<workspace-slug>/projects`
- Example: If URL is `https://app.plane.so/acme-corp/projects`, slug is `acme-corp`

**Project ID**:
- Found in URL: `https://app.plane.so/<workspace>/<project-id>/issues`
- Format: UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- Or use Plane's "List Projects" API to fetch IDs

#### Security Best Practices
- ✅ Set expiration dates for tokens
- ✅ Use separate tokens per integration
- ✅ Regenerate if compromised
- ✅ API key inherits user permissions (use service account if possible)
- ❌ Never expose in client-side code
- ❌ Never commit to version control

---

## GitLab

### API Documentation
- **Official Docs**: https://docs.gitlab.com/ee/api/
- **Issues API**: https://docs.gitlab.com/ee/api/issues.html (verified 2025-10-09)
- **Projects API**: https://docs.gitlab.com/ee/api/projects.html
- **Authentication**: https://docs.gitlab.com/api/rest/authentication/
- **API Version**: v4 (current, no deprecation planned)

### Authentication
- **Type**: Personal Access Token (PAT)
- **Header**: `PRIVATE-TOKEN: <token>`
- **Scopes Required**: `read_api` (minimum), `api` (recommended for full access)
- **Token Creation**: User Settings → Access Tokens

### Base URL
- **SaaS**: `https://gitlab.com`
- **Self-Hosted**: Custom (e.g., `https://gitlab.example.com`)
- **API Path**: `/api/v4/`

### Endpoint Structure
```
GET /api/v4/projects/:id/issues
```

### Key Features
- **Project Identification**: Integer project ID or URL-encoded namespace/project path
- **Issue Reference**: `#<iid>` (internal ID, not global ID)
- **Pagination**: Header-based with `X-Total`, `X-Page`, `X-Next-Page`, `X-Prev-Page`
- **Max Results**: `per_page` parameter (default: 20, max: 100)
- **State Filter**: `state=opened|closed|all`
- **Label Support**: Native label filtering with `labels` parameter

### Request Example
```bash
curl --header "PRIVATE-TOKEN: <token>" \
  "https://gitlab.com/api/v4/projects/123/issues?state=opened&per_page=50"
```

### Response Headers
```
X-Total: 42
X-Total-Pages: 3
X-Per-Page: 20
X-Page: 1
X-Next-Page: 2
X-Prev-Page: null
```

### Lasius Implementation
- **Config Model**: [`GitlabConfig`](../app/models/GitlabConfig.scala)
- **Auth Model**: `GitlabAuth(accessToken: String)` - [see GitlabConfig.scala](../app/models/GitlabConfig.scala#L50)
- **Project Service**: [`GitlabProjectService`](../app/services/GitlabProjectService.scala) - Handles connectivity testing and project listing
- **Worker**: [`GitlabTagParseWorker`](../app/actors/scheduler/gitlab/GitlabTagParseWorker.scala)
- **API Service**: [`GitlabApiServiceImpl`](../app/actors/scheduler/gitlab/GitlabApiService.scala)
- **Tag Type**: `GitlabIssueTag` - [see Tags.scala](../app/models/Tags.scala#L83-L96)
- **Scheduler**: [`GitlabTagParseScheduler`](../app/actors/scheduler/gitlab/GitlabTagParseScheduler.scala)

### Pagination Strategy
- **Start Page**: 0 (though API uses 1-indexed)
- **Strategy**: Check `X-Next-Page` header, load until `totalPages` reached
- **Implementation**: `loadIssues` recursive method

### Known Issues
1. **Project ID vs Path**: Must use numeric ID for API calls (encoded path also works)
2. **Rate Limiting**: 300 requests/minute for authenticated users
3. **Label Filtering**: Case-sensitive string matching

---

## Jira

### API Documentation
- **Official Docs**: https://developer.atlassian.com/cloud/jira/platform/rest/v2/
- **Issues API**: https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issues/
- **JQL Reference**: https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/
- **OAuth 1.0a (DEPRECATED)**: https://developer.atlassian.com/cloud/jira/software/jira-rest-api-oauth-authentication/
- **OAuth 2.0 (RECOMMENDED)**: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/
- **API Version**: v2 (Cloud stable), v3 (Cloud available), v2/v3 (Server/Data Center)

⚠️ **IMPORTANT**: OAuth 1.0a is deprecated for Jira Cloud as of 2025. This implementation uses OAuth 1.0a for backward compatibility with Jira Server/Data Center. For new Jira Cloud integrations, migrate to OAuth 2.0.

### Authentication
- **Type**: OAuth 1.0a (3-legged)
- **Parameters Required**:
  - `consumerKey`: OAuth consumer key
  - `privateKey`: RSA private key (PEM format)
  - `accessToken`: OAuth access token
  - `tokenSecret`: OAuth token secret (empty for initial test)
- **OAuth Setup**: https://developer.atlassian.com/cloud/jira/platform/jira-rest-api-oauth-authentication/

### Base URL
- **Cloud**: `https://<site>.atlassian.net`
- **Server/DC**: Custom (e.g., `https://jira.example.com`)
- **API Path**: `/rest/api/2/`

### Endpoint Structure
```
GET /rest/api/2/issue/{issueIdOrKey}
GET /rest/api/2/search?jql=<query>
```

### Key Features
- **Project Identification**: Project key (e.g., "PROJ")
- **Issue Reference**: `<PROJECT>-<number>` (e.g., "PROJ-123")
- **Query Language**: JQL (Jira Query Language) for advanced filtering
- **Pagination**: `startAt` and `maxResults` parameters
- **Max Results**: Default 50, max 100 (configurable)
- **Field Selection**: Can limit returned fields with `fields` parameter

### Request Example
```bash
curl -X GET \
  "https://example.atlassian.net/rest/api/2/search?jql=project=PROJ+AND+status=Open" \
  -H "Authorization: OAuth oauth_consumer_key=..., oauth_token=..."
```

### JQL Examples
```
project = "PROJ" AND status = "Open"
assignee = currentUser() ORDER BY created DESC
labels = "urgent" AND sprint is EMPTY
```

### Lasius Implementation
- **Config Model**: [`JiraConfig`](../app/models/JiraConfig.scala)
- **Auth Model**: `JiraAuth(consumerKey, privateKey, accessToken)` - [see JiraConfig.scala](../app/models/JiraConfig.scala#L27-L31)
- **Project Service**: [`JiraProjectService`](../app/services/JiraProjectService.scala) - Handles connectivity testing and project listing
- **Worker**: [`JiraTagParseWorker`](../app/actors/scheduler/jira/JiraTagParseWorker.scala)
- **API Service**: [`JiraApiServiceImpl`](../app/actors/scheduler/jira/JiraApiService.scala)
- **Tag Type**: `JiraIssueTag` - [see Tags.scala](../app/models/Tags.scala#L100-L111)
- **Scheduler**: [`JiraTagParseScheduler`](../app/actors/scheduler/jira/JiraTagParseScheduler.scala)
- **OAuth Helper**: `WebServiceHelper.callWithOAuth` - [see WebServiceHelper.scala](../app/actors/scheduler/WebServiceHelper.scala)

### Pagination Strategy
- **Start Page**: 0-indexed (`startAt`)
- **Strategy**: Increment `startAt` by `maxResults` until all fetched
- **No Total Count**: Must fetch until results < maxResults

### Known Issues
1. **OAuth Complexity**: Requires RSA key pair and OAuth flow setup
2. **JQL Syntax**: Complex query language, user errors common
3. **Rate Limiting**: 10 requests/second for Cloud (varies by plan)
4. **Cloud vs Server**: API differences between deployment types
5. **Field Customization**: Custom fields require additional configuration

---

## Plane

### API Documentation
- **Official Docs**: https://docs.plane.so/
- **API Reference**: https://developers.plane.so/api-reference/introduction (verified 2025-10-09)
- **Issues API**: https://developers.plane.so/api-reference/issues
- **API Version**: v1

### Authentication
- **Type**: API Key
- **Header**: `X-API-Key: <key>` (note: uppercase X)
- **Format**: `plane_api_<token>`
- **Key Creation**: Profile Settings → API Keys (must be logged in)
- **Permissions**: API key inherits user permissions

### Base URL
- **SaaS**: `https://app.plane.so`
- **Self-Hosted**: Custom (e.g., `https://plane.example.com`)
- **API Path**: `/api/v1/`

### Endpoint Structure
```
GET /api/v1/workspaces/
GET /api/v1/workspaces/{workspace_slug}/projects/
GET /api/v1/workspaces/{workspace_slug}/projects/{project_id}/issues/
```

### Key Features
- **Workspace Structure**: Hierarchical (Workspace → Project → Issue)
- **Workspace ID**: Slug-based (e.g., "my-workspace")
- **Project ID**: UUID format
- **Issue Reference**: UUID-based IDs (not human-readable numbers)
- **Pagination**: Standard `page` and `per_page` parameters
- **Label Support**: Native label filtering with label IDs

### Request Example
```bash
curl --header "x-api-key: <key>" \
  "https://app.plane.so/api/v1/workspaces/my-workspace/projects/"
```

### Workspace Example Response
```json
[
  {
    "slug": "my-workspace",
    "name": "My Workspace",
    "id": "uuid-here"
  }
]
```

### Lasius Implementation
- **Config Model**: [`PlaneConfig`](../app/models/PlaneConfig.scala)
- **Auth Model**: `PlaneAuth(apiKey: String)` - [see PlaneConfig.scala](../app/models/PlaneConfig.scala#L48-L50)
- **Project Service**: [`PlaneProjectService`](../app/services/PlaneProjectService.scala) - Handles connectivity testing and workspace/project listing
- **Worker**: [`PlaneTagParseWorker`](../app/actors/scheduler/plane/PlaneTagParseWorker.scala)
- **API Service**: [`PlaneApiServiceImpl`](../app/actors/scheduler/plane/PlaneApiService.scala)
- **Tag Type**: `PlaneIssueTag` - [see Tags.scala](../app/models/Tags.scala#L114-L127)
- **Scheduler**: [`PlaneTagParseScheduler`](../app/actors/scheduler/plane/PlaneTagParseScheduler.scala)
- **Settings**: `PlaneProjectSettings(planeWorkspace, planeProjectId, ...)` - [see PlaneConfig.scala](../app/models/PlaneConfig.scala#L27-L34)

### Pagination Strategy
- **Start Page**: 1-indexed
- **Strategy**: Fetch workspaces, then fetch projects per workspace
- **Implementation**: Nested `flatMap` to handle workspace → project hierarchy

### Known Issues
1. **Workspace Discovery**: Must fetch all workspaces first, then projects per workspace
2. **UUID-based IDs**: Not human-readable, harder to reference manually
3. **Rate Limiting**: 100 requests/minute (varies by deployment)
4. **API Stability**: Newer platform, API may evolve
5. **Limited Documentation**: Less comprehensive than GitLab/Jira

---

## GitHub

### API Documentation
- **Official Docs**: https://docs.github.com/en/rest
- **Issues API**: https://docs.github.com/en/rest/issues/issues (verified 2025-10-09)
- **Repositories API**: https://docs.github.com/en/rest/repos/repos
- **Authentication**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- **API Version**: REST API v3 (current stable)
- **Note**: GraphQL API v4 available but not used in this implementation

### Authentication
- **Type**: Fine-grained Personal Access Token (PAT)
- **Header**: `Authorization: Bearer <token>`
- **Scopes Required**:
  - `Issues`: Read access
  - `Metadata`: Read access (repository metadata)
- **Token Creation**: Settings → Developer settings → Personal access tokens → Fine-grained tokens
- **Token Docs**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

### Base URL
- **SaaS**: `https://api.github.com`
- **GitHub Enterprise**: Custom (e.g., `https://github.example.com/api/v3`)
- **API Path**: Direct (no version prefix for SaaS)

### Endpoint Structure
```
GET /repos/{owner}/{repo}/issues
GET /user/repos
GET /user
```

### Key Features
- **Repository Identification**: `owner/repo` format (e.g., "facebook/react")
- **Issue Reference**: `#<number>` (sequential per repository)
- **Pagination**: Link header-based (RFC 5988) and page-based
- **Max Results**: `per_page` parameter (default: 30, max: 100) ✅ verified
- **State Filter**: `state=open|closed|all` ✅ verified (default: open)
- **Label Support**: Native label filtering with `labels` parameter (comma-separated)
- **Pull Requests**: ⚠️ Issues API includes PRs (can filter with `is:issue` in search API) ✅ verified

### Request Example
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.github.com/repos/facebook/react/issues?state=open&per_page=50"
```

### Response Headers
```
Link: <https://api.github.com/repos/.../issues?page=2>; rel="next",
      <https://api.github.com/repos/.../issues?page=5>; rel="last"
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1372700873
```

### Lasius Implementation
- **Config Model**: [`GithubConfig`](../app/models/GithubConfig.scala)
- **Auth Model**: `GithubAuth(accessToken: String)` - [see GithubConfig.scala](../app/models/GithubConfig.scala#L55)
- **Project Service**: [`GithubProjectService`](../app/services/GithubProjectService.scala) - Handles connectivity testing and repository listing
- **Worker**: [`GithubTagParseWorker`](../app/actors/scheduler/github/GithubTagParseWorker.scala)
- **API Service**: [`GithubApiServiceImpl`](../app/actors/scheduler/github/GithubApiService.scala)
- **Tag Type**: `GithubIssueTag` - [see Tags.scala](../app/models/Tags.scala#L130-L146)
- **Scheduler**: [`GithubTagParseScheduler`](../app/actors/scheduler/github/GithubTagParseScheduler.scala)
- **Settings**: `GithubProjectSettings(githubRepoOwner, githubRepoName, ...)` - [see GithubConfig.scala](../app/models/GithubConfig.scala#L41-L48)

### Pagination Strategy
- **Start Page**: 1-indexed (not 0 like GitLab)
- **Strategy**: Fetch until `results.size < maxResults` (no total count in headers)
- **Link Header**: Available but not parsed in current implementation

### Tag Configuration Options
- **useLabels**: Import issue labels as tags
- **useMilestone**: Import milestone as a tag
- **useTitle**: Import issue title as a tag
- **useAssignees**: Import assignee usernames as tags
- **includeOnlyIssuesWithLabels**: Filter by required labels (Set[String])
- **includeOnlyIssuesWithState**: Filter by state (default: "open")

### Known Issues
1. **PRs as Issues**: GitHub Issues API includes Pull Requests (must filter if needed)
2. **No Total Count**: API doesn't provide total count in headers (unlike GitLab)
3. **Rate Limiting**: 5,000 requests/hour for authenticated users
4. **Link Header Parsing**: Currently not parsed, relies on result size
5. **Fine-grained PAT Permissions**: Requires specific repository access configuration

---

## Comparison Matrix

| Feature | GitLab | Jira | Plane | GitHub |
|---------|--------|------|-------|--------|
| **Auth Type** | Personal Access Token | OAuth 1.0a | API Key | Bearer Token (PAT) |
| **Auth Header** | `PRIVATE-TOKEN` | OAuth signature | `x-api-key` | `Authorization: Bearer` |
| **Base URL** | gitlab.com / self-hosted | atlassian.net / self-hosted | plane.so / self-hosted | api.github.com / GHE |
| **Project ID** | Integer or path | Project key (string) | Workspace + UUID | owner/repo (string) |
| **Issue Ref** | `#<iid>` | `<KEY>-<num>` | UUID | `#<number>` |
| **Pagination** | Header-based | `startAt` param | `page` param | Link header |
| **Start Index** | 1 (API), 0 (internal) | 0 | 1 | 1 |
| **Total Count** | ✅ Headers | ❌ No | ❌ No | ❌ No |
| **Max Per Page** | 100 | 100 | 100 | 100 |
| **Rate Limit** | 300/min | 10/sec (Cloud) | 100/min | 5000/hour |
| **Query Language** | URL params | JQL | URL params | URL params |
| **Label Support** | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| **Milestone** | ✅ Yes | ❌ No (Sprints) | ❌ No | ✅ Yes |
| **Assignees** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Self-Hosted** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (GHE) |
| **OAuth Setup** | Simple | Complex | Simple | Simple |

---

## Common Patterns

### Core Infrastructure

**Unified Controller**: [`IssueImporterConfigController`](../app/controllers/IssueImporterConfigController.scala)
- Single controller for all platform types (GitLab, Jira, Plane, GitHub)
- Type discrimination via `importerType` field
- 10 unified endpoints (vs 40+ if separate per platform)
- Delegates external API calls to service layer

**External Project Service Layer**: [`ExternalProjectService`](../app/services/ExternalProjectService.scala)
- Trait-based abstraction for external API operations
- Factory method `forType(importerType, wsClient)` for service instantiation
- Platform-specific implementations:
  - [`GitlabProjectService`](../app/services/GitlabProjectService.scala)
  - [`JiraProjectService`](../app/services/JiraProjectService.scala)
  - [`PlaneProjectService`](../app/services/PlaneProjectService.scala)
  - [`GithubProjectService`](../app/services/GithubProjectService.scala)
- Handles connectivity testing and project/repository listing
- Separates external API concerns from controller logic

**Unified Repository**: [`IssueImporterConfigRepository`](../app/repositories/IssueImporterConfigRepository.scala)
- Single repository interface for all platforms
- MongoDB collection: `IssueImporterConfig`
- Pattern matching on config type for CRUD operations

**Plugin Handler**: [`PluginHandler`](../app/core/PluginHandler.scala)
- Initializes all platform schedulers at startup
- Manages worker lifecycle per platform

### Authentication Abstraction
All platforms use `ServiceAuthentication` trait with implementations:
- `OAuth2Authentication(token: String)` - GitLab, GitHub
- `OAuthAuthentication(consumerKey, privateKey, token, tokenSecret)` - Jira
- `ApiKeyAuthentication(apiKey: String)` - Plane

### API Service Base
All services extend `ApiServiceBase` providing:
- `getList[T](url: String)` - Fetch paginated list
- `getParam(name: String, value: Option[T])` - Build query params
- `getParamList(params: Option[String]*)` - Combine params

### Tag Parse Worker Pattern
Each platform has a worker following the pattern:
1. **Schedule parsing** - Timer-based with configurable frequency
2. **Load issues** - Recursive pagination until all fetched
3. **Transform to tags** - Platform-specific tag creation
4. **Notify cache** - `TagsUpdated` message to `TagCache`

### Configuration Pattern
All configs extend `IssueImporterConfig` with:
- `_id: IssueImporterConfigId` - Unique identifier
- `organisationReference` - Owner organization
- `importerType: ImporterType` - Platform discriminator
- `name: String` - User-friendly name
- `baseUrl: URL` - API base URL
- `auth: <Platform>Auth` - Platform-specific auth
- `settings: <Platform>Settings` - Platform settings (check frequency)
- `projects: Seq[<Platform>ProjectMapping]` - Project mappings

---

## Troubleshooting

### GitLab Issues

**Problem**: "401 Unauthorized"
- **Cause**: Invalid or expired personal access token
- **Solution**: Regenerate token with `read_api` scope minimum

**Problem**: "404 Not Found" for project
- **Cause**: Using project path instead of numeric ID
- **Solution**: Use numeric project ID or URL-encode the path

**Problem**: No issues returned despite issues existing
- **Cause**: `state` parameter filtering (default is `opened`)
- **Solution**: Use `state=all` to include closed issues

### Jira Issues

**Problem**: "401 oauth_problem=signature_invalid"
- **Cause**: Invalid RSA private key or OAuth configuration
- **Solution**: Verify key format (PEM), check consumer key registration

**Problem**: JQL syntax errors
- **Cause**: Invalid JQL query in `params`
- **Solution**: Test JQL in Jira UI first, URL-encode special characters

**Problem**: Custom fields not returned
- **Cause**: Field selection limiting response
- **Solution**: Add custom fields to `fields` parameter

### Plane Issues

**Problem**: "403 Forbidden"
- **Cause**: API key lacks permissions for workspace/project
- **Solution**: Ensure API key user has access to target workspace

**Problem**: Empty projects list for workspace
- **Cause**: User not member of workspace, or workspace has no projects
- **Solution**: Verify workspace membership in Plane UI

**Problem**: Issues not loading
- **Cause**: Incorrect workspace slug or project ID
- **Solution**: Fetch workspaces first, verify exact slug/ID values

### GitHub Issues

**Problem**: "401 Bad credentials"
- **Cause**: Invalid or expired PAT, wrong authentication header format
- **Solution**: Ensure `Authorization: Bearer <token>` format (not `token <token>`)

**Problem**: "404 Not Found" for repository
- **Cause**: Private repo without proper token permissions, wrong owner/repo
- **Solution**: Verify token has access to repository, check owner/repo spelling

**Problem**: Pull requests appearing in issues list
- **Cause**: GitHub Issues API includes PRs by default
- **Solution**: Filter with `is:issue` in params, or filter in application logic

**Problem**: Rate limit exceeded
- **Cause**: 5000 requests/hour limit reached
- **Solution**: Increase check frequency, reduce maxResults, check `X-RateLimit-*` headers

### Common Issues (All Platforms)

**Problem**: Worker not starting
- **Cause**: Configuration not loaded at startup, DB connection issues
- **Solution**: Check logs for initialization errors, verify MongoDB connection

**Problem**: Duplicate tags appearing
- **Cause**: Multiple workers for same project, tag cache not clearing
- **Solution**: Ensure unique project IDs, check `TagsUpdated` message handling

**Problem**: Tags not updating
- **Cause**: Worker crashed, check frequency too low, API errors
- **Solution**: Check worker supervisor logs, verify API connectivity, lower frequency

---

## Migration Notes

### Adding a New Platform

To add a new issue tracking platform, follow these steps:

1. **Domain Models** (`app/models/`)
   - Add platform to `ImporterType` enum
   - Create `<Platform>Config.scala` with auth, settings, mappings
   - Add `<Platform>IssueTag` to `Tags.scala`
   - Update `IssueImporterConfigDTOs.scala` with response type

2. **Repository Layer** (`app/repositories/`)
   - Add platform cases to `IssueImporterConfigRepository` pattern matches
   - Handle create, update, add/update/remove mappings

3. **Service Layer** (`app/services/`)
   - Create `<Platform>ProjectService.scala` extending `ExternalProjectService`
   - Implement `testConnectivity(config: CreateIssueImporterConfig): Future[ConnectivityTestResult]`
   - Implement `listProjects(config: IssueImporterConfig): Future[ListProjectsResponse]`
   - Add platform case to `ExternalProjectService.forType()` factory method

4. **Controller Layer** (`app/controllers/`)
   - Add platform cases to validation methods (`validateConfigForType`, `validateProjectMappingForType`)
   - Controller automatically uses service layer via `ExternalProjectService.forType()`

5. **Background Workers** (`app/actors/scheduler/<platform>/`)
   - Create `<Platform>Models.scala` for API responses
   - Create `<Platform>ApiService.scala` for API client
   - Create `<Platform>TagParseWorker.scala` for parsing logic
   - Create `<Platform>TagParseScheduler.scala` for scheduling

6. **Plugin Handler** (`app/core/PluginHandler.scala`)
   - Import platform scheduler
   - Create scheduler actor ref
   - Implement `initialize<Platform>Plugin()` method

7. **OpenAPI Documentation** (`conf/swagger.yml`)
   - Add platform schemas and enum values

8. **Tests** (`test/controllers/`)
   - Add platform-specific test cases
   - Mock WSClient for external API calls in service tests

---

## API Version Compatibility

| Platform | Current Version | Stable Until | Deprecation Notice |
|----------|----------------|--------------|-------------------|
| GitLab | v4 | 2026+ | No deprecation planned |
| Jira Cloud | v2 | 2025+ | v3 available but not required |
| Jira Server/DC | v2/v3 | Varies | Depends on installation |
| Plane | v1 | Unknown | Actively developing |
| GitHub | v3 | 2026+ | GraphQL v4 available (not used) |

---

## Security Best Practices

### Token Storage
- ✅ **DO**: Store tokens encrypted in MongoDB
- ✅ **DO**: Use environment variables for test tokens
- ❌ **DON'T**: Log tokens in plaintext
- ❌ **DON'T**: Return tokens in API responses

### Scope Minimization
- ✅ **GitLab**: Use `read_api` scope (not `api`)
- ✅ **GitHub**: Use fine-grained tokens with minimal repository access
- ✅ **Plane**: Create separate API keys per integration
- ⚠️ **Jira**: OAuth inherits user permissions (can't scope down)

### Token Rotation
- Recommend users rotate tokens every 90 days
- Support token update without recreating entire config
- Handle 401 errors gracefully (notify user, stop worker)

### Rate Limit Handling
- Respect `X-RateLimit-*` headers
- Implement exponential backoff on 429 responses
- Allow configurable check frequencies (don't poll too aggressively)

---

## Performance Considerations

### Pagination Strategies
- **GitLab**: Most efficient (provides total count, can parallelize)
- **Jira**: Medium (no total count, but small result sets typical)
- **Plane**: Least efficient (must fetch all workspaces first)
- **GitHub**: Medium (no total count, relies on result size)

### Recommended Check Frequencies
- **High Activity Repos**: 5-15 minutes
- **Medium Activity**: 30-60 minutes
- **Low Activity**: 2-4 hours
- **Archived Projects**: Disable workers

### Caching Strategies
- Tag cache prevents duplicate API calls
- Workers maintain state between runs
- MongoDB indexes on `organisationReference.id` and `importerType`

---

## Quick Reference: Required Scopes/Permissions

| Platform | Auth Type | Required Scopes/Permissions | Optional |
|----------|-----------|----------------------------|----------|
| **GitLab** | PAT | ✅ `read_api` | `api` (not needed) |
| **GitHub** | Fine-grained PAT | ✅ Issues: Read<br>✅ Metadata: Read | Contents: Read |
| **Jira Cloud** | OAuth 2.0 | ✅ `read:jira-work`<br>✅ `read:jira-user` | - |
| **Jira Server/DC** | OAuth 1.0a | ✅ Read access | - |
| **Plane** | API Key | ✅ Inherits user permissions | - |

### Token Expiration Recommendations

| Platform | Default | Recommended | Maximum |
|----------|---------|-------------|---------|
| **GitLab** | 365 days | 90-365 days | 400 days |
| **GitHub** | 30 days | 30-90 days | 1 year |
| **Jira** | Varies | N/A (OAuth flow) | N/A |
| **Plane** | No expiration | 90-365 days | No limit |

---

## Changelog

### 2025-10-09
- ✅ **Refactored to service layer architecture**
  - Extracted external API logic from controller to dedicated service layer
  - Created `ExternalProjectService` trait with platform-specific implementations
  - Controller reduced from 934 lines to 521 lines (44% reduction)
  - Improved separation of concerns and testability
- ✅ Added comprehensive Token/API Key Setup Guide
- ✅ Verified all setup instructions against official documentation
- ✅ Added required scopes/permissions for each platform
- ✅ Added security best practices for token management
- ✅ Added GitHub support (complete implementation)
- ✅ Documented GitHub API requirements
- ✅ Added comparison matrix
- ✅ Added troubleshooting section
- ✅ Added direct code links to all implementations
- ⚠️ Documented Jira OAuth 1.0a deprecation

### Earlier
- Initial documentation for GitLab, Jira, Plane
