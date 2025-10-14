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
import { getIsDev, getLasiusVersion } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { useTokenStore } from 'stores/tokenStore'
import { useUIStore } from 'stores/uiStore'
import { useIsClient } from 'usehooks-ts'

export const DevInfoBadge: React.FC = () => {
  const { t, i18n } = useTranslation('common')
  const { tokenTimeRemaining } = useTokenStore()
  const globalLoadingCounter = useUIStore((state) => state.globalLoadingCounter)
  const [mode] = useColorMode()
  const [colorMode, setColorMode] = useState<string>('light')
  const isClient = useIsClient()

  useEffect(() => {
    setColorMode(mode || 'light')
  }, [mode])

  if (!isClient || !getIsDev()) return null

  const info = `${i18n.language} | ${getLasiusVersion()} | ${colorMode} | Token: ${tokenTimeRemaining} | Loading: ${globalLoadingCounter} | ${t('app.name', { defaultValue: 'Lasius' })}`

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
