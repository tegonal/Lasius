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

import { Button } from 'components/primitives/buttons/Button'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { SelectedTabIcon } from 'components/ui/animations/motion/selectedTabIcon'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { AnimatePresence, m } from 'framer-motion'
import { cn } from 'lib/utils/cn'
import { LucideIcon as LucideIconType } from 'lucide-react'
import React, { useEffect, useId, useState } from 'react'
import { useTabViews, useUIActions } from 'stores/uiStore'

const PresenceItem = m.div

export type IconTabsItem = {
  id: string
  name: string
  component: React.ReactNode
  icon: LucideIconType
  routes?: string[]
}

type Props = {
  tabs: IconTabsItem[]
  position?: 'top' | 'left'
  initialTab?: number
}

export const IconTabs: React.FC<Props> = ({ tabs, position = 'top', initialTab = 0 }) => {
  const tabViews = useTabViews()
  const { setTabActive } = useUIActions()

  const tabId = useId()

  const [selected, setSelected] = useState(initialTab)

  useEffect(() => {
    if (!tabViews.find((tab) => tab.id === tabId)) {
      setTabActive(tabId, initialTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tabView = tabViews.find((tab) => tab.id === tabId)
    if (tabView) {
      setSelected(tabView.activeIndex)
    }
  }, [tabViews, tabId])

  const handleTabClick = (index: number) => {
    setTabActive(tabId, index)
  }

  return (
    <div
      className={`relative grid h-full w-full justify-stretch gap-0 overflow-auto ${
        position === 'top' ? 'grid-rows-[min-content_auto]' : 'grid-cols-[min-content_auto]'
      }`}>
      <div
        className={`mx-2 flex pt-0 sm:mx-3 sm:pt-2 ${
          position === 'top'
            ? 'border-base-content/10 flex-row justify-center border-b'
            : 'border-base-content/10 flex-col justify-start gap-2 border-r'
        }`}>
        {tabs.map((item, index) => (
          <div key={item.id} className={cn('relative z-10', index === selected && 'selected')}>
            {index === selected ? <SelectedTabIcon layoutId={tabId} radiusOn={position} /> : null}
            <Button
              variant="tabs"
              onClick={() => handleTabClick(index)}
              className="relative z-20"
              title={item.name}
              aria-label={item.name}
              fullWidth={false}>
              <LucideIcon icon={item.icon} size={24} />
            </Button>
          </div>
        ))}
      </div>
      <ScrollContainer className="pt-2">
        <AnimatePresence initial={false} mode="popLayout">
          <PresenceItem
            key={`menuBooking-${selected}`}
            animate={{ opacity: 1, ...(position === 'top' ? { y: 0 } : { x: 0 }) }}
            initial={{ opacity: 0, ...(position === 'top' ? { y: 20 } : { x: 10 }) }}
            exit={{ opacity: 0, ...(position === 'top' ? { y: -20 } : { x: -10 }) }}
            transition={{ duration: 0.15 }}>
            {tabs[selected].component}
          </PresenceItem>
        </AnimatePresence>
      </ScrollContainer>
    </div>
  )
}
