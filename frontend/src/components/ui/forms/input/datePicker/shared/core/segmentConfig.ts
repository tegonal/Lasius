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

/**
 * Configuration for a segmented input field
 */
export type SegmentConfig<T extends string> = {
  /** List of segment names in order */
  segments: T[]
  /** Delimiter between segments (e.g., '.' for dates, ':' for times) */
  delimiter: string
  /** Full placeholder string (e.g., '__.__.____') */
  placeholder: string
  /** Placeholder for each segment */
  segmentPlaceholders: Record<T, string>
  /** Maximum allowed first digit for each segment (for auto-advance) */
  segmentMaxFirstDigit: Record<T, number>
  /** Regex pattern for allowed characters in input */
  allowedCharsPattern: RegExp
  /** Keys that act as separators to move to next segment */
  separatorKeys: string[]
}

export type DateSegment = 'day' | 'month' | 'year'
export type TimeSegment = 'hour' | 'minute'

/**
 * Predefined configuration for date input (DD.MM.YYYY)
 */
export const DATE_SEGMENT_CONFIG: SegmentConfig<DateSegment> = {
  segments: ['day', 'month', 'year'],
  delimiter: '.',
  placeholder: '__.__.____',
  segmentPlaceholders: {
    day: '__',
    month: '__',
    year: '____',
  },
  segmentMaxFirstDigit: {
    day: 3, // 4-9 auto-advances
    month: 1, // 2-9 auto-advances
    year: 9, // no auto-advance for year
  },
  allowedCharsPattern: /[\d.]/,
  separatorKeys: ['.', ','],
}

/**
 * Predefined configuration for time input (HH:MM)
 */
export const TIME_SEGMENT_CONFIG: SegmentConfig<TimeSegment> = {
  segments: ['hour', 'minute'],
  delimiter: ':',
  placeholder: '__:__',
  segmentPlaceholders: {
    hour: '__',
    minute: '__',
  },
  segmentMaxFirstDigit: {
    hour: 2, // 3-9 auto-advances
    minute: 5, // 6-9 auto-advances
  },
  allowedCharsPattern: /[\d:.]/,
  separatorKeys: [':', '.'],
}

/**
 * Duration uses same segment type as time but allows hours > 23
 */
export type DurationSegment = TimeSegment

/**
 * Predefined configuration for duration input (HH:MM)
 * Allows unlimited hours (no 24-hour restriction like time)
 */
export const DURATION_SEGMENT_CONFIG: SegmentConfig<DurationSegment> = {
  segments: ['hour', 'minute'],
  delimiter: ':',
  placeholder: '__:__',
  segmentPlaceholders: {
    hour: '__',
    minute: '__',
  },
  segmentMaxFirstDigit: {
    hour: 9, // Allow any hour value for duration
    minute: 5, // 6-9 auto-advances
  },
  allowedCharsPattern: /[\d:.]/,
  separatorKeys: [':', '.'],
}
