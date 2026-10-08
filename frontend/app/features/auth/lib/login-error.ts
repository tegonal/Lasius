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

export type LoginErrorKind =
  | 'callback'
  | 'fetchProfileFailed'
  | 'general'
  | 'oauthCallback'
  | 'sessionRequired'
  | 'stateMismatch'

const KIND_BY_CODE = new Map<string, LoginErrorKind>([
  ['Callback', 'callback'],
  ['fetchProfileFailed', 'fetchProfileFailed'],
  ['no_code', 'oauthCallback'],
  ['OAuthCallback', 'oauthCallback'],
  ['OAuthCallbackError', 'oauthCallback'],
  ['SessionRequired', 'sessionRequired'],
  ['state_mismatch', 'stateMismatch'],
])

/** The message that the login page shows for the `error` query param. */
export const getLoginErrorKind = (errorCode: string): LoginErrorKind =>
  KIND_BY_CODE.get(errorCode) ?? 'general'
