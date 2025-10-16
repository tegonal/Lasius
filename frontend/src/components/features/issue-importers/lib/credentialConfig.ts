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

import type { ImporterType } from 'components/features/issue-importers/shared/types'

export type CredentialFieldType = 'text' | 'password'

export type CredentialField = {
  name: 'accessToken' | 'consumerKey' | 'privateKey' | 'apiKey'
  type: CredentialFieldType
  required: boolean
  placeholder: string
}

/**
 * Get credential field definitions for a specific platform
 */
export const getCredentialFieldsForPlatform = (type: ImporterType): CredentialField[] => {
  switch (type) {
    case 'github':
      return [
        {
          name: 'accessToken',
          type: 'password',
          required: true,
          placeholder: 'github_pat_xxxxxxxxxxxxx',
        },
      ]

    case 'gitlab':
      return [
        {
          name: 'accessToken',
          type: 'password',
          required: true,
          placeholder: 'glpat-xxxxxxxxxxxxx',
        },
      ]

    case 'jira':
      return [
        {
          name: 'consumerKey',
          type: 'text',
          required: true,
          placeholder: 'jira-oauth-consumer',
        },
        {
          name: 'privateKey',
          type: 'password',
          required: true,
          placeholder: '-----BEGIN RSA PRIVATE KEY-----',
        },
        {
          name: 'accessToken',
          type: 'password',
          required: true,
          placeholder: 'your-oauth-access-token',
        },
      ]

    case 'plane':
      return [
        {
          name: 'apiKey',
          type: 'password',
          required: true,
          placeholder: 'plane-api-key-xxxxxxxxxxxxx',
        },
      ]
  }
}

/**
 * Get credential payload for API submission
 * Extracts only the credentials used by the platform and conditionally includes them for edit mode
 */
export const getCredentialPayload = (
  type: ImporterType,
  formData: Record<string, any>,
  isEdit: boolean,
) => {
  const payload: Record<string, string | null> = {}

  switch (type) {
    case 'github':
      if (!isEdit || formData.accessToken) {
        // Include access token and resource owner info when creating or updating credentials
        payload.accessToken = formData.accessToken
        payload.resourceOwner = formData.resourceOwner
        payload.resourceOwnerType = formData.resourceOwnerType
      } else {
        // In edit mode without new credentials, still send resource owner if it exists
        // This allows updating the resource owner without changing the token
        if (formData.resourceOwner) {
          payload.resourceOwner = formData.resourceOwner
          payload.resourceOwnerType = formData.resourceOwnerType
        }
      }
      break

    case 'gitlab':
      if (!isEdit || formData.accessToken) {
        payload.accessToken = formData.accessToken
      }
      break

    case 'jira':
      if (formData.consumerKey) {
        payload.consumerKey = formData.consumerKey
      }
      if (!isEdit || formData.privateKey) {
        payload.privateKey = formData.privateKey
      }
      if (!isEdit || formData.accessToken) {
        payload.accessToken = formData.accessToken
      }
      break

    case 'plane':
      if (!isEdit || formData.apiKey) {
        // Include API key and workspace when creating or updating credentials
        payload.apiKey = formData.apiKey
        payload.workspace = formData.workspace
      } else {
        // In edit mode without new credentials, still send workspace if it exists
        // This allows updating the workspace without changing the API key
        if (formData.workspace) {
          payload.workspace = formData.workspace
        }
      }
      break
  }

  return payload
}

/**
 * Get null values for credentials not used by this platform
 * Required by API to explicitly set unused fields to null
 */
export const getNullCredentialFields = (type: ImporterType) => {
  const nullFields: Record<string, null> = {}

  switch (type) {
    case 'github':
      nullFields.consumerKey = null
      nullFields.privateKey = null
      nullFields.apiKey = null
      break

    case 'gitlab':
      nullFields.consumerKey = null
      nullFields.privateKey = null
      nullFields.apiKey = null
      nullFields.resourceOwner = null
      nullFields.resourceOwnerType = null
      break

    case 'jira':
      nullFields.apiKey = null
      nullFields.resourceOwner = null
      nullFields.resourceOwnerType = null
      break

    case 'plane':
      nullFields.accessToken = null
      nullFields.consumerKey = null
      nullFields.privateKey = null
      nullFields.resourceOwner = null
      nullFields.resourceOwnerType = null
      break
  }

  return nullFields
}

/**
 * Get default form values for a platform
 */
export const getDefaultFormValues = (type: ImporterType) => {
  const defaults: Record<string, any> = {
    name: '',
    baseUrl: '',
    checkFrequency: 300000, // 5 minutes
  }

  switch (type) {
    case 'github':
      defaults.accessToken = ''
      defaults.resourceOwner = ''
      defaults.resourceOwnerType = null
      break

    case 'gitlab':
      defaults.accessToken = ''
      break

    case 'jira':
      defaults.consumerKey = ''
      defaults.privateKey = ''
      defaults.accessToken = ''
      break

    case 'plane':
      defaults.apiKey = ''
      defaults.workspace = ''
      break
  }

  return defaults
}
