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
import { createStore, StoreApi, useStore } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import { formatDateString, formatTimeString, parseDateTimeStrings } from '../shared/dateTimeHelpers'

export type DateTimeValue = {
  date: Date | null
  dateString: string
  timeString: string
  isValid: boolean
  isPartial: boolean
}

type DatePickerState = {
  value: DateTimeValue
  initialValue: DateTimeValue
  setValue: (value: Partial<DateTimeValue>) => void
  setDateFromString: (dateString: string) => void
  setTimeFromString: (timeString: string) => void
  setFromISOString: (isoString: string | null) => void
  setInitialValue: (isoString: string | null) => void
  getISOString: () => string | null
  reset: () => void
  resetToInitial: () => void
}

const initialValue: DateTimeValue = {
  date: null,
  dateString: '',
  timeString: '',
  isValid: true,
  isPartial: false,
}

export const createDatePickerStore = () =>
  createStore<DatePickerState>()(
    subscribeWithSelector((set, get) => ({
      value: initialValue,
      initialValue: initialValue,

      setValue: (partial) =>
        set((state) => ({
          value: { ...state.value, ...partial },
        })),

      setDateFromString: (dateString) => {
        const { timeString } = get().value
        const parsed = parseDateTimeStrings(dateString, timeString)
        // If valid and complete, format the date string; otherwise keep the input as-is
        const formattedDateString =
          parsed.isValid && !parsed.isPartial && parsed.date
            ? formatDateString(parsed.date)
            : dateString
        set({
          value: {
            date: parsed.isValid && !parsed.isPartial ? parsed.date : get().value.date,
            isValid: parsed.isValid,
            isPartial: parsed.isPartial,
            dateString: formattedDateString,
            timeString,
          },
        })
      },

      setTimeFromString: (timeString) => {
        const { dateString } = get().value
        const parsed = parseDateTimeStrings(dateString, timeString)
        // If valid and complete, format the time string; otherwise keep the input as-is
        const formattedTimeString =
          parsed.isValid && !parsed.isPartial && parsed.date
            ? formatTimeString(parsed.date)
            : timeString
        set({
          value: {
            date: parsed.isValid && !parsed.isPartial ? parsed.date : get().value.date,
            isValid: parsed.isValid,
            isPartial: parsed.isPartial,
            dateString,
            timeString: formattedTimeString,
          },
        })
      },

      setFromISOString: (isoString) => {
        if (!isoString) {
          set({ value: initialValue })
          return
        }

        try {
          const date = new Date(isoString)
          if (isNaN(date.getTime())) {
            set({ value: { ...initialValue, isValid: false, isPartial: false } })
            return
          }

          const dateString = formatDateString(date)
          const timeString = formatTimeString(date)

          set({
            value: {
              date,
              dateString,
              timeString,
              isValid: true,
              isPartial: false,
            },
          })
        } catch {
          set({ value: { ...initialValue, isValid: false, isPartial: false } })
        }
      },

      getISOString: () => {
        const { date, isValid, isPartial } = get().value
        if (!date || !isValid || isPartial) return null
        return date.toISOString()
      },

      setInitialValue: (isoString) => {
        if (!isoString) {
          set({ initialValue: initialValue })
          return
        }

        try {
          const date = new Date(isoString)
          if (isNaN(date.getTime())) {
            set({ initialValue: initialValue })
            return
          }

          const dateString = formatDateString(date)
          const timeString = formatTimeString(date)

          set({
            initialValue: {
              date,
              dateString,
              timeString,
              isValid: true,
              isPartial: false,
            },
          })
        } catch {
          set({ initialValue: initialValue })
        }
      },

      reset: () => set({ value: initialValue }),

      resetToInitial: () => {
        const { initialValue } = get()
        set({ value: initialValue })
      },
    })),
  )

// Context for providing store instance
export const DatePickerStoreContext = createContext<StoreApi<DatePickerState> | null>(null)

// Hook to use the store from context
export const useDatePickerStore = () => {
  const store = useContext(DatePickerStoreContext)
  if (!store) throw new Error('Missing DatePickerStoreContext.Provider')
  return useStore(store)
}
