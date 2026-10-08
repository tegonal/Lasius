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

import { useEffect, useMemo, useRef } from 'react'

import { DEFAULT_CHECK_FREQUENCY_MS } from '~/features/integrations/lib/config-defaults'
import { type ImporterType } from '~/lib/utils/tag-helpers'
import { useListGithubResourceOwners } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

/** Only GitHub has resource owners, and the lookup needs an access token. */
export const shouldLookUpResourceOwners = (importerType: ImporterType, accessToken: string) =>
  importerType === 'github' && accessToken.length > 0

type UseGithubResourceOwnersOptions = {
  accessToken: string
  baseUrl: string
  importerType: ImporterType
  orgId: string
}

export const useGithubResourceOwners = ({
  accessToken,
  baseUrl,
  importerType,
  orgId,
}: UseGithubResourceOwnersOptions) => {
  const {
    data: resourceOwnersData,
    isLoading: isLoadingResourceOwners,
    submit: submitResourceOwners,
  } = useListGithubResourceOwners()

  const resourceOwners = useMemo(() => resourceOwnersData?.projects ?? [], [resourceOwnersData])

  const debounceReference = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => {
    if (debounceReference.current) clearTimeout(debounceReference.current)
    if (shouldLookUpResourceOwners(importerType, accessToken)) {
      debounceReference.current = setTimeout(() => {
        submitResourceOwners({
          body: {
            accessToken,
            baseUrl,
            checkFrequency: DEFAULT_CHECK_FREQUENCY_MS,
            importerType: 'github',
            name: 'resource-owner-lookup',
          },
          orgId,
        })
      }, 500)
    }
    return () => {
      if (debounceReference.current) clearTimeout(debounceReference.current)
    }
  }, [importerType, accessToken, baseUrl, orgId, submitResourceOwners])

  return { isLoadingResourceOwners, resourceOwners }
}
