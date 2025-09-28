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
import { SelectedTab } from 'components/ui/animations/motion/selectedTab'
import { AnimatePresence, m } from 'framer-motion'
import React, { useEffect, useId, useState } from 'react'
import { useTabViews, useUIActions } from 'stores/uiStore'

type TabItem = { label: string; component: React.ReactNode; icon?: string }

type Props = {
  tabs: TabItem[]
}

export const Tabs: React.FC<Props> = ({ tabs }) => {
  const tabViews = useTabViews()
  const { setTabActive } = useUIActions()

  const [selected, setSelected] = useState<number>(0)

  const tabId = useId()

  useEffect(() => {
    if (!tabViews.find((tab) => tab.id === tabId)) {
      setTabActive(tabId, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tabView = tabViews.find((tab) => tab.id === tabId)
    if (tabView) {
      setSelected(tabView.activeIndex)
    }
  }, [tabViews, tabId])

  return (
    <div className="border-base-content/20 flex w-full flex-col border-b">
      <div className="border-base-content/20 flex flex-shrink-0 flex-row justify-start gap-3 border-b">
        {tabs.map((item, index) => (
          <div key={item.label} className="relative z-[1]">
            {index === selected ? <SelectedTab layoutId={tabId} /> : null}
            <Button
              variant="ghost"
              onClick={() => setSelected(index)}
              className="relative z-[2]"
              aria-label={item.label}>
              {item.label}
            </Button>
          </div>
        ))}
      </div>
      <div className="w-full py-3">
        <AnimatePresence initial={false} mode="wait">
          <m.div
            key={`menuNavColumn-${selected}`}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}>
            {tabs[selected].component}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
