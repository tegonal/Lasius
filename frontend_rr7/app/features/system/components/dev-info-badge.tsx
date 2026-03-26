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

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { API_ROUTES, TOKEN_TIME_UPDATE_INTERVAL_MS } from '~/config/constants'

/**
 * Dev-only overlay badge showing current breakpoint, language, theme, and token time remaining.
 * Only renders in development mode. Polls /api/session-status every 5s for token expiry.
 */
export const DevInfoBadge = () => {
  const { i18n } = useTranslation()
  const [tokenTime, setTokenTime] = useState('N/A')
  const [colorMode, setColorMode] = useState('light')

  const updateTokenTime = useCallback(async () => {
    try {
      const res = await fetch(API_ROUTES.SESSION_STATUS)
      if (!res.ok) {
        setTokenTime('N/A')
        return
      }
      const status: { authenticated: boolean; expiresAt: null | number } =
        await res.json()

      if (!status.authenticated || !status.expiresAt) {
        setTokenTime('N/A')
        return
      }

      const diffMs = status.expiresAt - Date.now()
      if (diffMs <= 0) {
        setTokenTime('EXPIRED')
      } else {
        const m = Math.floor(diffMs / 60_000)
        const s = Math.floor((diffMs % 60_000) / 1000)
        setTokenTime(`${m}m ${s}s`)
      }
    } catch {
      setTokenTime('ERR')
    }
  }, [])

  useEffect(() => {
    void updateTokenTime()
    const id = setInterval(
      () => void updateTokenTime(),
      TOKEN_TIME_UPDATE_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [updateTokenTime])

  useEffect(() => {
    const theme = document.documentElement.dataset.theme || 'light'
    setColorMode(theme)

    const observer = new MutationObserver(() => {
      setColorMode(document.documentElement.dataset.theme || 'light')
    })
    observer.observe(document.documentElement, {
      attributeFilter: ['data-theme'],
      attributes: true,
    })
    return () => observer.disconnect()
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  const info = `${i18n.language} | ${colorMode} | Token: ${tokenTime}`

  return (
    <div className="fixed bottom-2 left-2 z-50">
      <div className="block sm:hidden">
        <Badge>&lt; sm (640px) | {info}</Badge>
      </div>
      <div className="hidden sm:block md:hidden">
        <Badge>sm (640px) &gt; &lt; md (768px) | {info}</Badge>
      </div>
      <div className="hidden md:block lg:hidden">
        <Badge>md (768px) &gt; &lt; lg (1024px) | {info}</Badge>
      </div>
      <div className="hidden lg:block xl:hidden">
        <Badge>lg (1024px) &gt; &lt; xl (1280px) | {info}</Badge>
      </div>
      <div className="hidden xl:block 2xl:hidden">
        <Badge>xl (1280px) &gt; &lt; 2xl (1536px) | {info}</Badge>
      </div>
      <div className="hidden 2xl:block">
        <Badge>2xl (1536px) &gt; | {info}</Badge>
      </div>
    </div>
  )
}

const Badge = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="badge badge-neutral badge-sm opacity-70">{children}</span>
  )
}
