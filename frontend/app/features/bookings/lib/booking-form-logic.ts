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

import { addHours, getHours, getMinutes, isSameDay, setHours, setMinutes } from 'date-fns'

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking, type ModelsTag } from '~/services/api/lasius'

export type BookingFormMode = 'add' | 'addBetween' | 'update'

export type BookingFormValues = { end: string; projectId: string; start: string; tags: string }

const EMPTY_VALUES: BookingFormValues = { end: '', projectId: '', start: '', tags: '' }

export const isWithinSameMinute = (time1: string, time2: string): boolean => {
  if (!time1 || !time2) return false
  return Math.abs(new Date(time1).getTime() - new Date(time2).getTime()) < 60_000
}

const addValues = (
  dateForForm: Date,
  now: Date,
  itemReference: ModelsBooking | undefined,
): BookingFormValues => {
  if (itemReference) {
    const reference = new Date(itemReference.end?.dateTime ?? '')
    return {
      ...EMPTY_VALUES,
      end: formatISOLocale(addHours(reference, 1)),
      start: formatISOLocale(reference),
    }
  }
  if (!isSameDay(dateForForm, now)) {
    return {
      ...EMPTY_VALUES,
      end: formatISOLocale(setHours(new Date(dateForForm), 12)),
      start: formatISOLocale(setHours(new Date(dateForForm), 8)),
    }
  }
  return { ...EMPTY_VALUES, end: formatISOLocale(now), start: formatISOLocale(addHours(now, -1)) }
}

/** The form values for a new, inserted or edited booking. `now` decides what "today" is. */
export const computeInitialValues = (
  mode: BookingFormMode,
  dateForForm: Date,
  now: Date,
  itemUpdate?: ModelsBooking,
  itemReference?: ModelsBooking,
  bookingBefore?: ModelsBooking,
): BookingFormValues => {
  if (itemUpdate) {
    return {
      end: formatISOLocale(new Date(itemUpdate.end?.dateTime ?? '')),
      projectId: itemUpdate.projectReference.id,
      start: formatISOLocale(new Date(itemUpdate.start.dateTime)),
      tags: JSON.stringify(itemUpdate.tags),
    }
  }
  if (mode === 'add') return addValues(dateForForm, now, itemReference)
  if (mode === 'addBetween' && itemReference) {
    return {
      ...EMPTY_VALUES,
      end: formatISOLocale(new Date(itemReference.start?.dateTime ?? '')),
      start: formatISOLocale(new Date(bookingBefore?.end?.dateTime ?? '')),
    }
  }
  return EMPTY_VALUES
}

export const computeDurationHours = (start: string, end: string): number => {
  if (!start || !end) return 0
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60)
}

/**
 * Moves the end to the day of a changed start and keeps its time of day. Returns null when the
 * start did not change, or when the user already changed the end by hand.
 */
export const computeAutoAdjustedEnd = (input: {
  end: string
  previousStart: string | undefined
  start: string
  trackedEnd: string
}): null | string => {
  const { end, previousStart, start, trackedEnd } = input
  if (!start || start === previousStart || trackedEnd !== end) return null
  const endDate = new Date(end)
  const startWithEndHour = setHours(new Date(start), getHours(endDate))
  return formatISOLocale(setMinutes(startWithEndHour, getMinutes(endDate)))
}

export type PresetReference = { date: string; kind: 'latest' | 'next' | 'previous' }

/** The end of the latest or previous booking as a start preset, or null when none applies. */
export const getPresetStartReference = (input: {
  bookingBefore?: ModelsBooking
  latestBooking?: ModelsBooking
  mode: BookingFormMode
  start: string
}): null | PresetReference => {
  if (input.mode === 'addBetween') return null
  const isAdd = input.mode === 'add'
  const referenceTime = isAdd
    ? input.latestBooking?.end?.dateTime
    : input.bookingBefore?.end?.dateTime
  if (!referenceTime || isWithinSameMinute(input.start, referenceTime)) return null
  return { date: formatISOLocale(new Date(referenceTime)), kind: isAdd ? 'latest' : 'previous' }
}

/** The start of the next booking as an end preset in update mode, or null when none applies. */
export const getPresetEndReference = (input: {
  bookingAfter?: ModelsBooking
  end: string
  mode: BookingFormMode
}): null | PresetReference => {
  if (input.mode !== 'update') return null
  const referenceTime = input.bookingAfter?.start?.dateTime
  if (!referenceTime || isWithinSameMinute(input.end, referenceTime)) return null
  return { date: formatISOLocale(new Date(referenceTime)), kind: 'next' }
}

export type BookingSubmit =
  | { body: { end: string; projectId: string; start: string; tags: ModelsTag[] }; kind: 'add' }
  | {
      body: { end?: string; projectId: string; start?: string; tags: ModelsTag[] }
      bookingId: string
      kind: 'update'
    }

/** The API call for a valid submission, or null when the form has no project or no target. */
export const buildBookingSubmit = (
  mode: BookingFormMode,
  value: { end: string; projectId: string; start: string; tags: ModelsTag[] },
  itemUpdate?: ModelsBooking,
): BookingSubmit | null => {
  const { end, projectId, start, tags } = value
  if (!projectId) return null
  if (mode === 'add' || mode === 'addBetween') {
    return { body: { end, projectId, start, tags }, kind: 'add' }
  }
  if (!itemUpdate) return null
  return {
    body: { end: end || undefined, projectId, start: start || undefined, tags },
    bookingId: itemUpdate.id,
    kind: 'update',
  }
}
