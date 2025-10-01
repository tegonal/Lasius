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

import { BookingDurationCounter } from 'components/features/user/index/bookingDurationCounter'
import { BookingFrom } from 'components/features/user/index/bookingFrom'
import { BookingName } from 'components/features/user/index/bookingName'
import { BookingCurrentNoBooking } from 'components/features/user/index/current/bookingCurrentNoBooking'
import { Button } from 'components/primitives/buttons/Button'
import { AnimateChange } from 'components/ui/animations/motion/animateChange'
import { TagList } from 'components/ui/data-display/TagList'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { roundToNearestMinutes } from 'date-fns'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import {
  getGetUserBookingCurrentKey,
  stopUserBookingCurrent,
  useGetUserBookingCurrent,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { cn } from 'lib/utils/cn'
import { formatISOLocale } from 'lib/utils/date/dates'
import { Square } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { ROUTES } from 'projectConfig/routes'
import React from 'react'
import { useCalendarActions } from 'stores/calendarStore'
import { useSWRConfig } from 'swr'
import { useIsClient } from 'usehooks-ts'

import { BookingCurrentEntryContext } from './bookingCurrentEntryContext'

type Props = {
  inContainer?: boolean
}
export const BookingCurrentEntry: React.FC<Props> = ({ inContainer = false }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { selectedOrganisationId } = useOrganisation()
  const isClient = useIsClient()
  const { setSelectedDate } = useCalendarActions()

  const { data } = useGetUserBookingCurrent({ swr: { enabled: isClient } })

  const stop = async () => {
    if (data?.booking?.id) {
      await stopUserBookingCurrent(selectedOrganisationId, data.booking.id, {
        end: formatISOLocale(roundToNearestMinutes(new Date(), { roundingMethod: 'floor' })),
      })
      await mutate(getGetUserBookingCurrentKey())
      setSelectedDate(formatISOLocale(new Date()))
    }
  }

  const handleClick = async () => {
    if (!inContainer) await router.push(ROUTES.USER.INDEX)
  }

  return (
    <AnimateChange hash={`${!data?.booking}`} useAvailableSpace>
      {!data?.booking ? (
        <BookingCurrentNoBooking />
      ) : (
        <div className="flex h-full w-full flex-row items-center justify-between gap-2 lg:gap-4">
          <div className="flex flex-row items-center justify-start gap-2 lg:gap-3">
            <Button
              onClick={stop}
              variant="stopRecording"
              title={t('bookings.actions.stopRecording', {
                defaultValue: 'Stop recording current time booking',
              })}
              fullWidth={false}>
              <LucideIcon icon={Square} size={24} />
            </Button>
            <div
              className={cn(
                'flex flex-col gap-1 leading-normal',
                !inContainer && 'cursor-pointer hover:opacity-80',
              )}
              onClick={handleClick}>
              <BookingName item={data.booking} />
              <TagList items={data.booking.tags} />
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-row items-center justify-center gap-2 lg:gap-4">
            <div className="hidden h-full flex-row items-center justify-start gap-2 md:flex lg:gap-4">
              <BookingFrom startDate={data.booking.start?.dateTime} />
              <BookingDurationCounter
                startDate={data.booking.start?.dateTime || formatISOLocale(new Date())}
              />
            </div>
            <div className="flex h-full flex-col items-end justify-center gap-1 md:hidden">
              <BookingFrom startDate={data.booking.start?.dateTime} />
              <BookingDurationCounter
                startDate={data.booking.start?.dateTime || formatISOLocale(new Date())}
              />
            </div>
            <BookingCurrentEntryContext item={data.booking} />
          </div>
        </div>
      )}
    </AnimateChange>
  )
}
