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

import { type BookingSubmit } from '~/features/bookings/lib/booking-form-logic'
import {
  useAddUserBookingByOrganisation,
  useUpdateUserBooking,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'

/** Sends an add or an update request for the booking form and closes the form on success. */
export const useBookingFormSubmit = (selectedOrgId: string, onClose: () => void) => {
  const { isLoading: isAdding, submit: submitAdd } = useAddUserBookingByOrganisation({
    onSuccess: () => onClose(),
  })
  const { isLoading: isUpdating, submit: submitUpdate } = useUpdateUserBooking({
    onSuccess: () => onClose(),
  })

  const send = (request: BookingSubmit | null) => {
    if (!request) return
    if (request.kind === 'add') {
      submitAdd({ body: request.body, orgId: selectedOrgId })
    } else {
      submitUpdate({ body: request.body, bookingId: request.bookingId, orgId: selectedOrgId })
    }
  }

  return { isSubmitting: isAdding || isUpdating, send }
}
