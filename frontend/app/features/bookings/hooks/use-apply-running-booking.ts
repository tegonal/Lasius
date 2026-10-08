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

import { useEffect, useRef } from 'react'

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsCurrentUserTimeBooking } from '~/services/api/lasius'

type Control = { change: (value: string) => void }
type FormUpdater = { update: (options: { name: string; value: string }) => void }

/** Writes the project, the tags and the start of a changed running booking into the edit form. */
export const useApplyRunningBooking = (
  booking: ModelsCurrentUserTimeBooking['booking'],
  form: FormUpdater,
  tagsFieldName: string,
  projectIdControl: Control,
  startControl: Control,
) => {
  // Conform returns a new form proxy and new controls on each render, and form.update re-renders.
  // The ref limits the re-initialization to a changed booking, so the effect cannot loop.
  const appliedBookingKey = useRef('')

  useEffect(() => {
    if (!booking) {
      return
    }

    const bookingKey = JSON.stringify([
      booking.id,
      booking.projectReference.id,
      booking.tags,
      booking.start.dateTime,
    ])
    if (appliedBookingKey.current === bookingKey) {
      return
    }
    appliedBookingKey.current = bookingKey

    projectIdControl.change(booking.projectReference.id)
    form.update({
      name: tagsFieldName,
      value: booking.tags.length > 0 ? JSON.stringify(booking.tags) : '',
    })
    startControl.change(formatISOLocale(new Date(booking.start.dateTime)))
  }, [
    booking,
    booking?.projectReference.id,
    booking?.tags,
    booking?.start.dateTime,
    projectIdControl,
    startControl,
    form,
    tagsFieldName,
  ])
}
