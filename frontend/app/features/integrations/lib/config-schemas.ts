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

import { type TFunction } from 'i18next'
import { z } from 'zod'

import { requiredString } from '~/lib/conform-helpers'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { ModelsCreateIssueImporterConfigResourceOwnerType } from '~/services/api/lasius/modelsCreateIssueImporterConfigResourceOwnerType'

/**
 * Superset schema containing all possible fields across all importer types.
 * Used only for Conform type inference and constraints — actual validation
 * uses the platform-specific schema from createConfigSchema.
 */
export const allFieldsConstraintSchema = z.object({
  accessToken: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.url(),
  checkFrequency: z.number(),
  consumerKey: z.string().optional(),
  name: z.string(),
  privateKey: z.string().optional(),
  resourceOwner: z.string().optional(),
  resourceOwnerType: z.enum(ModelsCreateIssueImporterConfigResourceOwnerType).optional(),
  workspace: z.string().optional(),
})

/**
 * Base schema shared by all issue importer platforms
 */
const createBaseConfigSchema = (t: TFunction<'common' | 'integrations'>) => ({
  baseUrl: z.url({
    error: (issue) =>
      issue.code === 'invalid_type'
        ? t('issueImporters.validation.baseUrlRequired', {
            defaultValue: 'Base URL is required',
          })
        : t('issueImporters.validation.invalidUrl', {
            defaultValue: 'Invalid URL',
          }),
  }),
  checkFrequency: z
    .number()
    .min(
      60_000,
      t('issueImporters.validation.minInterval', {
        defaultValue: 'Minimum 1 minute',
      }),
    )
    .max(
      86_400_000,
      t('issueImporters.validation.maxInterval', {
        defaultValue: 'Maximum 24 hours',
      }),
    ),
  name: requiredString(
    t('issueImporters.validation.nameRequired', {
      defaultValue: 'Name is required',
    }),
  ),
})

/**
 * Platform-specific credential field schemas
 */
const credentialSchemas = {
  accessToken: (t: TFunction<'common' | 'integrations'>, isEdit: boolean) =>
    isEdit
      ? z.string().optional()
      : requiredString(
          t('issueImporters.validation.accessTokenRequired', {
            defaultValue: 'Access token is required',
          }),
        ),

  apiKey: (t: TFunction<'common' | 'integrations'>, isEdit: boolean) =>
    isEdit
      ? z.string().optional()
      : requiredString(
          t('issueImporters.validation.apiKeyRequired', {
            defaultValue: 'API key is required',
          }),
        ),

  consumerKey: (t: TFunction<'common' | 'integrations'>) =>
    requiredString(
      t('issueImporters.validation.consumerKeyRequired', {
        defaultValue: 'Consumer key is required',
      }),
    ),

  privateKey: (t: TFunction<'common' | 'integrations'>, isEdit: boolean) =>
    isEdit
      ? z.string().optional()
      : requiredString(
          t('issueImporters.validation.privateKeyRequired', {
            defaultValue: 'Private key is required',
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
  t: TFunction<'common' | 'integrations'>,
  importerType: ImporterType,
  isEdit: boolean = false,
) => {
  const baseSchema = createBaseConfigSchema(t)

  switch (importerType) {
    case 'github': {
      return z.object({
        ...baseSchema,
        accessToken: credentialSchemas.accessToken(t, isEdit),
        resourceOwner: requiredString(
          t('issueImporters.validation.resourceOwnerRequired', {
            defaultValue: 'Resource owner is required',
          }),
        ),
        resourceOwnerType: z.string().nullable().optional(),
      })
    }

    case 'gitlab': {
      return z.object({
        ...baseSchema,
        accessToken: credentialSchemas.accessToken(t, isEdit),
      })
    }

    case 'jira': {
      return z.object({
        ...baseSchema,
        accessToken: credentialSchemas.accessToken(t, isEdit),
        consumerKey: credentialSchemas.consumerKey(t),
        privateKey: credentialSchemas.privateKey(t, isEdit),
      })
    }

    case 'plane': {
      return z.object({
        ...baseSchema,
        apiKey: credentialSchemas.apiKey(t, isEdit),
        workspace: requiredString(
          t('issueImporters.validation.workspaceRequired', {
            defaultValue: 'Workspace is required',
          }),
        ),
      })
    }
  }
}
