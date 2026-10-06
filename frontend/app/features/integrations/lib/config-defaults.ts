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

import { type z } from 'zod'

import { type allFieldsConstraintSchema } from '~/features/integrations/lib/config-schemas'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'
import { type ModelsUpdateIssueImporterConfig } from '~/services/api/lasius/modelsUpdateIssueImporterConfig'

export const DEFAULT_CHECK_FREQUENCY_MS = 300_000

const IMPORTER_TYPES: readonly string[] = [
  'github',
  'gitlab',
  'jira',
  'plane',
] satisfies ImporterType[]

const isImporterType = (value: string): value is ImporterType => IMPORTER_TYPES.includes(value)

// A config response may name its type with a "Config" suffix, for example "GitlabConfig".
export const getImporterTypeOfConfig = (
  config: ModelsIssueImporterConfigResponse,
): ImporterType => {
  const normalized = config.importerType.replace(/Config$/, '').toLowerCase()
  return isImporterType(normalized) ? normalized : 'gitlab'
}

export const getEditConfigDefaults = (config: ModelsIssueImporterConfigResponse | null) => ({
  accessToken: '',
  apiKey: '',
  baseUrl: config ? config.baseUrl : '',
  checkFrequency: String(config?.checkFrequency || DEFAULT_CHECK_FREQUENCY_MS),
  consumerKey: '',
  name: config?.name ?? '',
  privateKey: '',
  resourceOwner: config && 'resourceOwner' in config ? (config.resourceOwner ?? '') : '',
  resourceOwnerType:
    config && 'resourceOwnerType' in config ? (config.resourceOwnerType ?? '') : '',
  workspace: config && 'workspace' in config ? (config.workspace ?? '') : '',
})

type ConfigFormValue = z.output<typeof allFieldsConstraintSchema>

export const buildConfigUpdateBody = (value: ConfigFormValue): ModelsUpdateIssueImporterConfig => ({
  baseUrl: value.baseUrl,
  checkFrequency: value.checkFrequency,
  name: value.name,
  // An empty credential field keeps the stored secret, so only a new value goes out.
  ...(value.accessToken && { accessToken: value.accessToken }),
  ...(value.apiKey && { apiKey: value.apiKey }),
  ...(value.consumerKey && { consumerKey: value.consumerKey }),
  ...(value.privateKey && { privateKey: value.privateKey }),
  // The other fields always go out, so the user can clear them.
  resourceOwner: value.resourceOwner || null,
  ...(value.resourceOwnerType && { resourceOwnerType: value.resourceOwnerType }),
  workspace: value.workspace || null,
})
