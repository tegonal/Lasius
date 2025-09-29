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

import { useSignOut } from 'components/features/system/hooks/useSignOut'
import { logger } from 'lib/logger'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { TokenState, useTokenStore } from 'stores/tokenStore'

export const TokenWatcher: React.FC = () => {
  const { data: session, update, status } = useSession()
  const { signOut } = useSignOut()
  const setTokenState = useTokenStore((state) => state.setTokenState)
  const setTokenTimeRemaining = useTokenStore((state) => state.setTokenTimeRemaining)
  const setExpiresAt = useTokenStore((state) => state.setExpiresAt)
  const hasTriggeredLogoutRef = useRef(false)
  const previousTokenStateRef = useRef<TokenState>('no_session')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only start watching if we have an authenticated session with a token
    if (status !== 'authenticated' || !session?.access_token) {
      // Only update state if it's actually changing
      if (previousTokenStateRef.current !== 'no_session') {
        setTokenState('no_session')
        setTokenTimeRemaining('N/A')
        setExpiresAt(null)
        previousTokenStateRef.current = 'no_session'
      }
      return
    }

    // Reset the logout trigger flag when we have a valid session
    hasTriggeredLogoutRef.current = false

    // Update token time remaining every second
    const updateTokenTime = async () => {
      // Check if session still exists and has required fields
      if (!session?.access_token || !session?.expires_at) {
        // Only update if state is changing
        if (previousTokenStateRef.current !== 'no_session') {
          setTokenState('no_session')
          setTokenTimeRemaining('N/A')
          setExpiresAt(null)

          // Only trigger logout if we previously had a valid token (token was revoked/expired)
          if (!hasTriggeredLogoutRef.current && previousTokenStateRef.current === 'valid') {
            hasTriggeredLogoutRef.current = true
            logger.warn('[TokenWatcher] Token became invalid, triggering logout')
            await signOut()
          }
          previousTokenStateRef.current = 'no_session'
        }
        return
      }

      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      const diffMs = expiresAt.getTime() - now.getTime()

      // Always update expires_at if it changed
      setExpiresAt(session.expires_at)

      if (diffMs <= 0) {
        // Only update state if it's changing
        if (
          previousTokenStateRef.current !== 'expired' &&
          previousTokenStateRef.current !== 'refreshing'
        ) {
          setTokenState('expired')
          setTokenTimeRemaining('EXPIRED - Refreshing...')
          previousTokenStateRef.current = 'expired'
          logger.info('[TokenWatcher] Token expired, refreshing session')
          // Token expired, trigger a session update to get the new token
          await update()
          // After update, set state to refreshing
          setTokenState('refreshing')
          previousTokenStateRef.current = 'refreshing'
        }
      } else {
        // Update to valid state only if not already valid
        if (previousTokenStateRef.current !== 'valid') {
          setTokenState('valid')
          previousTokenStateRef.current = 'valid'
        }
        // Always update time remaining
        const diffMinutes = Math.floor(diffMs / 60000)
        const diffSeconds = Math.floor((diffMs % 60000) / 1000)
        setTokenTimeRemaining(`${diffMinutes}m ${diffSeconds}s`)
      }
    }

    // Run immediately
    updateTokenTime()

    // Set up interval for updates
    intervalRef.current = setInterval(updateTokenTime, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [session, status, update, setTokenState, setTokenTimeRemaining, setExpiresAt, signOut])

  return null
}
