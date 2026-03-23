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

import { type LucideIcon as LucideIconType } from 'lucide-react'
import { type ReactNode, useRef } from 'react'

import { Button } from '~/components/primitives/buttons/button'
import { SlidingIndicator } from '~/components/ui/animations/sliding-indicator'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { cn } from '~/lib/utils/cn'

export type IconTabsItem = {
  component: ReactNode
  icon: LucideIconType
  id: string
  name: string
  routes?: string[]
}

export const IconTabs = ({
  onSelect,
  position = 'top',
  selected,
  tabs,
}: {
  onSelect: (index: number) => void
  position?: 'left' | 'top'
  selected: number
  tabs: IconTabsItem[]
}) => {
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  return (
    <div
      className={cn(
        'relative grid h-full w-full justify-stretch gap-0 overflow-hidden',
        position === 'top'
          ? 'grid-rows-[min-content_auto]'
          : 'grid-cols-[min-content_auto]',
      )}
    >
      <div
        className={cn(
          'relative flex',
          position === 'top'
            ? 'border-base-content/10 flex-row justify-center border-b pt-2 lg:pt-4 xl:pt-6'
            : 'border-base-content/10 mr-2 flex-col justify-start gap-2 border-r',
        )}
      >
        <SlidingIndicator
          itemRefs={itemRefs}
          radiusOn={position}
          selectedIndex={selected}
        />
        {tabs.map((item, index) => (
          <div
            className={cn('relative z-10', index === selected && 'selected')}
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
          >
            <Button
              aria-label={item.name}
              className="relative z-20"
              data-testid={`nav-tab-${item.id}`}
              fullWidth={false}
              onClick={() => onSelect(index)}
              title={item.name}
              variant="tabs"
            >
              <LucideIcon icon={item.icon} size={24} />
            </Button>
          </div>
        ))}
      </div>
      <ScrollArea className={position === 'top' ? 'pt-2' : ''}>
        {tabs[selected]?.component}
      </ScrollArea>
    </div>
  )
}
