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
import { useFetcher } from 'react-router'

import {
  type ApiProxyConfig,
  buildProxyPayload,
  notifyProxyResult,
  readProxyEnvelope,
} from '~/lib/api/api-proxy-request'
import { clearLoaderCache } from '~/lib/utils/loader-cache'
import { type ProxyEnvelope } from '~/routes/api.proxy'

export type ApiProxyOptions<TResponse> = {
  fetcherKey?: string
  onError?: (error: { error: string; status: number }) => void
  onSuccess?: (data: TResponse) => void
}

type SubmitArguments<TBody, TParameters> = (TBody extends undefined
  ? { body?: never }
  : { body: TBody }) &
  (TParameters extends Record<string, never> ? unknown : TParameters) & {
    skipAuth?: boolean
  }

export function useApiProxy<TResponse, TBody = undefined, TParameters = Record<string, never>>(
  config: ApiProxyConfig<TParameters>,
  options?: ApiProxyOptions<TResponse>,
) {
  const { fetcherKey, onError, onSuccess } = options ?? {}
  const fetcher = useFetcher<ProxyEnvelope<TResponse>>(fetcherKey ? { key: fetcherKey } : undefined)
  const fetcherSubmit = fetcher.submit
  const submittedReference = useRef(false)
  const onSuccessReference = useRef(onSuccess)
  const onErrorReference = useRef(onError)

  // This effect must stay above the callback effect. Effects run in declaration order,
  // so the callback effect then reads the callbacks of the current render.
  useEffect(() => {
    onSuccessReference.current = onSuccess
    onErrorReference.current = onError
  })

  const envelope = fetcher.data
  const isIdle = fetcher.state === 'idle'

  // Fire callbacks when request completes
  useEffect(() => {
    if (!isIdle || !submittedReference.current || !envelope) return
    submittedReference.current = false
    notifyProxyResult(envelope, {
      onError: onErrorReference.current,
      onSuccess: onSuccessReference.current,
    })
  }, [isIdle, envelope])

  const submit = useCallback(
    (arguments_?: SubmitArguments<TBody, TParameters>) => {
      const payload = buildProxyPayload(config, arguments_ as Record<string, unknown> | undefined)

      submittedReference.current = true
      if (config.method !== 'GET') clearLoaderCache()

      void fetcherSubmit(payload, {
        action: '/api/proxy',
        encType: 'application/json',
        method: 'POST',
      })
    },
    [config, fetcherSubmit],
  )

  return {
    ...readProxyEnvelope(envelope),
    isIdle,
    isLoading: fetcher.state !== 'idle',
    isSubmitting: fetcher.state === 'submitting',
    reset: fetcher.reset,
    state: fetcher.state,
    submit,
  }
}
