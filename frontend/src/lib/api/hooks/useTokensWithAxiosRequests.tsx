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

/**
 * Utility function for generating HTTP request headers with authentication tokens.
 * Creates a headers object containing the Authorization Bearer token and token issuer
 * information for authenticated API requests to the Lasius backend.
 *
 * @param token - Optional authentication token (typically JWT from NextAuth)
 * @param tokenIssuer - Optional token issuer identifier for the authentication provider
 *
 * @returns Object containing:
 *   - headers: Object with Authorization and X-Token-Issuer headers if token provided
 *   - Empty object if no token is provided
 *
 * @example
 * // With authentication token
 * const headers = getRequestHeaders(session?.access_token, 'keycloak')
 * // Returns: { headers: { Authorization: 'Bearer <token>', 'X-Token-Issuer': 'keycloak' } }
 *
 * // Without token (unauthenticated request)
 * const headers = getRequestHeaders()
 * // Returns: {}
 *
 * // Use with axios request
 * const response = await axios.get('/api/bookings', getRequestHeaders(token, issuer))
 *
 * @remarks
 * - Returns empty object if token is not provided, allowing safe use in all contexts
 * - Used by Axios interceptors to automatically add auth headers to API requests
 * - Token issuer header helps backend identify the OAuth provider
 * - Part of the authentication infrastructure for the Lasius API client
 */
export const getRequestHeaders = (token?: string, tokenIssuer?: string) => {
  if (!token) {
    return {}
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Token-Issuer': tokenIssuer,
    },
  }
}
