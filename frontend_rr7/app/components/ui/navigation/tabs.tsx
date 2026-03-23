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

import { type ReactNode, useRef, useState } from 'react'

import { Button } from '~/components/primitives/buttons/button'
import { SlidingIndicator } from '~/components/ui/animations/sliding-indicator'
import { cn } from '~/lib/utils/cn'

export type TabItem = {
  component: ReactNode
  label: string
}

export const Tabs = ({
  defaultIndex = 0,
  tabs,
}: {
  defaultIndex?: number
  tabs: TabItem[]
}) => {
  const [selected, setSelected] = useState(defaultIndex)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  return (
    <div className="border-base-content/20 flex min-h-0 w-full flex-1 flex-col border-b">
      <div className="border-base-content/20 relative flex flex-shrink-0 flex-row justify-start gap-3 border-b">
        <SlidingIndicator
          className="!top-auto !bottom-0 !h-[2px]"
          itemRefs={itemRefs}
          radiusOn="bottom"
          selectedIndex={selected}
        />
        {tabs.map((item, index) => (
          <div
            className="relative z-10"
            key={item.label}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
          >
            <Button
              className={cn(
                'relative z-20 rounded-none hover:bg-transparent hover:shadow-[inset_0_-2px_0_0_currentColor]',
                index === selected
                  ? 'text-base-content'
                  : 'text-base-content/60',
              )}
              fullWidth={false}
              onClick={() => setSelected(index)}
              type="button"
              variant="ghost"
            >
              {item.label}
            </Button>
          </div>
        ))}
      </div>
      <div className="relative flex min-h-0 w-full flex-1 flex-col">
        {tabs.map((item, index) => (
          <div
            className={cn(
              'flex min-h-0 w-full flex-1 flex-col py-3 transition-opacity duration-200',
              index === selected
                ? 'opacity-100'
                : 'pointer-events-none absolute inset-0 opacity-0',
            )}
            key={item.label}
          >
            {item.component}
          </div>
        ))}
      </div>
    </div>
  )
}
