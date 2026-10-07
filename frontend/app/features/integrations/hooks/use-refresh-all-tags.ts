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

import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'
import { useRefreshTags } from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type RefreshTagsArguments = { configId: string; mappingId: string; orgId: string }

/**
 * Refreshes the tags of several project mappings, one request after the other.
 * One fetcher holds one request, so a new submit cancels the request that still runs.
 */
export const useRefreshAllTags = () => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const queueReference = useRef<RefreshTagsArguments[]>([])
  const failedReference = useRef(0)
  const submitReference = useRef<((arguments_: RefreshTagsArguments) => void) | null>(null)

  const sendNext = useCallback(() => {
    const next = queueReference.current.shift()
    if (next) {
      submitReference.current?.(next)
      return
    }

    const failed = failedReference.current
    failedReference.current = 0
    addToast(
      failed > 0
        ? {
            message: t('issueImporters.errors.tagsRefreshFailed', {
              defaultValue: 'Failed to refresh tags',
            }),
            type: 'ERROR',
          }
        : {
            message: t('issueImporters.success.tagsRefreshed', {
              defaultValue: 'Tags refresh triggered successfully',
            }),
            type: 'SUCCESS',
          },
    )
  }, [addToast, t])

  const { state, submit } = useRefreshTags({
    onError: () => {
      failedReference.current += 1
      sendNext()
    },
    onSuccess: sendNext,
  })
  useEffect(() => {
    submitReference.current = submit
  }, [submit])

  const refreshAll = useCallback(
    (requests: RefreshTagsArguments[]) => {
      if (requests.length === 0 || queueReference.current.length > 0 || state !== 'idle') return
      queueReference.current = [...requests]
      failedReference.current = 0
      sendNext()
    },
    [sendNext, state],
  )

  return { refreshAll, state }
}
