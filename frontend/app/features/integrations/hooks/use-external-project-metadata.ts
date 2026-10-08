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

import { useCallback, useEffect } from 'react'

import { type ModelsIssueImporterConfigId } from '~/services/api/lasius'
import { useGetExternalProjectMetadata } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

/** The importer config whose credentials the backend uses for the external API. */
export type ImporterConfigReference = {
  configId: ModelsIssueImporterConfigId
  orgId: string
}

const NO_VALUES: string[] = []

/** The labels and states of a response. A missing list is one shared empty array, so a memo keeps its value. */
export const getMetadataValues = (
  data: undefined | { availableLabels?: string[]; availableStates?: string[] },
) => ({
  availableLabels: data?.availableLabels ?? NO_VALUES,
  availableStates: data?.availableStates ?? NO_VALUES,
})

// The project list does not carry labels and states. See
// .claude/rules/project/decisions/be-importer-metadata-on-demand.md.
export const useExternalProjectMetadata = (
  { configId, orgId }: ImporterConfigReference,
  externalProjectId: string,
) => {
  const { data, isError, isLoading, submit } = useGetExternalProjectMetadata()

  const load = useCallback(
    () => submit({ configId, orgId, params: { externalProjectId } }),
    [submit, configId, orgId, externalProjectId],
  )

  useEffect(() => {
    load()
  }, [load])

  return {
    ...getMetadataValues(data),
    isError,
    isLoading,
    reload: load,
  }
}
