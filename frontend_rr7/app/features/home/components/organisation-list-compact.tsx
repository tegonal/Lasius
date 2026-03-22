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

import { ContextMenuProvider } from '~/components/features/context-menu/hooks/use-context-menu'
import { AnimateList } from '~/components/ui/animations/animate-list'
import { stringHash } from '~/lib/utils/string-hash'
import {
	type ModelsCurrentUserTimeBooking,
	type ModelsUserStub,
} from '~/services/api/lasius'

import { BookingListEmptyToday } from './booking-list-empty-today'
import { OrganisationItem } from './organisation-item'
import { OrganisationListWrapper } from './organisation-list-wrapper'

type Props = {
	orgBookings: ModelsCurrentUserTimeBooking[]
	selectedOrgId: string
	users: ModelsUserStub[]
}

export const OrganisationListCompact = ({
	orgBookings,
	selectedOrgId,
	users,
}: Props) => {
	const hasNoData = !orgBookings || orgBookings.length === 0

	return (
		<ContextMenuProvider>
			<OrganisationListWrapper>
				{hasNoData ? (
					<BookingListEmptyToday />
				) : (
					<AnimateList popLayout>
						{orgBookings.map((item) => (
							<OrganisationItem
								item={item}
								key={stringHash(item)}
								selectedOrgId={selectedOrgId}
								users={users}
							/>
						))}
					</AnimateList>
				)}
			</OrganisationListWrapper>
		</ContextMenuProvider>
	)
}
