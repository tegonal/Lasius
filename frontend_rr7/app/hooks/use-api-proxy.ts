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

import { useFetcher } from 'react-router'

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
>(config: ApiProxyConfig<TParams>) {
	const fetcher = useFetcher()

	const submit = (
		args: SubmitArgs<TBody, TParams> = {} as SubmitArgs<TBody, TParams>,
	) => {
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

		void fetcher.submit(payload, {
			action: '/api/proxy',
			encType: 'application/json',
			method: 'POST',
		})
	}

	return {
		data: fetcher.data as TResponse | undefined,
		state: fetcher.state,
		submit,
	}
}
