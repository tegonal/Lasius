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

import { createContext, useContext } from 'react'

import { useStopBooking } from '~/features/bookings/hooks/use-stop-booking'

type StopBookingContextValue = ReturnType<typeof useStopBooking>

const StopBookingContext = createContext<StopBookingContextValue | undefined>(undefined)

/**
 * Hosts the stop of the current booking in the app layout.
 * The booking component unmounts when the stop revalidates the loaders. A midnight split sends its
 * second request after that, so the hooks must live in a component that stays mounted.
 */
export const StopBookingProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useStopBooking()
  return <StopBookingContext.Provider value={value}>{children}</StopBookingContext.Provider>
}

export const useStopBookingContext = (): StopBookingContextValue => {
  const context = useContext(StopBookingContext)

  if (context === undefined) {
    throw new Error('useStopBookingContext must be used within a StopBookingProvider')
  }

  return context
}
