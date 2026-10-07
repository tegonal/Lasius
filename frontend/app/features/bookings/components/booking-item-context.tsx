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

import { Modal } from '~/components/ui/overlays/modal/modal'
import { BookingAddUpdateForm } from '~/features/bookings/components/booking-add-update-form'
import { useHomeLoaderData, useSelectedOrgId } from '~/features/bookings/hooks/use-home-loader-data'
import { useStopAndStart } from '~/features/bookings/hooks/use-stop-and-start'
import { ContextButtonAction } from '~/features/context-menu/buttons/context-button-action'
import { ContextButtonAddFavorite } from '~/features/context-menu/buttons/context-button-add-favorite'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextButtonStartBooking } from '~/features/context-menu/buttons/context-button-start-booking'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { formatISOLocale } from '~/lib/utils/dates'
import { areTimesWithinOneMinute } from '~/lib/utils/time'
import { type ModelsBooking } from '~/services/api/lasius'
import {
  useDeleteUserBooking,
  useUpdateUserBooking,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

type Properties = {
  item: AugmentedBooking
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

export const BookingItemContext = ({ item }: Properties) => {
  const { t } = useTranslation('common')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { handleCloseAll } = useContextMenu()
  const { next: nextBooking, previous: previousBooking } = useGetAdjacentBookings(item)
  const selectedOrgId = useSelectedOrgId()
  const currentBookingId = useCurrentBookingId()
  const bookingDeletionApi = useDeleteUserBooking()
  const updateBookingApi = useUpdateUserBooking()
  const favoriteAdditionApi = useAddFavoriteBooking()
  const stopAndStartApi = useStopAndStart()

  const shouldShowStartAdjustment =
    !!previousBooking?.end?.dateTime &&
    !areTimesWithinOneMinute(item.start.dateTime, previousBooking.end.dateTime)

  const shouldShowEndAdjustment =
    !!nextBooking?.start?.dateTime &&
    !!item.end &&
    !areTimesWithinOneMinute(item.end.dateTime, nextBooking.start.dateTime)

  const deleteItem = () => {
    bookingDeletionApi.submit({ bookingId: item.id, orgId: selectedOrgId })
    handleCloseAll()
  }

  const adjustStartToPrevious = () => {
    if (!previousBooking?.end?.dateTime) {
      return
    }

    updateBookingApi.submit({
      body: {
        end: item.end ? formatISOLocale(new Date(item.end.dateTime)) : undefined,
        projectId: item.projectReference?.id || '',
        start: formatISOLocale(new Date(previousBooking.end.dateTime)),
        tags: item.tags || [],
      },
      bookingId: item.id,
      orgId: selectedOrgId,
    })
    handleCloseAll()
  }

  const adjustEndToNext = () => {
    if (!(nextBooking?.start?.dateTime && item.end)) {
      return
    }

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
    favoriteAdditionApi.submit({
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
      <ContextBody hash={item.id}>
        <ContextButtonOpen data-testid="booking-ctx-open-btn" />
        <ContextAnimatePresence>
          <ContextBar>
            <ContextButtonStartBooking
              data-testid="booking-ctx-start-btn"
              item={item}
              onStart={startBooking}
            />
            <ContextButtonAction
              data-testid="booking-ctx-edit-btn"
              icon={Pencil}
              label={t('bookings:actions.edit', 'Edit booking')}
              onClick={() => {
                setIsEditModalOpen(true)
                handleCloseAll()
              }}
            />
            {shouldShowStartAdjustment && (
              <ContextButtonAction
                data-testid="booking-ctx-adjust-start-btn"
                icon={ArrowDownToLine}
                label={t(
                  'bookings:actions.adjustStartToPrevious',
                  'Adjust start to previous booking',
                )}
                onClick={adjustStartToPrevious}
              />
            )}
            {shouldShowEndAdjustment && (
              <ContextButtonAction
                data-testid="booking-ctx-adjust-end-btn"
                icon={ArrowUpToLine}
                label={t('bookings:actions.adjustEndToNext', 'Adjust end to next booking')}
                onClick={adjustEndToNext}
              />
            )}
            <ContextButtonAddFavorite
              data-testid="booking-ctx-favorite-btn"
              item={item}
              onAddFavorite={addFavorite}
            />
            <ContextButtonAction
              data-testid="booking-ctx-delete-btn"
              icon={Trash2}
              label={t('bookings:actions.delete', 'Delete booking')}
              onClick={deleteItem}
            />
            <ContextBarDivider />
            <ContextButtonClose />
          </ContextBar>
        </ContextAnimatePresence>
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
