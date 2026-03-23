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

import { type ProxyEnvelope } from '~/routes/api.proxy'

export type ApiProxyOptions<TResponse> = {
  onError?: (error: { error: string; status: number }) => void
  onSuccess?: (data: TResponse) => void
}

type ApiProxyConfig<TParams> = {
  getUrl: (params: TParams) => string
  method: string
  skipAuth?: boolean
}

type JsonValue =
  | boolean
  | JsonValue[]
  | null
  | number
  | string
  | { [key: string]: JsonValue }

type ProxyPayload = {
  body?: JsonValue
  method: string
  skipAuth?: boolean
  url: string
}

type SubmitArgs<TBody, TParams> = (TBody extends undefined
  ? { body?: never }
  : { body: TBody }) &
  TParams & {
    skipAuth?: boolean
  }

export function useApiProxy<
  TResponse,
  TBody = undefined,
  TParams = Record<string, never>,
>(config: ApiProxyConfig<TParams>, options?: ApiProxyOptions<TResponse>) {
  const fetcher = useFetcher<ProxyEnvelope<TResponse>>()
  const submittedRef = useRef(false)
  const onSuccessRef = useRef(options?.onSuccess)
  const onErrorRef = useRef(options?.onError)
  onSuccessRef.current = options?.onSuccess
  onErrorRef.current = options?.onError

  const envelope = fetcher.data
  const isIdle = fetcher.state === 'idle'

  // Derive typed data and error from envelope
  const data = envelope?.ok === true ? (envelope.data as TResponse) : undefined
  const error =
    envelope?.ok === false
      ? { error: envelope.error, status: envelope.status }
      : undefined

  // Fire callbacks when request completes
  useEffect(() => {
    if (!isIdle || !submittedRef.current || !envelope) return
    submittedRef.current = false

    if (envelope.ok) {
      onSuccessRef.current?.(envelope.data as TResponse)
    } else {
      onErrorRef.current?.({ error: envelope.error, status: envelope.status })
    }
  }, [isIdle, envelope])

  const submit = useCallback(
    (args: SubmitArgs<TBody, TParams> = {} as SubmitArgs<TBody, TParams>) => {
      const { body, skipAuth, ...params } = args as Record<string, unknown>

      const payload: ProxyPayload = {
        method: config.method,
        url: config.getUrl(params as TParams),
      }
      if (body !== undefined) {
        payload.body = body as JsonValue
      }
      if (skipAuth ?? config.skipAuth) {
        payload.skipAuth = true
      }

      submittedRef.current = true

      void fetcher.submit(payload, {
        action: '/api/proxy',
        encType: 'application/json',
        method: 'POST',
      })
    },
    [config, fetcher],
  )

  return {
    data,
    error,
    isError: envelope?.ok === false,
    isIdle,
    isLoading: fetcher.state !== 'idle',
    isSubmitted: envelope !== undefined,
    isSubmitting: fetcher.state === 'submitting',
    isSuccess: envelope?.ok === true,
    reset: fetcher.reset,
    state: fetcher.state,
    submit,
  }
}
