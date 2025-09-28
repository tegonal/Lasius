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

import { Badge } from 'components/ui/data-display/Badge'
import { useColorMode } from 'lib/hooks/useColorMode'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { BUILD_ID, DEV } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { useIsClient, useMediaQuery } from 'usehooks-ts'

export const DevInfoBadge: React.FC = () => {
  const { locale } = useRouter()
  const { t } = useTranslation('common')
  const { data: session, update } = useSession()
  const [mode] = useColorMode()
  const [colorMode, setColorMode] = useState<string>('light')
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<string>('')
  const isClient = useIsClient()

  // Media queries matching Tailwind breakpoints
  const isSm = useMediaQuery('(min-width: 640px)')
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')

  const breakpointIndex = isLg ? 3 : isMd ? 2 : isSm ? 1 : 0

  useEffect(() => {
    setColorMode(mode || 'light')
  }, [mode])

  useEffect(() => {
    // Update token time remaining every second
    const updateTokenTime = async () => {
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        const diffMs = expiresAt.getTime() - now.getTime()

        if (diffMs <= 0) {
          setTokenTimeRemaining('EXPIRED - Refreshing...')
          // Token expired, trigger a session update to get the new token
          await update()
        } else {
          const diffMinutes = Math.floor(diffMs / 60000)
          const diffSeconds = Math.floor((diffMs % 60000) / 1000)
          setTokenTimeRemaining(`${diffMinutes}m ${diffSeconds}s`)
        }
      } else {
        setTokenTimeRemaining('N/A')
      }
    }

    updateTokenTime()
    const interval = setInterval(updateTokenTime, 1000)
    return () => clearInterval(interval)
  }, [session, update])

  if (!isClient || !DEV) return null

  const info = `(${breakpointIndex}) | ${locale} | ${BUILD_ID} | ${colorMode} | Token: ${tokenTimeRemaining} | ${t('app.name', { defaultValue: 'Lasius' })}`

  return (
    <div className="fixed bottom-2 left-2">
      <div className="block sm:hidden">
        <Badge>&lt; sm | {info}</Badge>
      </div>
      <div className="hidden sm:block md:hidden">
        <Badge>sm &gt; &lt; md | {info}</Badge>
      </div>
      <div className="hidden md:block lg:hidden">
        <Badge>md &gt; &lt; lg | {info}</Badge>
      </div>
      <div className="hidden lg:block">
        <Badge>lg &gt; | {info}</Badge>
      </div>
    </div>
  )
}
