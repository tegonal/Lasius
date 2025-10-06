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

// custom-instance.ts
import Axios, { CancelTokenSource } from 'axios'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { merge } from 'es-toolkit/compat'
import clientAxiosInstance from 'lib/api/ClientAxiosInstance'
import { getRequestHeaders } from 'lib/api/hooks/useTokensWithAxiosRequests'
import { logger } from 'lib/logger'
import { getSession } from 'next-auth/react'
import { IS_BROWSER } from 'projectConfig/constants'

// add a second `options` argument here if you want to pass extra options to each generated query
export const lasiusAxiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const defaultHeaders = axios.defaults.headers.common

  let methodBasedHeaders = {}
  if (config.method === 'POST') {
    methodBasedHeaders = axios.defaults.headers.post
  } else if (config.method === 'PUT') {
    methodBasedHeaders = axios.defaults.headers.put
  } else if (config.method === 'DELETE') {
    methodBasedHeaders = axios.defaults.headers.delete
  } else if (config.method === 'PATCH') {
    methodBasedHeaders = axios.defaults.headers.patch
  }

  const headers = { ...defaultHeaders, ...methodBasedHeaders }

  const handleRequest = (config: AxiosRequestConfig, source: CancelTokenSource) => {
    return clientAxiosInstance({
      ...config,
      cancelToken: source.token,
    })
      .then(({ data }) => data)
      .catch(async (error) => {
        if (Axios.isCancel(error)) {
          if (process.env.LASIUS_DEBUG) {
            logger.debug('[lasiusAxiosInstance][RequestCanceled]', error.message)
          }
        } else if (error.response?.status === 401) {
          // Always log 401 errors to help with debugging
          logger.warn('[lasiusAxiosInstance][Unauthorized]', {
            url: config.url,
            method: config.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            hasAuthHeader: !!config.headers?.Authorization,
          })

          if (
            IS_BROWSER &&
            window.location.pathname !== '/auth/signin' &&
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/' &&
            config.headers?.Authorization
          ) {
            // try to load session from middleware
            const session = await getSession()

            if (session != null && !session.error && session.access_token) {
              // Update axios defaults with the new token
              axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`
              if (session.access_token_issuer) {
                axios.defaults.headers.common['X-Token-Issuer'] = session.access_token_issuer
              }

              const headers = getRequestHeaders(session.access_token, session.access_token_issuer)
              logger.info('[lasiusAxiosInstance][Unauthorized] Retrying with refreshed token')
              return lasiusAxiosInstance(
                {
                  ...config,
                  ...headers,
                },
                options,
              )
            }

            logger.error(
              '[lasiusAxiosInstance][Unauthorized] Session refresh failed, throwing error',
            )
            throw error
          } else {
            logger.warn(
              '[lasiusAxiosInstance][Unauthorized] Not retrying (on login page or no auth header)',
            )
            throw error
          }
        } else {
          throw error
        }
      })
  }
  const newConfig = merge(
    {
      headers: headers,
    },
    config,
    options,
  )

  const source = Axios.CancelToken.source()
  const promise = handleRequest(newConfig, source)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this
export type ErrorType<Error> = AxiosError<Error>
// // In case you want to wrap the body type (optional)
// // (if the custom instance is processing data before sending it, like changing the case for example)
export type BodyType<BodyData> = BodyData
