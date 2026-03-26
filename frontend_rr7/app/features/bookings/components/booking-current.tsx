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
import { ClockIcon, SquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { TagList } from '~/components/ui/data-display/tag-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useHomeLoaderData } from '~/features/bookings/hooks/use-home-loader-data'
import { useStopBooking } from '~/features/bookings/hooks/use-stop-booking'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'

import { BookingCurrentEntryContext } from './booking-current-entry-context'
import { BookingDurationCounter } from './booking-duration-counter'
import { BookingFrom } from './booking-from'
import { BookingName } from './booking-name'

export const BookingCurrent = () => {
  const loaderData = useHomeLoaderData()

  const currentBooking = loaderData?.currentBooking

  return (
    <div
      className="bg-base-200 relative flex h-full min-h-[96px] w-full flex-row items-center gap-3 overflow-hidden px-2 py-3 sm:px-3 md:bg-transparent lg:px-4 [&>*]:w-full"
      data-testid="booking-current-section"
    >
      {currentBooking?.booking ? (
        <ContextMenuProvider>
          <CurrentBookingEntry
            booking={currentBooking.booking}
            selectedOrgId={loaderData?.selectedOrgId ?? ''}
          />
        </ContextMenuProvider>
      ) : (
        <NoBooking />
      )}
    </div>
  )
}

const NoBooking = () => {
  const { t } = useTranslation('common')
  return (
    <div className="flex h-full w-full flex-row items-center justify-center gap-3">
      <div>
        <LucideIcon icon={ClockIcon} size={24} />
      </div>
      <div>
        {t('bookings:status.currentlyNotBooking', 'Currently not booking')}
      </div>
    </div>
  )
}

const CurrentBookingEntry = ({
  booking,
  selectedOrgId,
}: {
  booking: ModelsBooking
  selectedOrgId: string
}) => {
  const { t } = useTranslation('common')
  const stopBookingApi = useStopBooking()

  const stop = () => {
    const endTime = roundToNearestMinutes(new Date(), {
      roundingMethod: 'floor',
    })
    stopBookingApi.submit({
      bookingId: booking.id,
      end: formatISOLocale(endTime),
      orgId: selectedOrgId,
      projectId: booking.projectReference?.id || '',
      start: booking.start?.dateTime || '',
      tags: booking.tags || [],
    })
  }

  return (
    <div className="grid h-full w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 lg:gap-4">
      <Button
        data-testid="booking-current-stop-btn"
        fullWidth={false}
        onClick={stop}
        title={t(
          'bookings:actions.stopRecording',
          'Stop recording current time booking',
        )}
        variant="stopRecording"
      >
        <LucideIcon icon={SquareIcon} size={24} />
      </Button>
      <div className="flex w-full min-w-0 flex-col gap-1 overflow-hidden leading-normal">
        <BookingName item={booking} />
        <TagList items={booking.tags} />
      </div>
      <div className="flex flex-row items-center justify-center gap-2 lg:gap-4">
        <div className="hidden h-full flex-row items-center justify-start gap-2 md:flex lg:gap-4">
          <BookingFrom startDate={booking.start?.dateTime} />
          <BookingDurationCounter
            startDate={booking.start?.dateTime || formatISOLocale(new Date())}
          />
        </div>
        <div className="flex h-full flex-col items-end justify-center gap-1 md:hidden">
          <BookingFrom startDate={booking.start?.dateTime} />
          <BookingDurationCounter
            startDate={booking.start?.dateTime || formatISOLocale(new Date())}
          />
        </div>
        <BookingCurrentEntryContext item={booking} />
      </div>
    </div>
  )
}
