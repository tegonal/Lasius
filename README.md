# Lasius open-source time tracking

Lasius is an open source time tracking solution that includes a comprehensive set of features, with a particular focus on team collaboration.

We welcome your feedback! Please use the issue tracker of this repository.

Lasius is a modern web application with a backend written in Scala and a NextJS React frontend.

# Features

## Time Tracking

- Start-Stop tracking: Record time spent on a task in real-time
- Labels & Tags: Assign labels to each booking and edit labels on project level
- Favorites: Save your most used bookings as favorites and start booking with one click
- Booking Templates: Create bookings from existing entries or team member bookings
- Flexible Time Adjustments: Adjust start/end times between adjacent bookings
- Progressive Web App: Use Lasius on your mobile device as a PWA and add it to your homescreen
- Dark-mode: Switch between light, dark or the system default
- Statistics & Reports: See your organisation, project or personal statistics for a given time period
- Export: Export organisation, project or personal bookings and statistics in multiple formats (CSV, ODS, XLSX)
- ACL: Assign roles to users in a project or organisation to allow or restrict access to certain features

## Team Features

- Organisations: Be a member of multiple organisations and invite users with an invitation link, switch between them
  anytime and see only organisation specific data
- Projects: Create projects, assign them to organisations and invite users with an invitation link
- Team View: See what everybody is currently working on and book on the same task with one click

## Integrations

- Issue trackers: Connect your issue tracker to Lasius and automatically sync issues as tags. Fully configurable in the UI. Currently supported:
  - GitHub
  - GitLab
  - Jira
  - Plane.io

## Personal Time Management

- Set your personal hourly target per weekday and organisation
- See your progress in real-time with monthly calculations
- Personal dashboard with time tracking insights

## User Experience

- Built-in contextual help system throughout the application
- Interactive onboarding checklist for new users
- Multi-language support: English, German, Spanish, French, and Italian
- Responsive design optimized for all device sizes

# Roadmap

We plan to implement the following features in the near future (no specific order, no ETA):

- [ ] Special project to book sick days, holidays, etc. per organization
- [ ] Additional issue tracker integrations
- [ ] An API that lets you import bookings into other system using access tokens

If you plan to use Lasius for your company or organisation, and you need specific features or support, we are happy to discuss sponsoring the development.

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
| LASIUS_RESOURCE_PROFILE                    | `small` adds the low-resource JVM options for demo and test hosts, see [Low-resource profile](#low-resource-profile). Other values keep the JVM defaults.      | unset                    |
| LASIUS_START_PARAMS                        | Not read by the Docker image. To load another config file, set `JAVA_OPTS: "-Dconfig.file=/path/to/backend.conf"` on the backend container.                  | unset                    |
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

### Prerequisites

- [sbt](https://www.scala-sbt.org/) (Scala build tool)
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) >= 20 (includes Corepack)
- [tmux](https://github.com/tmux/tmux) (for `dev.sh` launcher)

Enable Corepack to use the correct Yarn version (managed via `package.json#packageManager`):

```bash
corepack enable
```

### Setup

```bash
# 1. Install dependencies (compile backend + install frontend deps)
./install.sh

# 2. Copy and edit the frontend environment file
cp frontend/.env.template frontend/.env.local

# 3. Start dev services (MongoDB, Keycloak, Mailpit, Caddy proxy)
cd services && yarn services:start

# 4. Start backend + frontend in tmux
./dev.sh
```

### Services

Dev services are managed from the `services/` directory:

```bash
yarn services:start    # Start all dev services (MongoDB, Keycloak, Mailpit, Caddy)
yarn services:stop     # Stop all dev services
yarn services:clean    # Stop and remove all data volumes
yarn services:logs     # Stream service logs
yarn services:status   # Show service status
```

### Ports

| Service    | Port |
|------------|------|
| App (proxy)| 3000 |
| Frontend   | 3001 |
| Backend    | 9000 |
| MongoDB    | 27017|
| Keycloak   | 8080 |
| Mailpit UI | 8025 |
| Mailpit SMTP| 1025|

Access the application at `http://localhost:3000` (the Caddy proxy routes frontend and backend).

### Running Manually

If you prefer not to use `dev.sh`, start each service individually:

```bash
# Backend (from backend/)
sbt run -Dconfig.resource=dev.conf

# Frontend (from frontend/, after backend is ready)
yarn dev
```

### OAuth Providers

To enable external OAuth support, register an application with your provider and configure the provider settings (`GITLAB_OAUTH_*`, `GITHUB_OAUTH_*`, or `KEYCLOAK_OAUTH_*`) in `frontend/.env.local` before starting. These environment variables are re-used in the backend configuration.

## Test Environment

To simply bring up a test environment, check out
the [lasius-docker-compose](https://github.com/tegonal/lasius-docker-compose) companion repo.

### Low-resource profile

Use this profile for demo and test instances on a small VM. Do not use it in production.

The profile has two parts for each Java service: a container memory limit and a set of JVM options.
For the backend, one variable activates the options: `LASIUS_RESOURCE_PROFILE=small`. When the
variable is unset, empty or `default`, the start script adds no option. The backend then starts with
the same JVM options as an image without the profile.

```yaml
services:
  backend:
    image: tegonal/lasius-backend:${LASIUS_VERSION:-latest}
    restart: always
    mem_limit: 512m
    environment:
      LASIUS_RESOURCE_PROFILE: small
      # Keep all other backend variables.

  keycloak:
    image: quay.io/keycloak/keycloak:26.5.6
    command: start
    restart: always
    mem_limit: 768m
    environment:
      KC_CACHE: local
      JAVA_OPTS_KC_HEAP: "-XX:MaxRAMPercentage=50 -XX:InitialRAMPercentage=25"
      # Keep all other Keycloak variables (database, hostname, admin user).
```

Always set `mem_limit`. The JVM calculates the heap size from the container limit. Without a limit,
the JVM uses the memory of the whole VM.

#### Backend options

`LASIUS_RESOURCE_PROFILE=small` adds these options:

| Option | Effect | Value without the profile |
| --- | --- | --- |
| `-XX:+UseSerialGC` | Selects the garbage collector with the smallest memory overhead. | Selected from the limit and the CPU count. At 512 MiB, the JVM also selects Serial GC. |
| `-XX:MaxRAMPercentage=30` | Limits the heap to 30 % of `mem_limit`. At 512 MiB, the heap limit is 154 MiB. | 25 %, 128 MiB at 512 MiB |
| `-XX:MaxMetaspaceSize=160m` | Limits the class metadata. The backend uses about 97 MiB. | No limit |
| `-XX:ReservedCodeCacheSize=64m` | Limits the memory for compiled code. The backend uses about 25 MiB. | 240 MiB |
| `-XX:ActiveProcessorCount=2` | Sizes the pools that follow the CPU count for 2 CPUs: Netty, the channel group of the MongoDB driver, the Scala pool and the JIT compiler. | The CPU count of the container |
| `-XX:+ExitOnOutOfMemoryError` | Stops the JVM at the first `OutOfMemoryError`. The `restart` policy then starts a new container. | The JVM continues to run after the error. |
| `-Dpekko.actor.default-dispatcher.fork-join-executor.parallelism-min=2` and `-Dpekko.actor.internal-dispatcher.fork-join-executor.parallelism-min=2` | Lowers the thread minimum of the Pekko dispatchers in the Play and Lasius actor systems. | Minimum 8 and 4 threads |
| `-Dmongo-async-driver.pekko.actor.default-dispatcher.fork-join-executor.parallelism-min=2` and `-Dmongo-async-driver.pekko.actor.internal-dispatcher.fork-join-executor.parallelism-min=2` | Lowers the same minimum in the actor system of ReactiveMongo. | Minimum 8 and 4 threads |
| `-Dpekko-contrib-persistence-dispatcher.thread-pool-executor.core-pool-size-max=4` and `-Dpekko-contrib-persistence-query-dispatcher.thread-pool-executor.core-pool-size-max=4` | Limits the thread pools of the Pekko persistence plugin for MongoDB. | Up to 16 and up to 60 threads |

To change one value, set `JAVA_OPTS` on the backend, for example `JAVA_OPTS: "-XX:MaxRAMPercentage=40"`.
The start script adds `JAVA_OPTS` after the profile options, and the JVM uses the last value of an
option. Arguments in the `command:` of the container come after `JAVA_OPTS`, so they also override the
profile. The start script does not read `START_PARAMS` or `LASIUS_START_PARAMS`.

#### Keycloak settings

| Setting | Effect | Keycloak default |
| --- | --- | --- |
| `mem_limit: 768m` | Sets the container limit. `kc.sh` calculates the heap size from it. | No limit |
| `JAVA_OPTS_KC_HEAP` | Sets the heap limit to 50 % (384 MiB) and the initial heap to 25 % (192 MiB) of `mem_limit`. | 70 % and 50 % |
| `KC_CACHE: local` | Keeps all caches local. Keycloak starts no cluster transport. Use it only for a single node. | `ispn` (distributed caches) |

- Do not set `JAVA_OPTS` for Keycloak. `JAVA_OPTS` replaces all defaults of `kc.sh`, for example
  `-XX:+ExitOnOutOfMemoryError` and the Metaspace limit.
- Do not add `-XX:MaxHeapFreeRatio=30` from the Keycloak container guide. In the image
  `quay.io/keycloak/keycloak:26.5.6`, the JVM then stops at startup with `MinHeapFreeRatio (40) must be
  less than or equal to MaxHeapFreeRatio (30)`.
- `KC_CACHE` is a build option. With `command: start`, Keycloak builds its configuration again at each
  start. For a custom image, run `kc.sh build --cache=local` in the Dockerfile and start the container
  with `start --optimized`.

#### Measured values

The values come from Docker Desktop (aarch64, 10 CPUs) with the demo data of `InitialDemoDataLoader`.
Each backend run sent 596 requests. The requests covered login, profile, statistics, booking history,
and the current and latest bookings. Each run also started and stopped one booking and sent a burst
from 8 parallel clients. "Peak" is the `memory.peak` value of the container cgroup. It includes the
page cache.

| Backend, `mem_limit: 512m` | Profile unset | `small` |
| --- | --- | --- |
| Heap limit | 128 MiB | 154 MiB |
| Time until `GET /backend/config` answers | 3.3 s | 3.6 s |
| Peak after startup | 289 MiB | 283 MiB |
| Peak after all requests | 381 MiB | 391 MiB |
| Highest `docker stats` value | 377 MiB | 383 MiB |
| JVM threads | 103 to 115 | 66 to 68 |
| Request latency, 95th percentile | 517 ms | 393 ms |
| Container stopped by the OOM killer | no | no |

At 512 MiB, the JVM defaults also fit, because the JVM selects Serial GC and a 128 MiB heap. The
profile adds limits for the areas that have no limit by default. When each limited area is full, the
backend uses about 470 MiB. The heap takes 154 MiB, Metaspace 160 MiB and the code cache 64 MiB.
Symbols, shared classes, thread stacks and native memory took about 90 MiB in the test. Thread stacks
and direct buffers have no limit. A blocking call in an actor can add threads to a Pekko pool. The
thread count does not change on a host with more CPUs.

| Keycloak 26.5.6, `start`, `mem_limit: 768m`, 10 logins | Keycloak defaults | `JAVA_OPTS_KC_HEAP` above |
| --- | --- | --- |
| Time until the realm answers | 17 s | 15 s to 17 s |
| Peak | 768 MiB (the limit) | 715 MiB to 717 MiB |
| Highest `docker stats` value | 641 MiB to 653 MiB | 547 MiB to 549 MiB |
| Container stopped by the OOM killer | no | no |

The Keycloak runs used the `dev-file` database and the realm of `services/keycloak-local-realm.json`.
A test with `mem_limit: 512m` and a heap of 40 % also passed the logins. But the container used
474 MiB, and the peak reached the limit. Therefore 768 MiB is the proposal for Keycloak.

Measure again on the VM with `docker stats` and
`docker inspect --format '{{.State.OOMKilled}}' <container>`.

#### MongoDB connection pool

ReactiveMongo reads its pool size only from the MongoDB URI, for example
`?rm.nbChannelsPerNode=4&rm.minIdleChannelsPerNode=1` (defaults: 10 and 1). The profile does not
set these options, for two reasons:

- The persistence plugin reads the same `MONGODB_URI` with the official MongoDB driver. That driver
  writes a `WARN` line for each `rm.*` option.
- With `rm.nbChannelsPerNode=4`, the peak was 387 MiB instead of 391 MiB. The gain is about 1 %.

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

The wiki documentation of this project is part of the main repository and will be published on every build of the main branch. Therefore, don't edit the wiki online as those changes will be overwritten on the next build.
If you want to change the wiki documentation please create a PR to the main branch.
