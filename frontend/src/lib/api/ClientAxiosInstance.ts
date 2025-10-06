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

import Axios from 'axios'
import { IS_SERVER, LASIUS_API_URL, LASIUS_API_URL_INTERNAL } from 'projectConfig/constants'
import { useUIStore } from 'stores/uiStore'

const clientAxiosInstance = Axios.create({
  baseURL: IS_SERVER ? LASIUS_API_URL_INTERNAL : LASIUS_API_URL,
}) // use your own URL here or environment variable

// Add request interceptor to show global loading
clientAxiosInstance.interceptors.request.use(
  (config) => {
    // Only track requests on the client side
    if (!IS_SERVER) {
      useUIStore.getState().showGlobalLoading()
    }
    return config
  },
  (error) => {
    // Always decrement on request error
    if (!IS_SERVER) {
      useUIStore.getState().hideGlobalLoading()
    }
    return Promise.reject(error)
  },
)

// Add response interceptor to hide global loading
clientAxiosInstance.interceptors.response.use(
  (response) => {
    if (!IS_SERVER) {
      useUIStore.getState().hideGlobalLoading()
    }
    return response
  },
  (error) => {
    // Always decrement on response error, including cancelled requests
    if (!IS_SERVER) {
      useUIStore.getState().hideGlobalLoading()
    }
    return Promise.reject(error)
  },
)

export default clientAxiosInstance
