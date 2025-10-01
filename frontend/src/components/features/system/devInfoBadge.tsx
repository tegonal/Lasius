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
import { useTranslation } from 'next-i18next'
import { BUILD_ID, DEV } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { useTokenStore } from 'stores/tokenStore'
import { useUIStore } from 'stores/uiStore'
import { useIsClient, useMediaQuery } from 'usehooks-ts'

export const DevInfoBadge: React.FC = () => {
  const { t, i18n } = useTranslation('common')
  const { tokenTimeRemaining } = useTokenStore()
  const globalLoadingCounter = useUIStore((state) => state.globalLoadingCounter)
  const [mode] = useColorMode()
  const [colorMode, setColorMode] = useState<string>('light')
  const isClient = useIsClient()

  // Media queries matching Tailwind breakpoints
  const isSm = useMediaQuery('(min-width: 640px)')
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')

  const breakpointIndex = isLg ? 3 : isMd ? 2 : isSm ? 1 : 0

  useEffect(() => {
    setColorMode(mode || 'light')
  }, [mode])

  if (!isClient || !DEV) return null

  const info = `(${breakpointIndex}) | ${i18n.language} | ${BUILD_ID} | ${colorMode} | Token: ${tokenTimeRemaining} | Loading: ${globalLoadingCounter} | ${t('app.name', { defaultValue: 'Lasius' })}`

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
