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
import { useTabSync } from 'components/ui/navigation/hooks/useTabSync'
import { AnimatePresence, m } from 'framer-motion'
import React from 'react'

type TabItem = { label: string; component: React.ReactNode; icon?: string }

type Props = {
  tabs: TabItem[]
  defaultIndex?: number
}

export const Tabs: React.FC<Props> = ({ tabs, defaultIndex = 0 }) => {
  const { selected, tabId, setSelected } = useTabSync(defaultIndex)

  return (
    <div className="border-base-content/20 flex min-h-0 w-full flex-1 flex-col border-b">
      <div className="border-base-content/20 flex flex-shrink-0 flex-row justify-start gap-3 border-b">
        {tabs.map((item, index) => (
          <div key={item.label} className="relative z-[1]">
            {index === selected ? <SelectedTab layoutId={tabId} /> : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelected(index)}
              className="relative z-[2]"
              aria-label={item.label}>
              {item.label}
            </Button>
          </div>
        ))}
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col py-3">
        <AnimatePresence initial={false} mode="wait">
          <m.div
            key={`menuNavColumn-${selected}`}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="flex min-h-0 flex-1 flex-col">
            {tabs[selected].component}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
