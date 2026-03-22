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

import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { getNavigation, type NavigationRouteType } from '~/config/navigation'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'

export const NavigationTabContent = ({ branch }: { branch: string }) => {
	const { isAdministrator } = useOrganisation()
	const loaderData = useLayoutLoaderData()

	return (
		<div className="flex flex-col items-start justify-start gap-3">
			{getNavigation({
				id: branch,
				isOrganisationAdministrator: isAdministrator,
				isUserOfInternalOAuthProvider: loaderData?.tokenIssuer === 'internal',
			}).map((item) => (
				<NavigationButton item={item} key={item.name} />
			))}
		</div>
	)
}

const NavigationButton = ({ item }: { item: NavigationRouteType }) => {
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation('common')

	const isActive = location.pathname === item.route

	return (
		<Button
			fullWidth
			onClick={() => void navigate(item.route)}
			variant={isActive ? 'navigationActive' : 'navigation'}
		>
			<LucideIcon icon={item.icon} size={24} />
			<div>{t(item.name)}</div>
		</Button>
	)
}
