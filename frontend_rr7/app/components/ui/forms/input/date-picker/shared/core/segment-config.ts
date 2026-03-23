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

export type DateSegment = 'day' | 'month' | 'year'

/**
 * Configuration for a segmented input field
 */
export type SegmentConfig<T extends string> = {
  /** Regex pattern for allowed characters in input */
  allowedCharsPattern: RegExp
  /** Delimiter between segments (e.g., '.' for dates, ':' for times) */
  delimiter: string
  /** Full placeholder string (e.g., '__.__.____') */
  placeholder: string
  /** Maximum allowed first digit for each segment (for auto-advance) */
  segmentMaxFirstDigit: Record<T, number>
  /** Placeholder for each segment */
  segmentPlaceholders: Record<T, string>
  /** List of segment names in order */
  segments: T[]
  /** Keys that act as separators to move to next segment */
  separatorKeys: string[]
}
export type TimeSegment = 'hour' | 'minute'

/**
 * Predefined configuration for date input (DD.MM.YYYY)
 */
export const DATE_SEGMENT_CONFIG: SegmentConfig<DateSegment> = {
  allowedCharsPattern: /[\d.]/,
  delimiter: '.',
  placeholder: '__.__.____',
  segmentMaxFirstDigit: {
    day: 3, // 4-9 auto-advances
    month: 1, // 2-9 auto-advances
    year: 9, // no auto-advance for year
  },
  segmentPlaceholders: {
    day: '__',
    month: '__',
    year: '____',
  },
  segments: ['day', 'month', 'year'],
  separatorKeys: ['.', ','],
}

/**
 * Predefined configuration for time input (HH:MM)
 */
export const TIME_SEGMENT_CONFIG: SegmentConfig<TimeSegment> = {
  allowedCharsPattern: /[\d:.]/,
  delimiter: ':',
  placeholder: '__:__',
  segmentMaxFirstDigit: {
    hour: 2, // 3-9 auto-advances
    minute: 5, // 6-9 auto-advances
  },
  segmentPlaceholders: {
    hour: '__',
    minute: '__',
  },
  segments: ['hour', 'minute'],
  separatorKeys: [':', '.'],
}

/**
 * Duration uses same segment type as time but allows hours > 23
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases -- semantic alias clarifies intent
export type DurationSegment = TimeSegment

/**
 * Predefined configuration for duration input (HH:MM)
 * Allows unlimited hours (no 24-hour restriction like time)
 */
export const DURATION_SEGMENT_CONFIG: SegmentConfig<DurationSegment> = {
  allowedCharsPattern: /[\d:.]/,
  delimiter: ':',
  placeholder: '__:__',
  segmentMaxFirstDigit: {
    hour: 9, // Allow any hour value for duration
    minute: 5, // 6-9 auto-advances
  },
  segmentPlaceholders: {
    hour: '__',
    minute: '__',
  },
  segments: ['hour', 'minute'],
  separatorKeys: [':', '.'],
}
