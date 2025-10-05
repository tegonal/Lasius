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

import { addHours, addMinutes } from 'date-fns'
import { createContext, useContext } from 'react'
import { createStore, StoreApi, useStore } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import { formatDateString, formatTimeString, parseDateTimeStrings } from '../shared/dateTimeHelpers'

export type DateTimeValue = {
  date: Date | null
  // Internal storage for partial/invalid input during editing
  _inputDateString: string
  _inputTimeString: string
  isValid: boolean
  isPartial: boolean
  // Derived getters for complete values
  get dateString(): string
  get timeString(): string
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
  // Date-fns powered increment functions
  incrementHours: (amount: number) => void
  incrementMinutes: (amount: number) => void
  incrementDays: (amount: number) => void
  incrementMonths: (amount: number) => void
  incrementYears: (amount: number) => void
}

// Helper to create DateTimeValue with getters
const createDateTimeValue = (
  date: Date | null,
  _inputDateString: string,
  _inputTimeString: string,
  isValid: boolean,
  isPartial: boolean,
): DateTimeValue => ({
  date,
  _inputDateString,
  _inputTimeString,
  isValid,
  isPartial,
  get dateString() {
    // If partial or invalid, return the raw input
    if (this.isPartial || !this.isValid) return this._inputDateString
    // If valid and complete, return formatted date
    return this.date ? formatDateString(this.date) : ''
  },
  get timeString() {
    // If partial or invalid, return the raw input
    if (this.isPartial || !this.isValid) return this._inputTimeString
    // If valid and complete, return formatted time
    return this.date ? formatTimeString(this.date) : ''
  },
})

const initialValue: DateTimeValue = createDateTimeValue(null, '', '', true, false)

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
        const currentDate = get().value.date
        const timeString = currentDate
          ? formatTimeString(currentDate)
          : get().value._inputTimeString

        const parsed = parseDateTimeStrings(dateString, timeString)

        set({
          value: createDateTimeValue(
            parsed.isValid && !parsed.isPartial ? parsed.date : get().value.date,
            dateString,
            timeString,
            parsed.isValid,
            parsed.isPartial,
          ),
        })
      },

      setTimeFromString: (timeString) => {
        const currentDate = get().value.date
        const dateString = currentDate
          ? formatDateString(currentDate)
          : get().value._inputDateString

        const parsed = parseDateTimeStrings(dateString, timeString)

        set({
          value: createDateTimeValue(
            parsed.isValid && !parsed.isPartial ? parsed.date : get().value.date,
            dateString,
            timeString,
            parsed.isValid,
            parsed.isPartial,
          ),
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
            set({ value: createDateTimeValue(null, '', '', false, false) })
            return
          }

          const dateString = formatDateString(date)
          const timeString = formatTimeString(date)

          set({
            value: createDateTimeValue(date, dateString, timeString, true, false),
          })
        } catch {
          set({ value: createDateTimeValue(null, '', '', false, false) })
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
            initialValue: createDateTimeValue(date, dateString, timeString, true, false),
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

      // Date-fns powered increment functions - these handle midnight crossing automatically!
      incrementHours: (amount) => {
        const { date } = get().value
        if (!date) return

        const newDate = addHours(date, amount)
        const dateString = formatDateString(newDate)
        const timeString = formatTimeString(newDate)

        set({
          value: createDateTimeValue(newDate, dateString, timeString, true, false),
        })
      },

      incrementMinutes: (amount) => {
        const { date } = get().value
        if (!date) return

        const newDate = addMinutes(date, amount)
        const dateString = formatDateString(newDate)
        const timeString = formatTimeString(newDate)

        set({
          value: createDateTimeValue(newDate, dateString, timeString, true, false),
        })
      },

      incrementDays: (amount) => {
        const { date } = get().value
        if (!date) return

        const newDate = new Date(date)
        newDate.setDate(newDate.getDate() + amount)
        const dateString = formatDateString(newDate)
        const timeString = formatTimeString(newDate)

        set({
          value: createDateTimeValue(newDate, dateString, timeString, true, false),
        })
      },

      incrementMonths: (amount) => {
        const { date } = get().value
        if (!date) return

        const newDate = new Date(date)
        newDate.setMonth(newDate.getMonth() + amount)
        const dateString = formatDateString(newDate)
        const timeString = formatTimeString(newDate)

        set({
          value: createDateTimeValue(newDate, dateString, timeString, true, false),
        })
      },

      incrementYears: (amount) => {
        const { date } = get().value
        if (!date) return

        const newDate = new Date(date)
        newDate.setFullYear(newDate.getFullYear() + amount)
        const dateString = formatDateString(newDate)
        const timeString = formatTimeString(newDate)

        set({
          value: createDateTimeValue(newDate, dateString, timeString, true, false),
        })
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
