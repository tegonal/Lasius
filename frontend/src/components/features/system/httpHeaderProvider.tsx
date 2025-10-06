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

import axios from 'axios'
import { getCsrfToken } from 'lib/api/lasius/general/general'
import { logger } from 'lib/logger'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

export const HttpHeaderProvider: React.FC = () => {
  // Use the session from the context, not the prop!
  const { data: session } = useSession()
  const getCSRFToken = async () => {
    const response = await getCsrfToken()
    axios.defaults.headers.post['Csrf-token'] = response.value
    axios.defaults.headers.put['Csrf-token'] = response.value
    axios.defaults.headers.delete['Csrf-token'] = response.value
  }

  useEffect(() => {
    void getCSRFToken()
  }, [])

  // Set the token for client side requests to use
  useEffect(() => {
    logger.debug('[HttpHeaderProvider][SessionChanged]', {
      hasToken: !!session?.access_token,
      tokenPreview: session?.access_token?.slice(-10),
      expires_at: session?.expires_at,
      error: session?.error,
    })

    const token = session?.access_token
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      logger.info('[HttpHeaderProvider] Axios defaults updated with new token')
    } else {
      // legacy
      delete axios.defaults.headers.common['Authorization']
    }
    const tokenIssuer = session?.access_token_issuer
    if (tokenIssuer) {
      axios.defaults.headers.common['X-Token-Issuer'] = tokenIssuer
    }
    // Note: Session error handling (e.g., RefreshAccessTokenError) is now handled
    // exclusively by TokenWatcher, which shows a user-friendly modal before logout
  }, [session?.access_token, session?.access_token_issuer, session?.error, session?.expires_at])

  return null
}
