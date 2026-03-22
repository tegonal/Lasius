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
import { useRouteLoaderData } from 'react-router'

import { ContextMenuProvider } from '~/components/features/context-menu/hooks/use-context-menu'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'

import { BookingItem } from './booking-item'

export const BookingListSelectedDay = () => {
	const { t } = useTranslation('common')
	const loaderData = useRouteLoaderData('routes/user.home._index') as
		| undefined
		| { augmentedBookings: AugmentedBooking[] }

	const bookings = loaderData?.augmentedBookings ?? []

	if (bookings.length === 0) {
		return (
			<div className="text-base-content/60 flex flex-col items-center justify-center gap-2 p-8">
				<span className="text-sm">
					{t('bookings.noBookingsToday', {
						defaultValue: 'No bookings for this day',
					})}
				</span>
			</div>
		)
	}

	return (
		<ContextMenuProvider>
			<div className="flex flex-col">
				{bookings.map((item, index) => (
					<div
						className="animate-fade-in"
						key={item.id}
						style={{
							animationDelay: `${index * 0.12}s`,
							animationDuration: '0.5s',
							animationFillMode: 'both',
						}}
					>
						<BookingItem item={item} />
					</div>
				))}
			</div>
		</ContextMenuProvider>
	)
}
