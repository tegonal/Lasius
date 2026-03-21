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

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { formatISOLocale } from '~/lib/utils/dates'

interface CalendarStore {
	goToNextDay: () => void
	goToNextMonth: () => void

	goToNextWeek: () => void

	goToPreviousDay: () => void
	goToPreviousMonth: () => void

	goToPreviousWeek: () => void
	// Navigation helpers
	goToToday: () => void
	// Previous date for tracking changes
	previousDate: string
	// Reset calendar state
	resetCalendar: () => void
	// Selected date in ISO format
	selectedDate: string
	setSelectedDate: (date: string) => void
	setViewMode: (mode: 'day' | 'month' | 'week') => void

	// Calendar view mode
	viewMode: 'day' | 'month' | 'week'
}

export const useCalendarStore = create<CalendarStore>()(
	devtools(
		persist(
			subscribeWithSelector(
				immer((set, get) => ({
					goToNextDay: () => {
						const current = new Date(get().selectedDate)
						current.setDate(current.getDate() + 1)
						const next = formatISOLocale(current)
						set((state) => {
							state.previousDate = state.selectedDate
							state.selectedDate = next
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
					goToNextWeek: () => {
						const current = new Date(get().selectedDate)
						current.setDate(current.getDate() + 7)
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

					goToPreviousMonth: () => {
						const current = new Date(get().selectedDate)
						current.setMonth(current.getMonth() - 1)
						const prev = formatISOLocale(current)
						set((state) => {
							state.previousDate = state.selectedDate
							state.selectedDate = prev
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

					goToToday: () => {
						const today = formatISOLocale(new Date())
						set((state) => {
							state.previousDate = state.selectedDate
							state.selectedDate = today
						})
					},

					previousDate: formatISOLocale(new Date()),

					resetCalendar: () =>
						set((state) => {
							const today = formatISOLocale(new Date())
							state.selectedDate = today
							state.previousDate = today
							state.viewMode = 'week'
						}),

					// Selected date - default to today
					selectedDate: formatISOLocale(new Date()),

					setSelectedDate: (date) =>
						set((state) => {
							state.previousDate = state.selectedDate
							state.selectedDate = date
						}),

					setViewMode: (mode) =>
						set((state) => {
							state.viewMode = mode
						}),

					viewMode: 'week' as const,
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
export const useSelectedDate = () =>
	useCalendarStore((state) => state.selectedDate)
export const usePreviousDate = () =>
	useCalendarStore((state) => state.previousDate)
export const useCalendarViewMode = () =>
	useCalendarStore((state) => state.viewMode)

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
		goToNextDay,
		goToNextMonth,
		goToNextWeek,
		goToPreviousDay,
		goToPreviousMonth,
		goToPreviousWeek,
		goToToday,
		resetCalendar,
		setSelectedDate,
		setViewMode,
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
