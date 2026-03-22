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

import { roundToNearestMinutes } from 'date-fns'
import { ArrowDownToLine, ArrowUpToLine, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal'
import { BookingAddUpdateForm } from '~/features/bookings/components/booking-add-update-form'
import {
	useHomeLoaderData,
	useSelectedOrgId,
} from '~/features/bookings/hooks/use-home-loader-data'
import { ContextButtonAddFavorite } from '~/features/context-menu/buttons/context-button-add-favorite'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextButtonStartBooking } from '~/features/context-menu/buttons/context-button-start-booking'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { useStopAndStart } from '~/hooks/use-stop-and-start'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'
import {
	useDeleteUserBooking,
	useUpdateUserBooking,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

type Props = {
	item: AugmentedBooking
}

const areTimesWithinOneMinute = (
	time1: Date | string,
	time2: Date | string,
): boolean => {
	const d1 = typeof time1 === 'string' ? new Date(time1) : time1
	const d2 = typeof time2 === 'string' ? new Date(time2) : time2
	return Math.abs(d1.getTime() - d2.getTime()) <= 60_000
}

const useCurrentBookingId = (): string | undefined => {
	const loaderData = useHomeLoaderData()
	return loaderData?.currentBooking?.booking?.id
}

const useGetAdjacentBookings = (item: ModelsBooking) => {
	const loaderData = useHomeLoaderData()

	const bookings = loaderData?.augmentedBookings ?? []
	const index = bookings.findIndex((b) => b.id === item.id)

	return {
		next: index > 0 ? bookings[index - 1] : null,
		previous: index < bookings.length - 1 ? bookings[index + 1] : null,
	}
}

export const BookingItemContext = ({ item }: Props) => {
	const { t } = useTranslation('common')
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
	const { next: nextBooking, previous: previousBooking } =
		useGetAdjacentBookings(item)
	const selectedOrgId = useSelectedOrgId()
	const currentBookingId = useCurrentBookingId()
	const deleteBookingApi = useDeleteUserBooking()
	const updateBookingApi = useUpdateUserBooking()
	const addFavoriteApi = useAddFavoriteBooking()
	const stopAndStartApi = useStopAndStart()

	const shouldShowStartAdjustment =
		previousBooking?.end?.dateTime &&
		!areTimesWithinOneMinute(item.start.dateTime, previousBooking.end.dateTime)

	const shouldShowEndAdjustment =
		nextBooking?.start?.dateTime &&
		item.end &&
		!areTimesWithinOneMinute(item.end.dateTime, nextBooking.start.dateTime)

	const deleteItem = () => {
		deleteBookingApi.submit({ bookingId: item.id, orgId: selectedOrgId })
		handleCloseAll()
	}

	const adjustStartToPrevious = () => {
		if (previousBooking?.end?.dateTime) {
			updateBookingApi.submit({
				body: {
					end: item.end
						? formatISOLocale(new Date(item.end.dateTime))
						: undefined,
					projectId: item.projectReference?.id || '',
					start: formatISOLocale(new Date(previousBooking.end.dateTime)),
					tags: item.tags || [],
				},
				bookingId: item.id,
				orgId: selectedOrgId,
			})
			handleCloseAll()
		}
	}

	const adjustEndToNext = () => {
		if (nextBooking?.start?.dateTime && item.end) {
			updateBookingApi.submit({
				body: {
					end: formatISOLocale(new Date(nextBooking.start.dateTime)),
					projectId: item.projectReference?.id || '',
					start: formatISOLocale(new Date(item.start.dateTime)),
					tags: item.tags || [],
				},
				bookingId: item.id,
				orgId: selectedOrgId,
			})
			handleCloseAll()
		}
	}

	const startBooking = () => {
		const now = roundToNearestMinutes(new Date(), { roundingMethod: 'floor' })
		stopAndStartApi.submit({
			currentBookingId,
			orgId: selectedOrgId,
			projectId: item.projectReference?.id || '',
			start: formatISOLocale(now),
			tags: item.tags || [],
		})
		handleCloseAll()
	}

	const addFavorite = () => {
		addFavoriteApi.submit({
			body: {
				projectId: item.projectReference?.id || '',
				tags: item.tags || [],
			},
			orgId: selectedOrgId,
		})
		handleCloseAll()
	}

	return (
		<>
			<ContextBody>
				<ContextButtonOpen hash={item.id} />
				{currentOpenContextMenuId === item.id && (
					<ContextAnimatePresence>
						<ContextBar>
							<ContextButtonStartBooking item={item} onStart={startBooking} />
							<ContextButtonWrapper>
								<Button
									aria-label={t('bookings.actions.edit', {
										defaultValue: 'Edit booking',
									})}
									fullWidth={false}
									onClick={() => {
										setIsEditModalOpen(true)
										handleCloseAll()
									}}
									shape="circle"
									title={t('bookings.actions.edit', {
										defaultValue: 'Edit booking',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={Pencil} size={24} />
								</Button>
							</ContextButtonWrapper>
							{shouldShowStartAdjustment && (
								<ContextButtonWrapper>
									<Button
										aria-label={t('bookings.actions.adjustStartToPrevious', {
											defaultValue: 'Adjust start to previous booking',
										})}
										fullWidth={false}
										onClick={adjustStartToPrevious}
										shape="circle"
										title={t('bookings.actions.adjustStartToPrevious', {
											defaultValue: 'Adjust start to previous booking',
										})}
										variant="contextIcon"
									>
										<LucideIcon icon={ArrowDownToLine} size={24} />
									</Button>
								</ContextButtonWrapper>
							)}
							{shouldShowEndAdjustment && (
								<ContextButtonWrapper>
									<Button
										aria-label={t('bookings.actions.adjustEndToNext', {
											defaultValue: 'Adjust end to next booking',
										})}
										fullWidth={false}
										onClick={adjustEndToNext}
										shape="circle"
										title={t('bookings.actions.adjustEndToNext', {
											defaultValue: 'Adjust end to next booking',
										})}
										variant="contextIcon"
									>
										<LucideIcon icon={ArrowUpToLine} size={24} />
									</Button>
								</ContextButtonWrapper>
							)}
							<ContextButtonAddFavorite
								item={item}
								onAddFavorite={addFavorite}
							/>
							<ContextButtonWrapper>
								<Button
									aria-label={t('bookings.actions.delete', {
										defaultValue: 'Delete booking',
									})}
									fullWidth={false}
									onClick={deleteItem}
									shape="circle"
									title={t('bookings.actions.delete', {
										defaultValue: 'Delete booking',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={Trash2} size={24} />
								</Button>
							</ContextButtonWrapper>
							<ContextBarDivider />
							<ContextButtonClose />
						</ContextBar>
					</ContextAnimatePresence>
				)}
			</ContextBody>
			<Modal onClose={() => setIsEditModalOpen(false)} open={isEditModalOpen}>
				<BookingAddUpdateForm
					bookingAfter={nextBooking ?? undefined}
					bookingBefore={previousBooking ?? undefined}
					itemUpdate={item}
					mode="update"
					onClose={() => setIsEditModalOpen(false)}
					selectedOrgId={selectedOrgId}
				/>
			</Modal>
		</>
	)
}
