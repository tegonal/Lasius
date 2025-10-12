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

import { apiTimespanMonth, apiTimespanWeek, IsoDateString } from 'lib/api/apiDateHandling'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius/modelsBooking'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import React, { createContext, useContext, useMemo } from 'react'

type CalendarPeriod = 'week' | 'month'

type CalendarDataContextValue = {
  bookings: ModelsBooking[] | undefined
  isLoading: boolean
  error: any
}

const CalendarDataContext = createContext<CalendarDataContextValue | undefined>(undefined)

type CalendarDataProviderProps = {
  children: React.ReactNode
  date: IsoDateString
  period: CalendarPeriod
}

/**
 * CalendarDataProvider - Fetches booking data for an entire calendar period (week/month)
 * instead of making individual API calls per day.
 *
 * This provider:
 * - Makes a single API call for the entire period (week or month)
 * - Caches the data using SWR
 * - Provides the data to all calendar day components via context
 *
 * Performance: Reduces 7-31 API calls down to 1 per calendar period
 */
export const CalendarDataProvider: React.FC<CalendarDataProviderProps> = ({
  children,
  date,
  period,
}) => {
  const { selectedOrganisationId } = useOrganisation()

  // Get the timespan for the entire period (week or month)
  const timespan = useMemo(() => {
    return period === 'week' ? apiTimespanWeek(date) : apiTimespanMonth(date)
  }, [date, period])

  // Single API call for the entire period
  const { data: bookings, error } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    timespan,
    {
      swr: {
        enabled: !!selectedOrganisationId && !!date,
        // Use reasonable deduplication for calendar data
        dedupingInterval: 30000, // 30 seconds
        revalidateOnFocus: false,
      },
    },
  )

  const value = useMemo(
    () => ({
      bookings,
      isLoading: bookings === undefined,
      error,
    }),
    [bookings, error],
  )

  return <CalendarDataContext.Provider value={value}>{children}</CalendarDataContext.Provider>
}

/**
 * useCalendarData - Hook to access calendar booking data from context
 *
 * Must be used within a CalendarDataProvider
 */
export const useCalendarData = (): CalendarDataContextValue => {
  const context = useContext(CalendarDataContext)

  if (context === undefined) {
    throw new Error('useCalendarData must be used within a CalendarDataProvider')
  }

  return context
}
