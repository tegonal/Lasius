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

import { ModelsImporterType } from 'lib/api/lasius'
import { listGithubResourceOwners } from 'lib/api/lasius/issue-importers/issue-importers'
import { logger } from 'lib/logger'
import { useEffect, useState } from 'react'

import type { ModelsExternalProject } from 'lib/api/lasius'

/**
 * Hook for fetching GitHub resource owners when token and base URL are available
 *
 * Automatically fetches resource owners when both accessToken and baseUrl are provided.
 * This allows the resource owner dropdown to be populated before testing the connection.
 *
 * @param orgId - Organization ID
 * @param accessToken - GitHub access token
 * @param baseUrl - GitHub base URL
 * @returns Resource owners list and loading state
 */
export const useGithubResourceOwners = (
  orgId: string,
  accessToken: string | undefined,
  baseUrl: string | undefined,
) => {
  const [resourceOwners, setResourceOwners] = useState<ModelsExternalProject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch if we have both token and URL
    if (!accessToken || !baseUrl || !orgId) {
      setResourceOwners([])
      setError(null)
      return
    }

    const fetchResourceOwners = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await listGithubResourceOwners(orgId, {
          importerType: ModelsImporterType.github,
          name: 'temp', // Temporary name, not saved
          baseUrl,
          checkFrequency: 300000, // Temporary value
          accessToken,
          consumerKey: null,
          privateKey: null,
          apiKey: null,
          resourceOwner: null,
          resourceOwnerType: null,
        })

        setResourceOwners(response.projects || [])
      } catch (err) {
        logger.error('[useGithubResourceOwners] Failed to fetch resource owners:', err)
        setResourceOwners([])
        setError('Failed to load organizations. Please check your token and URL.')
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce the fetch to avoid too many requests while user is typing
    const timeoutId = setTimeout(() => {
      fetchResourceOwners()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [orgId, accessToken, baseUrl])

  return {
    resourceOwners,
    isLoading,
    error,
  }
}
