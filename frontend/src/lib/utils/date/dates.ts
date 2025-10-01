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

import {
  differenceInMilliseconds,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  intervalToDuration,
  isValid,
  roundToNearestMinutes,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { isString, padStart, round } from 'es-toolkit/compat'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { dateFormat } from 'lib/utils/date/dateFormat'
import { ModelsWorkingHoursWeekdays } from 'types/common'

/**
 * Short date format string for displaying dates (e.g., "1.5.2024").
 */
export const DATE_FORMAT_SHORT = 'd.M.y'

/**
 * Formats a Date object to ISO 8601 string with timezone offset.
 * Temporary fix until date-fns includes milliseconds in ISO format.
 *
 * @param d - The Date object to format
 * @returns ISO 8601 formatted string with timezone (e.g., "2024-01-15T10:30:00.000+02:00")
 *
 * @example
 * formatISOLocale(new Date('2024-01-15T10:30:00')) // "2024-01-15T10:30:00.000+02:00"
 */
export const formatISOLocale = (d: Date) => {
  // copied from date-fns
  const addLeadingZeros = (number: number, targetLength: number) => {
    const sign = number < 0 ? '-' : ''
    let output = Math.abs(number).toString()
    while (output.length < targetLength) {
      output = `0${output}`
    }
    return sign + output
  }

  // our backend needs the Timezone as: signHH:MM, e.g. `+02:00`
  // copied from date-fns
  const formatTimezoneShort = (offset: number, delimiter = ':') => {
    const sign = offset > 0 ? '-' : '+'
    const absOffset = Math.abs(offset)
    const hours = Math.floor(absOffset / 60)
    const minutes = Math.round(absOffset % 60)
    return sign + addLeadingZeros(hours, 2) + delimiter + addLeadingZeros(minutes, 2)
  }

  if (isValid(d)) {
    return format(d, "yyyy-MM-dd'T'HH':'mm':'ss'.'SSS") + formatTimezoneShort(d.getTimezoneOffset())
  }
  return ''
}

/**
 * Get an array of IsoDateStrings that represent the days of the week that date is in
 * @param date
 */
export const getWeekOfDate = (date: IsoDateString | Date): IsoDateString[] => {
  const localDate = isString(date) ? new Date(date) : date
  return eachDayOfInterval({
    start: startOfWeek(localDate, { weekStartsOn: 1 }),
    end: endOfWeek(localDate, { weekStartsOn: 1 }),
  }).map((date) => formatISOLocale(date))
}

/**
 * Get an array of IsoDateStrings that represent the days of the month that date is in
 * @param date
 */
export const getMonthOfDate = (date: IsoDateString | Date): IsoDateString[] => {
  const localDate = isString(date) ? new Date(date) : date
  return eachDayOfInterval({
    start: startOfMonth(localDate),
    end: endOfMonth(localDate),
  }).map((date) => formatISOLocale(date))
}

/**
 * Calculates the duration between two dates in hours as a decimal number.
 *
 * @param start - ISO date string for the start time
 * @param end - ISO date string for the end time
 * @returns Duration in hours, rounded to 3 decimal places
 *
 * @example
 * durationInHoursAsNumber('2024-01-15T10:00:00Z', '2024-01-15T13:30:00Z') // 3.5
 */
export const durationInHoursAsNumber = (start: IsoDateString, end: IsoDateString) => {
  const durationMillis = differenceInMilliseconds(new Date(end), new Date(start))
  return round(durationMillis / 1000 / 60 / 60, 3)
}

/**
 * Calculates the duration between two dates in seconds.
 *
 * @param start - ISO date string for the start time
 * @param end - ISO date string for the end time
 * @returns Duration in seconds, rounded to 3 decimal places
 */
export const durationInSeconds = (start: IsoDateString, end: IsoDateString) => {
  const durationMillis = differenceInMilliseconds(new Date(end), new Date(start))
  return round(durationMillis / 1000, 3)
}

/**
 * Pads a time segment number with a leading zero if needed.
 *
 * @param n - The number to pad
 * @returns Zero-padded string (e.g., 5 → "05")
 */
const padTimeSegment = (n: number) => padStart(n.toString(), 2, '0')

/**
 * Converts a duration between two dates to a formatted string (HH:mm).
 * Includes days converted to hours for durations longer than 24 hours.
 *
 * @param start - ISO date string for the start time
 * @param end - ISO date string for the end time
 * @returns Duration formatted as "HH:mm"
 *
 * @example
 * durationAsString('2024-01-15T10:00:00Z', '2024-01-15T13:30:00Z') // "03:30"
 */
export const durationAsString = (start: IsoDateString, end: IsoDateString) => {
  const {
    days = 0,
    hours = 0,
    minutes = 0,
  } = intervalToDuration({
    start: new Date(start),
    end: new Date(end),
  })
  return `${padTimeSegment(days * 24 + hours)}:${padTimeSegment(minutes)}`
}

/**
 * Converts seconds to hours, with optional rounding precision
 * @param secs
 * @param precision
 */
export const secondsToHours = (secs: number, precision?: number) =>
  round(secs / 60 / 60, precision || 2)

/**
 * Converts hours to seconds
 * @param hours
 */
export const hoursToSeconds = (hours: number) => hours * 60 * 60

/**
 * Converts milliseconds to hours, with optional rounding precision
 * @param millis
 * @param precision
 */
export const millisToHours = (millis: number, precision?: number) =>
  round(millis / 1000 / 60 / 60, precision || 2)

/**
 * Converts a decimal representation of hours into a IsoDateString with the time part representing the decimal hours. Since this is a date object, it will only work for values up to 24 hours
 * @param decimalHours
 */
export const decimalHoursToDate = (decimalHours: number) => {
  const date = new Date(0, 0, 0, 0, 0)
  date.setMinutes(decimalHours * 60)
  return formatISOLocale(roundToNearestMinutes(date, { nearestTo: 5 }))
}

/**
 * Converts a decimal representation of minutes to a zero-padded string representing time as HH:mm.
 *
 * @param mins - Total minutes as a decimal number
 * @returns Formatted time string as "HH:mm"
 */
const decimalMinutesToTimeString = (mins: number) =>
  `${padTimeSegment(Math.floor(mins / 60))}:${padTimeSegment(mins % 60)}`

/**
 * Converts a decimal representation of minutes to an object of hours and minutes as integers.
 *
 * @param mins - Total minutes as a decimal number
 * @returns Object with separate hours and minutes properties
 */
const decimalMinutesToDurationObject = (mins: number) => ({
  hours: Math.floor(mins / 60),
  minutes: mins % 60,
})

/**
 * Converts a decimal representation of hours into a string like HH:mm and rounds to the nearest 5 minutes
 * @param decimalHours
 */
export const decimalHoursToDurationStringRounded = (decimalHours: number) => {
  const start = new Date(0, 0, 0, 0, 0)
  const end = roundToNearestMinutes(new Date(0, 0, 0, 0, 0).setMinutes(decimalHours * 60), {
    nearestTo: 5,
  })
  return decimalMinutesToTimeString(differenceInMinutes(end, start))
}

/**
 * Converts a decimal representation of hours into a string like HH:mm
 * @param decimalHours
 */
export const decimalHoursToDurationString = (decimalHours: number) => {
  const start = new Date(0, 0, 0, 0, 0)
  const end = new Date(0, 0, 0, 0, 0).setMinutes(decimalHours * 60)
  return decimalMinutesToTimeString(differenceInMinutes(end, start))
}

/**
 * Converts a decimal representation of hours into an object containing hours and minutes
 * @param decimalHours
 */
export const decimalHoursToObject = (decimalHours: number) => {
  const start = new Date(0, 0, 0, 0, 0)
  const end = new Date(0, 0, 0, 0, 0).setMinutes(decimalHours * 60)
  return decimalMinutesToDurationObject(differenceInMinutes(end, start))
}

/**
 * Converts the time part of an IsoDateString to a decimal representation of hours. Can round to 5 minute increments.
 * @param time
 * @param roundedTo5
 */
export const isoDateStringToDecimalHours = (time: IsoDateString, roundedTo5 = false) => {
  const date = new Date(time)
  const minutes = roundedTo5
    ? getMinutes(roundToNearestMinutes(date, { nearestTo: 5 }))
    : getMinutes(date)
  const hours = getHours(date)
  return hours + minutes / 60
}

/**
 * Returns weekday name based on provided IsoDateString
 * @param date
 */
export const getWorkingHoursWeekdayString = (date: IsoDateString): ModelsWorkingHoursWeekdays =>
  dateFormat(date, 'iiii', 'en').toLowerCase() as ModelsWorkingHoursWeekdays
