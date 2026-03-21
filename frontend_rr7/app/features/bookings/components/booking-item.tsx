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

import { format } from 'date-fns'

import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { durationAsString } from '~/lib/utils/duration'

const TIME_FORMAT = 'HH:mm'

export const BookingItem = ({ item }: { item: AugmentedBooking }) => {
	const startTime = format(new Date(item.start.dateTime), TIME_FORMAT)
	const endTime = item.end
		? format(new Date(item.end.dateTime), TIME_FORMAT)
		: '...'
	const duration = item.end
		? durationAsString(item.start.dateTime, item.end.dateTime)
		: ''

	const projectName = item.projectReference?.key ?? 'Unknown'

	return (
		<div className="border-base-content/10 flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate font-medium">{projectName}</span>
				{item.tags && item.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{item.tags.map((tag) => (
							<span
								className="badge badge-xs badge-outline"
								key={`${tag.id}-${tag.type}`}
							>
								{tag.id}
							</span>
						))}
					</div>
				)}
			</div>
			<div className="text-base-content/60 flex flex-col items-end text-sm">
				<span>
					{startTime} – {endTime}
				</span>
				{duration && <span className="text-xs">{duration}</span>}
			</div>
		</div>
	)
}
