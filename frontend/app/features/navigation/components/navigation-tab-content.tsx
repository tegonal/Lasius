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

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type NavigationRouteType, type NavigationSection } from '~/config/navigation'
import {
  useNavigateToRoute,
  useSectionRoutes,
} from '~/features/navigation/hooks/use-navigation-routes'

export const NavigationTabContent = ({
  branch,
  navigation,
}: {
  branch: string
  navigation: NavigationSection[]
}) => {
  const routes = useSectionRoutes(branch, navigation)

  return (
    <div className="flex flex-col items-start justify-start gap-3">
      {routes.map((item) => (
        <NavigationButton item={item} key={item.name} />
      ))}
    </div>
  )
}

const NavigationButton = ({ item }: { item: NavigationRouteType }) => {
  const { isActive, navigateTo } = useNavigateToRoute()

  return (
    <Button
      fullWidth
      onClick={() => navigateTo(item.route)}
      variant={isActive(item.route) ? 'navigationActive' : 'navigation'}>
      <LucideIcon icon={item.icon} size={24} />
      <div>{item.name}</div>
    </Button>
  )
}
