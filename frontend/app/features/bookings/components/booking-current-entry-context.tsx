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

import { ArrowDownToLineIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/ui/overlays/modal/modal'
import { BookingEditRunning } from '~/features/bookings/components/booking-edit-running'
import { useHomeLoaderData } from '~/features/bookings/hooks/use-home-loader-data'
import { ContextButtonAction } from '~/features/context-menu/buttons/context-button-action'
import { ContextButtonAddFavorite } from '~/features/context-menu/buttons/context-button-add-favorite'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { formatISOLocale } from '~/lib/utils/dates'
import { areTimesWithinOneMinute } from '~/lib/utils/time'
import { type ModelsBooking, type ModelsCurrentUserTimeBooking } from '~/services/api/lasius'
import { useUpdateUserBookingCurrent } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

type Properties = {
  /** Override currentBooking (e.g. from app-layout loader when not on home route) */
  currentBookingOverride?: ModelsCurrentUserTimeBooking
  item: ModelsBooking
  /** Override selectedOrgId (when not on home route) */
  selectedOrgIdOverride?: string
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

export const BookingCurrentEntryContext = ({
  currentBookingOverride,
  item,
  selectedOrgIdOverride,
}: Properties) => {
  const { t } = useTranslation('common')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { handleCloseAll } = useContextMenu()
  const previousBooking = useGetPreviousBooking(item)
  const { selectedOrganisationId } = useOrganisation()
  const homeCurrentBooking = useCurrentBooking()
  const currentBooking = currentBookingOverride ?? homeCurrentBooking
  const selectedOrgId = selectedOrgIdOverride ?? selectedOrganisationId
  const updateCurrentApi = useUpdateUserBookingCurrent()
  const favoriteAdditionApi = useAddFavoriteBooking()

  const shouldShowStartAdjustment =
    !!previousBooking?.end?.dateTime &&
    !areTimesWithinOneMinute(item.start.dateTime, previousBooking.end.dateTime)

  const editCurrentBooking = () => {
    setIsEditModalOpen(true)
    handleCloseAll()
  }

  const adjustStartToPrevious = () => {
    if (!previousBooking?.end?.dateTime) {
      return
    }

    updateCurrentApi.submit({
      body: {
        newStart: formatISOLocale(new Date(previousBooking.end.dateTime)),
      },
      bookingId: item.id,
      orgId: selectedOrgId,
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
        <ContextButtonOpen data-testid="booking-current-ctx-open-btn" />
        <ContextAnimatePresence>
          <ContextBar>
            <ContextButtonAction
              data-testid="booking-current-edit-btn"
              icon={PencilIcon}
              label={t('bookings:actions.edit', 'Edit booking')}
              onClick={editCurrentBooking}
            />
            {shouldShowStartAdjustment && (
              <ContextButtonAction
                data-testid="booking-current-adjust-start-btn"
                icon={ArrowDownToLineIcon}
                label={t(
                  'bookings:actions.adjustStartToPrevious',
                  'Adjust start to previous booking',
                )}
                onClick={adjustStartToPrevious}
              />
            )}
            <ContextButtonAddFavorite
              data-testid="booking-current-favorite-btn"
              item={item}
              onAddFavorite={addFavorite}
            />
            <ContextBarDivider />
            <ContextButtonClose />
          </ContextBar>
        </ContextAnimatePresence>
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
