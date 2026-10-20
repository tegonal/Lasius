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

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Tooltip, TooltipProvider } from '~/components/ui/overlays/tooltip'
import { type NavigationSection } from '~/config/navigation'
import {
  useNavigateToRoute,
  useSectionRoutes,
} from '~/features/navigation/hooks/use-navigation-routes'
import { cn } from '~/lib/utils/cn'

interface NavigationRailProperties {
  className?: string
  navigation: NavigationSection[]
  onSelect: (index: number) => void
  selected: number
}

/** The tablet navigation: the section icons, then the page icons of the selected section. */
export const NavigationRail = ({
  className,
  navigation,
  onSelect,
  selected,
}: NavigationRailProperties) => {
  const section = navigation[selected]
  const routes = useSectionRoutes(section?.level ?? '', navigation)
  const { isActive, navigateTo } = useNavigateToRoute()

  return (
    <TooltipProvider>
      <nav className={cn('flex h-full flex-col items-center gap-1 pt-1', className)}>
        {navigation.map((item, index) => (
          <RailButton
            icon={item.icon}
            isActive={index === selected}
            isSection
            key={item.level}
            label={item.name}
            onClick={() => onSelect(index)}
            testId={`nav-rail-${item.level}`}
          />
        ))}
        <div className="border-base-content/10 my-2 w-8 border-t" />
        {routes.map((route) => (
          <RailButton
            icon={route.icon}
            isActive={isActive(route.route)}
            key={route.route}
            label={route.name}
            onClick={() => navigateTo(route.route)}
            testId={`nav-rail-page-${route.route}`}
          />
        ))}
      </nav>
    </TooltipProvider>
  )
}

interface RailButtonProperties {
  icon: LucideIconType
  isActive: boolean
  /** A section button selects a page group. Only a page button marks the current page. */
  isSection?: boolean
  label: string
  onClick: () => void
  testId: string
}

const RailButton = ({
  icon,
  isActive,
  isSection = false,
  label,
  onClick,
  testId,
}: RailButtonProperties) => (
  <Tooltip label={label} side="right">
    <Button
      aria-current={!isSection && isActive ? 'page' : undefined}
      aria-label={label}
      aria-pressed={isSection ? isActive : undefined}
      className={cn(
        // The navigation variant sets h-auto and p-3, so btn-square alone gives no square.
        'h-12 w-12 justify-center p-0',
        isSection && isActive && 'bg-red-gradient hover:bg-red-gradient text-white',
      )}
      data-testid={testId}
      fullWidth={false}
      onClick={onClick}
      shape="square"
      variant={isActive ? 'navigationActive' : 'navigation'}>
      <LucideIcon icon={icon} size={24} />
    </Button>
  </Tooltip>
)
