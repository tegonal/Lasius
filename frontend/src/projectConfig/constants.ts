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

import { isNotNil, isPlainObject } from 'es-toolkit'

/**
 * Environment Variable Strategy for Next.js 15 Standalone Output:
 *
 * SERVER-SIDE:
 * - All variables read directly from process.env at runtime
 * - Can be set when starting the container
 * - No build-time dependencies
 *
 * CLIENT-SIDE:
 * - Injected into window.ENV from _document.tsx during SSR
 * - Available synchronously after initial page load
 * - Updated dynamically without rebuild
 *
 * This enables "build once, deploy many" pattern.
 */

export const IS_BROWSER: boolean = typeof window !== 'undefined'
export const IS_SERVER: boolean = typeof window === 'undefined'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type RuntimeConfig = {
  LASIUS_API_URL: string
  LASIUS_API_WEBSOCKET_URL: string
  LASIUS_PUBLIC_URL: string
  LASIUS_TELEMETRY_PLAUSIBLE_HOST: string
  LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN: string
  LASIUS_DEMO_MODE: string
  LASIUS_TERMSOFSERVICE_VERSION: string
  LASIUS_VERSION: string
  ENVIRONMENT: string
}

// =============================================================================
// CONFIGURATION GETTERS
// =============================================================================

/**
 * Expected keys in RuntimeConfig - used for validation
 */
const EXPECTED_ENV_KEYS: ReadonlySet<keyof RuntimeConfig> = new Set([
  'LASIUS_API_URL',
  'LASIUS_API_WEBSOCKET_URL',
  'LASIUS_PUBLIC_URL',
  'LASIUS_TELEMETRY_PLAUSIBLE_HOST',
  'LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN',
  'LASIUS_DEMO_MODE',
  'LASIUS_TERMSOFSERVICE_VERSION',
  'LASIUS_VERSION',
  'ENVIRONMENT',
])

/**
 * Validates window.ENV on the client side
 * - Ensures window.ENV is defined and is a plain object
 * - Ensures all expected keys are present
 * - Ensures no unexpected keys are present
 * - Ensures all values are strings
 */
function validateWindowEnv(): void {
  if (!isNotNil(window.ENV)) {
    throw new Error(
      '[RuntimeConfig] window.ENV is not defined. This should be injected during SSR.',
    )
  }

  if (!isPlainObject(window.ENV)) {
    throw new Error('[RuntimeConfig] window.ENV is not a plain object.')
  }

  const env = window.ENV
  const actualKeys = new Set(Object.keys(env))

  // Check for missing keys
  const missingKeys = [...EXPECTED_ENV_KEYS].filter((key) => !actualKeys.has(key))
  if (missingKeys.length > 0) {
    throw new Error(
      `[RuntimeConfig] window.ENV is missing required keys: ${missingKeys.join(', ')}`,
    )
  }

  // Check for unexpected keys
  const unexpectedKeys = [...actualKeys].filter(
    (key) => !EXPECTED_ENV_KEYS.has(key as keyof RuntimeConfig),
  )
  if (unexpectedKeys.length > 0) {
    throw new Error(
      `[RuntimeConfig] window.ENV contains unexpected keys: ${unexpectedKeys.join(', ')}`,
    )
  }

  // Check that all values are strings
  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== 'string') {
      throw new Error(
        `[RuntimeConfig] window.ENV.${key} is not a string (got ${typeof value}). All environment variables must be strings.`,
      )
    }
  }
}

function getRuntimeConfig(): RuntimeConfig {
  if (IS_SERVER) {
    // Server-side: read directly from process.env
    return {
      LASIUS_API_URL: process.env.LASIUS_API_URL || '',
      LASIUS_API_WEBSOCKET_URL: process.env.LASIUS_API_WEBSOCKET_URL || '',
      LASIUS_PUBLIC_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      LASIUS_TELEMETRY_PLAUSIBLE_HOST: process.env.LASIUS_TELEMETRY_PLAUSIBLE_HOST || '',
      LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN:
        process.env.LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN || '',
      LASIUS_DEMO_MODE: process.env.LASIUS_DEMO_MODE || 'false',
      LASIUS_TERMSOFSERVICE_VERSION: process.env.LASIUS_TERMSOFSERVICE_VERSION || '',
      LASIUS_VERSION: process.env.LASIUS_VERSION || 'dev',
      ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    }
  } else {
    // Client-side: validate and read from window object (injected during SSR)
    validateWindowEnv()
    return window.ENV!
  }
}

// =============================================================================
// SERVER-SIDE ONLY VARIABLES
// =============================================================================

/**
 * Internal API URL used by server-side code (SSR, API routes, getServerSideProps)
 */
export const LASIUS_API_URL_INTERNAL = IS_SERVER ? process.env.LASIUS_API_URL_INTERNAL || '' : ''

/**
 * NextAuth URL - used for auth callbacks
 */
export const NEXTAUTH_URL = IS_SERVER ? process.env.NEXTAUTH_URL || '' : ''

// =============================================================================
// RUNTIME VARIABLES (with lazy evaluation)
// =============================================================================

let cachedConfig: RuntimeConfig | null = null

function getConfig(): RuntimeConfig {
  if (!cachedConfig) {
    cachedConfig = getRuntimeConfig()
  }
  return cachedConfig
}

/**
 * Public API URL used by client-side code (browser)
 */
export function getLasiusApiUrl(): string {
  return IS_SERVER ? process.env.LASIUS_API_URL || '' : getConfig().LASIUS_API_URL
}

/**
 * WebSocket URL for real-time updates
 */
export function getLasiusApiWebsocketUrl(): string {
  return IS_SERVER
    ? process.env.LASIUS_API_WEBSOCKET_URL || ''
    : getConfig().LASIUS_API_WEBSOCKET_URL
}

/**
 * Public URL for OG images and canonical URLs
 */
export function getLasiusPublicUrl(): string {
  return IS_SERVER
    ? process.env.NEXTAUTH_URL || 'http://localhost:3000'
    : getConfig().LASIUS_PUBLIC_URL
}

/**
 * Plausible analytics host
 */
export function getLasiusTelemetryPlausibleHost(): string {
  return IS_SERVER
    ? process.env.LASIUS_TELEMETRY_PLAUSIBLE_HOST || ''
    : getConfig().LASIUS_TELEMETRY_PLAUSIBLE_HOST
}

/**
 * Plausible analytics source domain
 */
export function getLasiusTelemetryPlausibleSourceDomain(): string {
  return IS_SERVER
    ? process.env.LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN || ''
    : getConfig().LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN
}

/**
 * Demo mode flag - shows demo credentials on login
 */
export function getLasiusDemoMode(): string {
  return IS_SERVER ? process.env.LASIUS_DEMO_MODE || 'false' : getConfig().LASIUS_DEMO_MODE
}

/**
 * Terms of Service version that users must accept
 */
export function getLasiusTermsOfServiceVersion(): string {
  return IS_SERVER
    ? process.env.LASIUS_TERMSOFSERVICE_VERSION || ''
    : getConfig().LASIUS_TERMSOFSERVICE_VERSION
}

/**
 * Lasius version - set at container launch time
 */
export function getLasiusVersion(): string {
  return IS_SERVER ? process.env.LASIUS_VERSION || 'dev' : getConfig().LASIUS_VERSION
}

/**
 * Environment name (development, production, etc.)
 */
export function getEnvironment(): string {
  return IS_SERVER ? process.env.ENVIRONMENT || 'development' : getConfig().ENVIRONMENT
}

/**
 * Is development environment
 */
export function getIsDev(): boolean {
  return IS_SERVER
    ? process.env.ENVIRONMENT !== 'production'
    : getConfig().ENVIRONMENT !== 'production'
}

// =============================================================================
// LEGACY CONSTANT EXPORTS (for backward compatibility)
// =============================================================================

export const LASIUS_API_URL = IS_SERVER ? process.env.LASIUS_API_URL || '' : ''
export const LASIUS_API_WEBSOCKET_URL = IS_SERVER ? process.env.LASIUS_API_WEBSOCKET_URL || '' : ''
export const LASIUS_PUBLIC_URL = IS_SERVER
  ? process.env.NEXTAUTH_URL || 'http://localhost:3000'
  : ''
export const LASIUS_TELEMETRY_PLAUSIBLE_HOST = IS_SERVER
  ? process.env.LASIUS_TELEMETRY_PLAUSIBLE_HOST || ''
  : ''
export const LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN = IS_SERVER
  ? process.env.LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN || ''
  : ''
export const LASIUS_DEMO_MODE = IS_SERVER ? process.env.LASIUS_DEMO_MODE || 'false' : ''
export const LASIUS_TERMSOFSERVICE_VERSION = IS_SERVER
  ? process.env.LASIUS_TERMSOFSERVICE_VERSION || ''
  : ''
export const LASIUS_VERSION = IS_SERVER ? process.env.LASIUS_VERSION || 'dev' : ''
export const ENVIRONMENT = IS_SERVER ? process.env.ENVIRONMENT || 'development' : ''
export const IS_DEV = IS_SERVER ? process.env.ENVIRONMENT !== 'production' : false

// =============================================================================
// DERIVED / COMPUTED CONSTANTS
// =============================================================================

export const DEFAULT_STRING_VALUE = 'default'
export const DEFAULT_STRING_VALUE_ALL = 'all'

export const TIME = {
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year',
}

export const NO_DATA_AVAILABLE = 'nodata'
export type NO_DATA_AVAILABLE = typeof NO_DATA_AVAILABLE

export const DATA_LOADING = 'dataloading'
export type DATA_LOADING = typeof DATA_LOADING

export const ROLES = {
  USER: 'FreeUser',
  ORGANISATION_ADMIN: 'OrganisationAdministrator',
  ORGANISATION_MEMBER: 'OrganisationMember',
  PROJECT_MEMBER: 'ProjectMember',
  PROJECT_ADMIN: 'ProjectAdministrator',
}
export type ROLES = typeof ROLES

export const WEBSOCKET_EVENT = {
  UserLoggedOutV2: 'UserLoggedOutV2',
  CurrentOrganisationTimeBookings: 'CurrentOrganisationTimeBookings',
  CurrentUserTimeBookingEvent: 'CurrentUserTimeBookingEvent',
  FavoriteAdded: 'FavoriteAdded',
  FavoriteRemoved: 'FavoriteRemoved',
  HelloClient: 'HelloClient',
  LatestTimeBooking: 'LatestTimeBooking',
  UserTimeBookingByProjectEntryAdded: 'UserTimeBookingByProjectEntryAdded',
  UserTimeBookingByProjectEntryRemoved: 'UserTimeBookingByProjectEntryRemoved',
  UserTimeBookingHistoryEntryAdded: 'UserTimeBookingHistoryEntryAdded',
  UserTimeBookingHistoryEntryChanged: 'UserTimeBookingHistoryEntryChanged',
  UserTimeBookingHistoryEntryRemoved: 'UserTimeBookingHistoryEntryRemoved',
  UserTimeBookingByTagEntryAdded: 'UserTimeBookingByTagEntryAdded',
  UserTimeBookingByTagEntryRemoved: 'UserTimeBookingByTagEntryRemoved',
  IssueImporterSyncStatsChanged: 'IssueImporterSyncStatsChanged',
  Pong: 'Pong',
}

export enum CONNECTION_STATUS {
  UNKNOWN = 'UNKNOWN',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export const AUTH_PROVIDER_INTERNAL_LASIUS = 'internal_lasius'
export const AUTH_PROVIDER_CUSTOMER_KEYCLOAK = 'custom_keycloak'
