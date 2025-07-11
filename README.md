# Lasius open-source time tracking

Lasius is an open source time tracking solution that includes a comprehensive set of features, with a particular focus on team collaboration.

**Public Beta**: We welcome your feedback! Please use the issue tracker of this repository.

Lasius is a modern web application with a backend written in Scala and a NextJS React frontend.

# Features

## Time Tracking

- Start-Stop tracking: Record time spent on a task in real-time
- Labels & Tags: Assign labels to each booking and edit labels on project level
- Favorites: Save your most used bookings as favorites and start booking with one click
- Progressive Web App: Use Lasius on your mobile device as a PWA and add it to your homescreen
- Dark-mode: Switch between light and dark mode
- Statistics & Reports: See your organisation, project or personal statistics for a given time period
- Export: Export organisation, project or personal bookings using various filters as CSV for a given time period
- ACL: Assign roles to users in a project or organisation to allow or restrict access to certain features

## Team Features

- Organisations: Be a member of multiple organisations and invite users with an invitation link, switch between them
  anytime and see only organisation specific data
- Projects: Create projects, assign them to organisations and invite users with an invitation link
- Team View: See what everybody is currently working on and book on the same task with one click

## Integrations

- Issue trackers: Connect your issue tracker to Lasius and use issue numbers as labels. Currently supported:
  - GitLab
  - Jira
  - Plane.io

## Personal Time Management

- Set your personal hourly target per weekday and organisation
- See your progress in real-time

# Roadmap

We plan to implement the following features in the near future (no specific order, no ETA):

- [ ] Make GitLab, Jira and Plane integration configurable in the frontend (currently hardcoded)
- [ ] Add support for GitHub issue tracker
- [ ] Special project to book sick days, holidays, etc. per organization

If you plan to use Lasius for your company or organisation, and you depend on one of the above features, we are happy to discuss sponsoring the development.

Watch this repository to get notified about new releases.

# History

The development of Lasius started in 2015. It is the exclusive time tracking tool of Tegonal, an experienced software development team based in Bern (Switzerland). We developed Lasius because there was no tool available in 2015 and, to be honest, because we just wanted to build something new and nice :-)

Our time tracker had to be based on open source components, meet our high privacy standards and be able to be hosted wherever we wanted. The feature set of Lasius has been continuously adapted to our needs in everyday project work and we are happy that we can share it with you.

# Development

## Requirements

- mongoDB >= 5.0.9, but <= 8.x

## Environment Variables

This is only necessary if you sping up the containers manually or with your own compose file. For your convenience,
check out the [lasius-docker-compose](https://github.com/tegonal/lasius-docker-compose) companion repo.
Please see the `docker-compose.yml` file for container specific environment variables.

The following variables are suggested to be used in an `.env` file alongside docker-compose and could be used by all
containers, containing secrets that only might be available during CI/CD.

| Variable name                   | Description                                                                                                             | Default value            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| LASIUS_HOSTNAME                 | Hostname (i.e. localhost, domain.com, ...)                                                                              | localhost                |
| LASIUS_VERSION                  | The current version, corresponds with docker image tags. We suggest using specific versions in production, not `latest` | latest                   |
| MONGODB_URI                     | Override connection to mongodb                                                                                          | see `docker-compose.yml` |
| MONGO_INITDB_PASSWORD           | Password of mongoDB user                                                                                                | lasius                   |
| MONGO_INITDB_ROOT_PASSWORD      | Password of root user of mongoDB                                                                                        | admin                    |
| MONGO_INITDB_ROOT_USERNAME      | Username of root user of mongoDB                                                                                        | admin                    |
| MONGO_INITDB_USERNAME           | Username of mongoDB user                                                                                                | lasius                   |
| NEXT_AUTH_SECRET                | Hash for next-auth session salting, e.g. the output of `openssl rand -base64 32`                                        | random string            |
| TRAEFIK_CERT_EMAIL              | E-mail address to use when fetching a certificate from LE                                                               | ssladmin@lasius.ch       |
| TRAEFIK_CERT_RESOLVER           | LetsEncrypt resolver, use `letsencrpyt` in production, empty value for testing (mind the LE rate limit)                 | letsencrypt              |
| TZ                              | Your desired timezone                                                                                                   | CET                      |
| LASIUS_OAUTH_CLIENT_ID          | Internal Oauth client id                                                                                                |                          |
| LASIUS_OAUTH_CLIENT_SECRET      | Internal Oauth client secret                                                                                            |                          |
| LASIUS_INTERNAL_JWT_PRIVATE_KEY | Internal Oauth providers JWT private key to sign tokens                                                                 |                          |

Specific to `backend` container:

| Variable name                              | Description                                                                                                                                                    | Default value            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| LASIUS_CLEAN_DATABASE_ON_STARTUP           | If true, drop on startup all data                                                                                                                              | 'false'                  |
| LASIUS_INITIALIZE_DATA                     | `'true'` if database should automatically get initialized in case no user accounts are configured                                                              | 'true'                   |
| LASIUS_INITIAL_USER_EMAIL                  | Username of initial admin user to login. Only used when `LASIUS_INITIALIZE_DATA` is set to `'true'` and no users where found in the database.                  | admin@lasius.ch          |
| LASIUS_INITIAL_USER_KEY                    | Initial internal user key for to the intial user account. Only used when `LASIUS_INITIALIZE_DATA` is set to `'true'` and no users where found in the database. | admin                    |
| LASIUS_INITIAL_USER_PASSWORD               | Password of initial admin user to login. Only used when `LASIUS_INITIALIZE_DATA` is set to `true` and no users where found in the database.                    | admin                    |
| LASIUS_START_PARAMS                        | Provide special start arguments to the play server. Might be used to inject a different `application.conf` to the server.                                      | see `docker-compose.yml` |
| LASIUS_SUPPORTS_TRANSACTIONS               | To be able to benefit of transactions in MongoDB you need a replica set first.                                                                                 | 'false'                  |
| LASIUS_OAUTH_PROVIDER_ENABLED              | Enable or disable internal oauth provider                                                                                                                      | 'false'                  |
| LASIUS_OAUTH_PROVIDER_ALLOW_REGISTER_USERS | Enable or disable registering new users in internal oauth provider, required internal oauth provider to be enabled                                             | 'false'                  |

Specific to `frontend` container:

| Variable name                            | Description                                                                                                     | Default value |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------- |
| ENVIRONMENT                              | `production` - any other value runs NextJS in dev mode. Not suggested in deployments.                           | production    |
| NEXT_AUTH_SECRET                         | Hash for next-auth session salting, e.g. the output of `openssl rand -base64 32`                                | random string |
| LASIUS_DEMO_MODE                         | Enables or disables demo mode                                                                                   | `false`       |
| LASIUS_TELEMETRY_PLAUSIBLE_HOST          | Hostname/FQDN of a matomo instance to collect anonymous usage data, e.g. `stats.domain.com`                     | undefined     |
| LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN | Matomo site ID, e.g. `42`                                                                                       | undefined     |
| LASIUS_TERMSOFSERVICE_VERSION            | Enables the Terms of Service dialog. You also need to provide the terms in `public/termsofservice/<lang>.html`. | undefined     |

We suggest you use a `.env` file and save it in the same directory as the `docker-compose.yml` for build dependent configuration and edit all other variables in the `docker-compose.yml` file directly if they are not dependent on CI/CD variables.

Authentication providers need to be configured in the frontend environment configuration and in the backend `lasius.security.external-issuers` configuration. Please have a look at the `conf/dev.conf` to get an idea how to enable with [GitLab](https://gitlab.com), [GitHub](https://github.com) or a custom [Keycloak](https://keycloak.org) instance.

## Dev Environment

To bring up a local dev Environment please install:

- sbt
- docker
- node

Copy the frontent `frontend/.env.template` file to `frontend/.env.local`.

To enable external OAuth support, register application in provider and configure the external provider settings (`GITLAB_OAUTH_*` or `GITHUB_OAUTH_*`) before starting backend and frontend. Those environment variables are re-used in the backend configuration and enable the provider there as well.

Start the backend with `yarn run backend` and the frontend with `yarn run dev` from the `frontend` directory.

## Test Environment

To simply bring up a test environment, check out
the [lasius-docker-compose](https://github.com/tegonal/lasius-docker-compose) companion repo.

## Production Environment

To bring up a production environment, check out
the [lasius-docker-compose](https://github.com/tegonal/lasius-docker-compose) companion repo.

The docker-compose setup above comes with single mongoDB instance and therefore without support of transactions. To use Lasius in production, you should use transactions and therefore run mongoDB in a replicaset. To benefit from transactions in Mongo DB you need to set `LASIUS_SUPPORTS_TRANSACTIONS=true` and configure an external access to the mongodb replicaset through `MONGODB_URI`.

Lasius' docker-compose.yml supports LetsEncrypt certificates out of the box, thanks to Traefik reverse proxy. If you decide to run Lasius behind another reverse proxy or SSL termination point, you can look at `docker-compose-no-https.yml`. However, we strongly suggest using secure connections.

# License

As we are strongly committed to open source software, we make Lasius available to the community under [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) license. The code in this repo is provided without warranty.

# Support

If you would like us to set up or run Lasius for you then please contact us here for an offer: <https://tegonal.com>

If you need help, discover a bug or have a feature request, please open an issue in this repo.

# Migration

## Migrating from 1.0.x to 1.1.x

The migration from 1.0.x to 1.1.x includes a version bump of the underlying reactivemongo driver version. This version cannot read former created binary snapshots from the persistence layer. Therefore you need to manually drop the snapshots. The snapshots are rebuilt from the journal once a user logs in or tries to start a new booking.
The snapshots can be removed by running the following command in the mongo-shell:

```
db.snapshots.remove({})
```

## Migration to 2.0.x

With the Lasius release 2.0.0 several changed where applied which might be incompatible to your current setup.

### 1. Migrate to an OAuth provider

If you run Lasius in a production environment, we recommand to migration to an external OAuth provider. Lasius currently support one of those three OAuth providers:

- [Github](https://github.com)
- [Gitlab](https://gitlab.com)
- Custom [Keycloak](https://keycloak.org) instance

To enable and configure those authentication providers you need to either manually adjust your backend configuration or, if you're using a standard configuration, provide the correct environment variables. Consult the [wiki](https://github.com/tegonal/Lasius/wiki/Auth) documentation for more information about the configuration possibilities.

### 2. MongoDB

We bumped to the latest available mongo database version 8.x. If you consider migrating you current installation to this release, please follow the [migration documentation](https://www.mongodb.com/docs/manual/release-notes/8.0-upgrade-replica-set/) of mongodb.

## Wiki / Documentation

The wiki documentation of this project is part of the main repository and will be published on every build of the main branch. Therefore don't edit the wiki online as those changes will be overwritten on the next build.
If you want to change the wiki documentation please create a PR to the main branch.
