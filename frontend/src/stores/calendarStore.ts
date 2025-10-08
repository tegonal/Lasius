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

import { formatISOLocale } from 'lib/utils/date/dates'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface CalendarStore {
  // Selected date in ISO format
  selectedDate: string
  setSelectedDate: (date: string) => void

  // Previous date for tracking changes
  previousDate: string

  // Calendar view mode
  viewMode: 'day' | 'week' | 'month'
  setViewMode: (mode: 'day' | 'week' | 'month') => void

  // Navigation helpers
  goToToday: () => void
  goToNextDay: () => void
  goToPreviousDay: () => void
  goToNextWeek: () => void
  goToPreviousWeek: () => void
  goToNextMonth: () => void
  goToPreviousMonth: () => void

  // Reset calendar state
  resetCalendar: () => void
}

export const useCalendarStore = create<CalendarStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Selected date - default to today
          selectedDate: formatISOLocale(new Date()),
          previousDate: formatISOLocale(new Date()),
          viewMode: 'week' as const,

          setSelectedDate: (date) =>
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = date
            }),

          setViewMode: (mode) =>
            set((state) => {
              state.viewMode = mode
            }),

          goToToday: () => {
            const today = formatISOLocale(new Date())
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = today
            })
          },

          goToNextDay: () => {
            const current = new Date(get().selectedDate)
            current.setDate(current.getDate() + 1)
            const next = formatISOLocale(current)
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = next
            })
          },

          goToPreviousDay: () => {
            const current = new Date(get().selectedDate)
            current.setDate(current.getDate() - 1)
            const prev = formatISOLocale(current)
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = prev
            })
          },

          goToNextWeek: () => {
            const current = new Date(get().selectedDate)
            current.setDate(current.getDate() + 7)
            const next = formatISOLocale(current)
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = next
            })
          },

          goToPreviousWeek: () => {
            const current = new Date(get().selectedDate)
            current.setDate(current.getDate() - 7)
            const prev = formatISOLocale(current)
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = prev
            })
          },

          goToNextMonth: () => {
            const current = new Date(get().selectedDate)
            current.setMonth(current.getMonth() + 1)
            const next = formatISOLocale(current)
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = next
            })
          },

          goToPreviousMonth: () => {
            const current = new Date(get().selectedDate)
            current.setMonth(current.getMonth() - 1)
            const prev = formatISOLocale(current)
            set((state) => {
              state.previousDate = state.selectedDate
              state.selectedDate = prev
            })
          },

          resetCalendar: () =>
            set((state) => {
              const today = formatISOLocale(new Date())
              state.selectedDate = today
              state.previousDate = today
              state.viewMode = 'week'
            }),
        })),
      ),
      {
        name: 'lasius-calendar-store',
        // Only persist selectedDate and viewMode
        partialize: (state) => ({
          selectedDate: state.selectedDate,
          viewMode: state.viewMode,
        }),
      },
    ),
    {
      name: 'lasius-calendar-store',
    },
  ),
)

// Selector hooks for performance optimization
export const useSelectedDate = () => useCalendarStore((state) => state.selectedDate)
export const usePreviousDate = () => useCalendarStore((state) => state.previousDate)
export const useCalendarViewMode = () => useCalendarStore((state) => state.viewMode)

// Action hooks
export const useCalendarActions = () => {
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate)
  const setViewMode = useCalendarStore((state) => state.setViewMode)
  const goToToday = useCalendarStore((state) => state.goToToday)
  const goToNextDay = useCalendarStore((state) => state.goToNextDay)
  const goToPreviousDay = useCalendarStore((state) => state.goToPreviousDay)
  const goToNextWeek = useCalendarStore((state) => state.goToNextWeek)
  const goToPreviousWeek = useCalendarStore((state) => state.goToPreviousWeek)
  const goToNextMonth = useCalendarStore((state) => state.goToNextMonth)
  const goToPreviousMonth = useCalendarStore((state) => state.goToPreviousMonth)
  const resetCalendar = useCalendarStore((state) => state.resetCalendar)

  return {
    setSelectedDate,
    setViewMode,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    goToNextWeek,
    goToPreviousWeek,
    goToNextMonth,
    goToPreviousMonth,
    resetCalendar,
  }
}

// Subscribe to date changes (useful for side effects)
export const subscribeToDateChanges = (
  listener: (newDate: string, previousDate: string) => void,
) => {
  return useCalendarStore.subscribe(
    (state) => state.selectedDate,
    (newDate) => {
      const previousDate = useCalendarStore.getState().previousDate
      listener(newDate, previousDate)
    },
  )
}
