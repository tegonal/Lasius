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

import { TagList } from '~/components/ui/data-display/tag-list'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { cn } from '~/lib/utils/cn'

import { BookingDuration } from './booking-duration'
import { BookingFromTo } from './booking-from-to'
import { BookingFromToMobile } from './booking-from-to-mobile'
import { BookingItemContext } from './booking-item-context'
import { BookingName } from './booking-name'

type Props = {
	item: AugmentedBooking
}

export const BookingItem = ({ item }: Props) => {
	return (
		<div
			className={cn(
				'relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 py-3 md:gap-4 md:px-4',
				item.overlapsWithNext
					? 'border-warning border-b-4 border-dotted'
					: 'border-base-content/20 border-b',
				item.isMostRecent && 'border-base-content/20 border-t',
			)}
		>
			<div className="flex w-full min-w-0 flex-col gap-3">
				<BookingName item={item} />
				<TagList items={item.tags} />
			</div>
			<div className="flex h-full flex-row items-center justify-start gap-3 md:gap-4">
				<div className="hidden h-full flex-row items-center justify-start gap-2 md:flex md:gap-4">
					<BookingFromTo item={item} />
					<BookingDuration item={item} />
				</div>
				<div className="flex h-full flex-col items-end justify-center gap-2 md:hidden">
					<BookingFromToMobile item={item} />
					<BookingDuration item={item} />
				</div>
				<BookingItemContext item={item} />
			</div>
		</div>
	)
}
