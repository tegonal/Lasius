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

import { SquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRouteLoaderData } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type ModelsCurrentUserTimeBooking } from '~/services/api/lasius/modelsCurrentUserTimeBooking'

export const BookingCurrent = () => {
	const loaderData = useRouteLoaderData('routes/user.home._index') as
		| undefined
		| { currentBooking: ModelsCurrentUserTimeBooking | undefined }

	const currentBooking = loaderData?.currentBooking

	return (
		<div className="bg-base-200 relative flex h-full min-h-[96px] w-full flex-row items-center gap-3 overflow-hidden px-2 py-3 sm:px-3 md:bg-transparent lg:px-4 [&>*]:w-full">
			{!currentBooking?.booking ? (
				<NoBooking />
			) : (
				<CurrentBookingEntry booking={currentBooking.booking} />
			)}
		</div>
	)
}

const NoBooking = () => {
	const { t } = useTranslation('common')
	return (
		<div className="text-base-content/60 flex items-center justify-center gap-2">
			<span className="text-sm">
				{t('bookings.noCurrentBooking', {
					defaultValue: 'No booking running',
				})}
			</span>
		</div>
	)
}

const CurrentBookingEntry = ({
	booking,
}: {
	booking: NonNullable<ModelsCurrentUserTimeBooking['booking']>
}) => {
	const { t } = useTranslation('common')

	const projectName =
		booking.projectReference?.key ??
		t('bookings.unknownProject', { defaultValue: 'Unknown' })

	return (
		<div className="grid h-full w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:gap-4">
			<Button
				className="text-error"
				fullWidth={false}
				title={t('bookings.actions.stopRecording', {
					defaultValue: 'Stop recording current time booking',
				})}
				variant="ghost"
			>
				<LucideIcon icon={SquareIcon} size={24} />
			</Button>
			<div className="flex w-full min-w-0 flex-col gap-1 overflow-hidden leading-normal">
				<span className="truncate font-semibold">{projectName}</span>
				{booking.tags && booking.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{booking.tags.map((tag) => (
							<span
								className="badge badge-sm badge-outline"
								key={`${tag.id}-${tag.type}`}
							>
								{tag.id}
							</span>
						))}
					</div>
				)}
			</div>
			<div className="text-base-content/60 text-sm">
				{booking.start?.dateTime &&
					new Date(booking.start.dateTime).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
			</div>
		</div>
	)
}
