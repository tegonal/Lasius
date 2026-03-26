/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

export const ROLES = {
  ORGANISATION_ADMIN: 'OrganisationAdministrator',
  ORGANISATION_MEMBER: 'OrganisationMember',
  PROJECT_ADMIN: 'ProjectAdministrator',
  PROJECT_MEMBER: 'ProjectMember',
  USER: 'FreeUser',
}

export const AUTH_PROVIDER_INTERNAL_LASIUS = 'internal_lasius'

// ---------------------------------------------------------------------------
// Time unit helpers
// ---------------------------------------------------------------------------

/** Milliseconds in one hour. Used for converting booking durations to hours in aggregations. */
export const MS_PER_HOUR = 3_600_000

// ---------------------------------------------------------------------------
// Polling & session timing
// ---------------------------------------------------------------------------

/** How often to poll the server for session validity. Balances freshness vs server load. */
export const SESSION_POLL_INTERVAL_MS = 30_000

/** Time before token expiry to show the "session expiring" warning to the user. */
export const SESSION_EXPIRY_WARNING_MS = 2 * 60 * 1000

/** How often to poll the backend health endpoint for connectivity status. */
export const HEALTH_POLL_INTERVAL_MS = 10_000

/** Debounce window for health status changes to avoid UI flicker on transient failures. */
export const HEALTH_STATUS_DEBOUNCE_MS = 2000

/** Default time-to-live for cached loader responses. Prevents redundant fetches within a session. */
export const LOADER_CACHE_DEFAULT_TTL_MS = 5 * 60 * 1000

// ---------------------------------------------------------------------------
// WebSocket config
// ---------------------------------------------------------------------------

/** Interval between WebSocket keep-alive pings to detect stale connections. */
export const WS_PING_INTERVAL_MS = 5000

/** Maximum number of reconnection attempts before giving up and showing an error. */
export const WS_MAX_RECONNECT_ATTEMPTS = 30

/** Upper bound for exponential backoff delay between WebSocket reconnection attempts. */
export const WS_MAX_BACKOFF_MS = 10_000

// ---------------------------------------------------------------------------
// API resource paths
// ---------------------------------------------------------------------------

/** Internal API route paths for client-side resource routes. */
export const API_ROUTES = {
  /** Polls backend connectivity and version drift. */
  HEALTH: '/api/health',
  /** Persists the user's locale preference via cookie. */
  LOCALE: '/api/locale',
  /** Returns current session validity and token expiry for the token watcher. */
  SESSION_STATUS: '/api/session-status',
  /** Persists the user's theme preference via cookie. */
  THEME: '/api/theme',
} as const

// ---------------------------------------------------------------------------
// Cookie config
// ---------------------------------------------------------------------------

/** Max-age for persistent preference cookies (theme, locale). Set to 1 year. */
export const COOKIE_MAX_AGE_1_YEAR = 60 * 60 * 24 * 365

// ---------------------------------------------------------------------------
// Auth session
// ---------------------------------------------------------------------------

/** Progressive backoff delays for token refresh retries on transient failures. */
export const AUTH_REFRESH_BACKOFF_MS = [500, 1000, 2000] as const

// ---------------------------------------------------------------------------
// Dev tools
// ---------------------------------------------------------------------------

/** Refresh interval for the dev-mode token expiry countdown badge. */
export const TOKEN_TIME_UPDATE_INTERVAL_MS = 5000
