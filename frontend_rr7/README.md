# Lasius Frontend (React Router 7)

Open source time tracker for teams. This is the React Router 7 frontend,
replacing the legacy Next.js frontend.

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | React Router 7 (v7.13) with SSR + v8 middleware     |
| UI           | React 19 + React Compiler                           |
| Styling      | Tailwind CSS v4 + DaisyUI 5                         |
| Build        | Vite 8                                              |
| Language     | TypeScript 5.9 (strict, `noUncheckedIndexedAccess`) |
| Forms        | Conform + Zod v4                                    |
| i18n         | i18next + react-i18next + remix-i18next             |
| API Client   | Orval 8 (dual: fetch functions + hooks)             |
| Client State | Zustand                                             |
| Charts       | Nivo (bar, line, pie, stream)                       |
| Runtime      | Node >= 24, Yarn 4                                  |

## Getting Started

```bash
# Install dependencies
yarn install

# Copy env template
cp .env.template .env.local

# Start dev server (port 5173 by default, proxied at 3000)
yarn dev
```

The backend and services (MongoDB, Keycloak) must be running. See the root
`dev.sh` for the full stack launcher.

## Scripts

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `yarn dev`          | Start dev server with HMR                  |
| `yarn build`        | Typecheck + production build               |
| `yarn start`        | Serve production build                     |
| `yarn check`        | Typecheck + ESLint + Prettier (CI gate)    |
| `yarn typecheck`    | Generate route types + `tsc --noEmit`      |
| `yarn lint`         | ESLint (read-only)                         |
| `yarn lint:fix`     | ESLint with auto-fix                       |
| `yarn prettier`     | Format all files                           |
| `yarn orval`        | Regenerate API client from OpenAPI spec    |
| `yarn i18n:extract` | Extract translation keys from source       |
| `yarn i18n:types`   | Generate TypeScript types for translations |
| `yarn i18n:lint`    | Lint for hardcoded strings                 |
| `yarn i18n:status`  | Translation completeness report            |
| `yarn fallow`       | Check for unused exports                   |

## Project Structure

```
app/
  components/       Shared UI components
  config/           App configuration
  features/         Feature-specific modules
  hooks/            Custom React hooks
  lib/              Utilities (validation helpers, etc.)
  locales/          Translation JSON files (en, de, fr, it, es)
  middleware/        React Router middleware
  routes/           Route modules (flat file convention)
  services/
    api/lasius/          Server-side fetch functions (Orval-generated, DO NOT EDIT)
    api/lasius-hooks/    Client-side mutation hooks (Orval-generated, DO NOT EDIT)
    auth/                Authentication utilities
  stores/           Zustand stores
  types/            TypeScript types (includes generated i18n types)
```

## API Client (Orval)

Two Orval outputs are generated from the backend's OpenAPI spec
(`swagger.json`):

1. **`app/services/api/lasius/`** — Plain `async` fetch functions for use in
   loaders/actions (server-side)
2. **`app/services/api/lasius-hooks/`** — `useXxx()` hooks wrapping
   `useApiProxy` for client-side mutations

Regenerate with `yarn orval` (requires the backend running at `localhost:9000`).

**Never edit files in `app/services/api/lasius/` or
`app/services/api/lasius-hooks/`** — they are overwritten on regeneration.

## Internationalization

- **5 languages**: English (default), German, French, Italian, Spanish
- **20 namespaces**: common, auth, bookings, dashboard, settings, stats, etc.
- Translations live in `app/locales/{lang}/{namespace}.json`
- Run `yarn i18n:extract` after adding new `t()` calls
- Run `yarn i18n:types` to regenerate TypeScript types

## Environment Variables

Copy `.env.template` to `.env.local` and configure:

| Variable                        | Required | Description                                                         |
| ------------------------------- | -------- | ------------------------------------------------------------------- |
| `ENVIRONMENT`                   | Yes      | `development` or `production`                                       |
| `LASIUS_API_URL`                | Yes      | Backend API URL (default: `http://localhost:3000/backend`)          |
| `LASIUS_API_WEBSOCKET_URL`      | Yes      | WebSocket URL (default: `ws://localhost:3000/backend`)              |
| `LASIUS_API_URL_INTERNAL`       | Yes      | Internal API URL for SSR (default: `http://localhost:3000/backend`) |
| `AUTH_SECRET`                   | Yes      | Session cookie signing secret                                       |
| `KEYCLOAK_OAUTH_*`              | Yes      | Keycloak OAuth credentials (client ID, secret, URL)                 |
| `GITHUB_OAUTH_*`                | No       | GitHub OAuth provider                                               |
| `GITLAB_OAUTH_*`                | No       | GitLab OAuth provider                                               |
| `LASIUS_TERMSOFSERVICE_VERSION` | No       | Require ToS acceptance (e.g., `1.0`)                                |
| `LASIUS_SHOW_LOGIN_CREDENTIALS` | No       | Show demo credentials on login page                                 |
| `MATOMO_URL` / `MATOMO_SITE_ID` | No       | Anonymous usage analytics                                           |
| `LASIUS_DEBUG`                  | No       | Enable debug logging                                                |

## Vite Configuration

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **React Compiler** via `babel-plugin-react-compiler`
- **Production**: `data-testid` attributes stripped via
  `babel-plugin-react-remove-properties`
- **Vite 8 compatibility**: Patches applied to `reactRouter()` plugin to strip
  deprecated esbuild options (temporary, until `@react-router/dev` supports Vite
  8 natively)

## License

AGPL-3.0 — see [LICENSE](../LICENSE) for details. All source files must include
the AGPL header.
