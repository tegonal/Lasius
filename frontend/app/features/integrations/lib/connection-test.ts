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

import { type ImporterType } from '~/lib/utils/tag-helpers'

type FormValues = Record<string, string | undefined>

/**
 * True when the edit form holds a credential for the importer. The test then checks the entered
 * values. Without one, it checks the saved configuration.
 */
export const hasNewCredentials = (importerType: ImporterType, values: FormValues): boolean => {
  switch (importerType) {
    case 'github':
    case 'gitlab': {
      return !!values.accessToken
    }
    case 'jira': {
      return !!values.accessToken || !!values.consumerKey || !!values.privateKey
    }
    case 'plane': {
      return !!values.apiKey
    }
  }
}

/** The body of the connectivity test. An empty optional field is left out. */
export const buildConnectivityBody = (importerType: ImporterType, values: FormValues) => ({
  accessToken: values.accessToken || undefined,
  apiKey: values.apiKey || undefined,
  baseUrl: values.baseUrl,
  checkFrequency: Number(values.checkFrequency),
  consumerKey: values.consumerKey || undefined,
  importerType,
  name: values.name,
  privateKey: values.privateKey || undefined,
  resourceOwner: values.resourceOwner || undefined,
  resourceOwnerType: values.resourceOwnerType || undefined,
  workspace: values.workspace || undefined,
})

export type ConnectionTestResponse = undefined | { message?: string; status?: string }

/** The result and the message of a test response. A response without a message gets the given text. */
export const getConnectionTestOutcome = (data: ConnectionTestResponse, successMessage: string) => ({
  message: data?.message ?? successMessage,
  result: data?.status === 'success' ? ('success' as const) : ('error' as const),
})
