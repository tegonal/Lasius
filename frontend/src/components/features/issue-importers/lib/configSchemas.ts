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

import { z } from 'zod'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { TFunction } from 'i18next'

/**
 * Base schema shared by all issue importer platforms
 */
const createBaseConfigSchema = (t: TFunction<'integrations' | 'common'>) => ({
  name: z.string().min(
    1,
    t('issueImporters.validation.nameRequired', {
      defaultValue: 'Name is required',
    }),
  ),
  baseUrl: z
    .string()
    .min(
      1,
      t('issueImporters.validation.baseUrlRequired', {
        defaultValue: 'Base URL is required',
      }),
    )
    .url(
      t('issueImporters.validation.invalidUrl', {
        defaultValue: 'Invalid URL',
      }),
    ),
  checkFrequency: z
    .number()
    .min(
      60000,
      t('issueImporters.validation.minInterval', {
        defaultValue: 'Minimum 1 minute',
      }),
    )
    .max(
      86400000,
      t('issueImporters.validation.maxInterval', {
        defaultValue: 'Maximum 24 hours',
      }),
    ),
})

/**
 * Platform-specific credential field schemas
 */
const credentialSchemas = {
  accessToken: (t: TFunction<'integrations' | 'common'>, isEdit: boolean) =>
    isEdit
      ? z.string().optional()
      : z.string().min(
          1,
          t('issueImporters.validation.accessTokenRequired', {
            defaultValue: 'Access token is required',
          }),
        ),

  consumerKey: (t: TFunction<'integrations' | 'common'>) =>
    z.string().min(
      1,
      t('issueImporters.validation.consumerKeyRequired', {
        defaultValue: 'Consumer key is required',
      }),
    ),

  privateKey: (t: TFunction<'integrations' | 'common'>, isEdit: boolean) =>
    isEdit
      ? z.string().optional()
      : z.string().min(
          1,
          t('issueImporters.validation.privateKeyRequired', {
            defaultValue: 'Private key is required',
          }),
        ),

  apiKey: (t: TFunction<'integrations' | 'common'>, isEdit: boolean) =>
    isEdit
      ? z.string().optional()
      : z.string().min(
          1,
          t('issueImporters.validation.apiKeyRequired', {
            defaultValue: 'API key is required',
          }),
        ),
}

/**
 * Factory function to create platform-specific Zod schemas
 *
 * @param t - Translation function
 * @param importerType - Platform type (github, gitlab, jira, plane)
 * @param isEdit - Whether this is edit mode (makes credentials optional)
 * @returns Zod schema for the platform
 */
export const createConfigSchema = (
  t: TFunction<'integrations' | 'common'>,
  importerType: ImporterType,
  isEdit: boolean = false,
) => {
  const baseSchema = createBaseConfigSchema(t)

  switch (importerType) {
    case 'github':
      return z.object({
        ...baseSchema,
        accessToken: credentialSchemas.accessToken(t, isEdit),
        resourceOwner: z.string().min(
          1,
          t('issueImporters.validation.resourceOwnerRequired', {
            defaultValue: 'Resource owner is required',
          }),
        ),
        resourceOwnerType: z.string().nullable().optional(),
      })

    case 'gitlab':
      return z.object({
        ...baseSchema,
        accessToken: credentialSchemas.accessToken(t, isEdit),
      })

    case 'jira':
      return z.object({
        ...baseSchema,
        consumerKey: credentialSchemas.consumerKey(t),
        privateKey: credentialSchemas.privateKey(t, isEdit),
        accessToken: credentialSchemas.accessToken(t, isEdit),
      })

    case 'plane':
      return z.object({
        ...baseSchema,
        apiKey: credentialSchemas.apiKey(t, isEdit),
      })
  }
}

/**
 * Type helper to infer form data type from schema
 */
export type ConfigFormData = z.infer<ReturnType<typeof createConfigSchema>>
