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

import { differenceInSeconds } from 'date-fns'
import { ArrowDownToLineIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal'
import { BookingEditRunning } from '~/features/bookings/components/booking-edit-running'
import {
	useHomeLoaderData,
	useSelectedOrgId,
} from '~/features/bookings/hooks/use-home-loader-data'
import { ContextButtonAddFavorite } from '~/features/context-menu/buttons/context-button-add-favorite'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { formatISOLocale } from '~/lib/utils/dates'
import {
	type ModelsBooking,
	type ModelsCurrentUserTimeBooking,
} from '~/services/api/lasius'
import { useUpdateUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

type Props = {
	item: ModelsBooking
}

const areTimesWithinOneMinute = (
	time1: Date | string,
	time2: Date | string,
): boolean => {
	const d1 = typeof time1 === 'string' ? new Date(time1) : time1
	const d2 = typeof time2 === 'string' ? new Date(time2) : time2
	return Math.abs(differenceInSeconds(d1, d2)) <= 60
}

const useCurrentBooking = (): ModelsCurrentUserTimeBooking | undefined => {
	const loaderData = useHomeLoaderData()
	return loaderData?.currentBooking
}

const useGetPreviousBooking = (item: ModelsBooking) => {
	const loaderData = useHomeLoaderData()

	const bookings = loaderData?.augmentedBookings ?? []
	const index = bookings.findIndex((b) => b.id === item.id)
	return index < bookings.length - 1 ? bookings[index + 1] : null
}

export const BookingCurrentEntryContext = ({ item }: Props) => {
	const { t } = useTranslation('common')
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
	const previousBooking = useGetPreviousBooking(item)
	const selectedOrgId = useSelectedOrgId()
	const currentBooking = useCurrentBooking()
	const updateCurrentApi = useUpdateUserBookingCurrent()
	const addFavoriteApi = useAddFavoriteBooking()

	const shouldShowStartAdjustment =
		previousBooking?.end?.dateTime &&
		!areTimesWithinOneMinute(item.start.dateTime, previousBooking.end.dateTime)

	const editCurrentBooking = () => {
		setIsEditModalOpen(true)
		handleCloseAll()
	}

	const adjustStartToPrevious = () => {
		if (previousBooking?.end?.dateTime) {
			updateCurrentApi.submit({
				body: {
					newStart: formatISOLocale(new Date(previousBooking.end.dateTime)),
				},
				bookingId: item.id,
				orgId: selectedOrgId,
			})
			handleCloseAll()
		}
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
							<ContextButtonWrapper>
								<Button
									aria-label={t('bookings.actions.edit', {
										defaultValue: 'Edit booking',
									})}
									fullWidth={false}
									onClick={editCurrentBooking}
									shape="circle"
									title={t('bookings.actions.edit', {
										defaultValue: 'Edit booking',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={PencilIcon} size={24} />
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
										<LucideIcon icon={ArrowDownToLineIcon} size={24} />
									</Button>
								</ContextButtonWrapper>
							)}
							<ContextButtonAddFavorite
								item={item}
								onAddFavorite={addFavorite}
							/>
							<ContextBarDivider />
							<ContextButtonClose />
						</ContextBar>
					</ContextAnimatePresence>
				)}
			</ContextBody>
			{currentBooking && (
				<Modal onClose={() => setIsEditModalOpen(false)} open={isEditModalOpen}>
					<BookingEditRunning
						item={currentBooking}
						onClose={() => setIsEditModalOpen(false)}
						selectedOrgId={selectedOrgId}
					/>
				</Modal>
			)}
		</>
	)
}
