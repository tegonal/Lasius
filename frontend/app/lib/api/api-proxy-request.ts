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

import { type ProxyEnvelope } from '~/routes/api.proxy'

export type ApiProxyConfig<TParameters> = {
  getUrl: (parameters: TParameters) => string
  method: string
  skipAuth?: boolean
}

export type ProxyPayload = {
  body?: JsonValue
  method: string
  skipAuth?: boolean
  url: string
}

type JsonValue = boolean | JsonValue[] | null | number | string | { [key: string]: JsonValue }

/**
 * Builds the body for `/api/proxy`. The submit arguments hold the request body, the skipAuth flag
 * and the path parameters of the endpoint.
 */
export const buildProxyPayload = <TParameters>(
  config: ApiProxyConfig<TParameters>,
  arguments_: Record<string, unknown> | undefined,
): ProxyPayload => {
  const { body, skipAuth, ...parameters } = arguments_ ?? {}

  const payload: ProxyPayload = {
    method: config.method,
    url: config.getUrl(parameters as TParameters),
  }
  if (body !== undefined) {
    payload.body = body as JsonValue
  }
  if ((skipAuth as boolean | undefined) ?? config.skipAuth) {
    payload.skipAuth = true
  }
  return payload
}

export const readProxyEnvelope = <TResponse>(envelope: ProxyEnvelope<TResponse> | undefined) => ({
  data: envelope?.ok === true ? envelope.data : undefined,
  error: envelope?.ok === false ? { error: envelope.error, status: envelope.status } : undefined,
  isError: envelope?.ok === false,
  isSubmitted: envelope !== undefined,
  isSuccess: envelope?.ok === true,
})

/** Calls onSuccess with the data of a success envelope, or onError with the error and the status. */
export const notifyProxyResult = <TResponse>(
  envelope: ProxyEnvelope<TResponse>,
  callbacks: {
    onError?: (error: { error: string; status: number }) => void
    onSuccess?: (data: TResponse) => void
  },
) => {
  if (envelope.ok) {
    callbacks.onSuccess?.(envelope.data)
  } else {
    callbacks.onError?.({ error: envelope.error, status: envelope.status })
  }
}
