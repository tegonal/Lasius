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

import { describe, expect, it } from 'vitest'

import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'

import {
  bookingProjectAndTags,
  buildAdjustEndBody,
  buildAdjustStartBody,
} from './booking-adjustments'

const tag = { id: 'tag-1', type: 'SimpleTag' } as const

const booking = (
  start: string,
  end?: string,
  overrides: Partial<ModelsBooking> = {},
): ModelsBooking => ({
  bookingHash: 1,
  end: end ? { dateTime: end, zone: 'Europe/Zurich' } : undefined,
  id: `booking-${start}`,
  organisationReference: { id: 'org-1', key: 'org' },
  projectReference: { id: 'project-1', key: 'project' },
  start: { dateTime: start, zone: 'Europe/Zurich' },
  tags: [tag],
  userReference: { id: 'user-1', key: 'user' },
  ...overrides,
})

const iso = (value: string) => formatISOLocale(new Date(value))

describe('bookingProjectAndTags', () => {
  it('returns the project id and the tags of the booking', () => {
    expect(bookingProjectAndTags(booking('2024-01-15T10:00:00Z'))).toEqual({
      projectId: 'project-1',
      tags: [tag],
    })
  })

  it('falls back to an empty project id and an empty tag list', () => {
    const item = booking('2024-01-15T10:00:00Z', undefined, {
      projectReference: undefined as unknown as ModelsBooking['projectReference'],
      tags: undefined as unknown as ModelsBooking['tags'],
    })
    expect(bookingProjectAndTags(item)).toEqual({ projectId: '', tags: [] })
  })
})

describe('buildAdjustStartBody', () => {
  const item = booking('2024-01-15T10:30:00Z', '2024-01-15T11:00:00Z')

  it('moves the start to the end of the previous booking', () => {
    const previous = booking('2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z')
    expect(buildAdjustStartBody(item, previous)).toEqual({
      end: iso('2024-01-15T11:00:00Z'),
      projectId: 'project-1',
      start: iso('2024-01-15T10:00:00Z'),
      tags: [tag],
    })
  })

  it('keeps the key order of the request body', () => {
    const previous = booking('2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z')
    expect(Object.keys(buildAdjustStartBody(item, previous) ?? {})).toEqual([
      'end',
      'projectId',
      'start',
      'tags',
    ])
  })

  it('sends an undefined end for a running booking', () => {
    const running = booking('2024-01-15T10:30:00Z')
    const previous = booking('2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z')
    expect(buildAdjustStartBody(running, previous)?.end).toBeUndefined()
  })

  it('returns null without a previous booking or without its end', () => {
    expect(buildAdjustStartBody(item, null)).toBeNull()
    expect(buildAdjustStartBody(item, booking('2024-01-15T09:00:00Z'))).toBeNull()
  })

  it('returns null when the gap is one minute or less', () => {
    const exact = booking('2024-01-15T09:00:00Z', '2024-01-15T10:29:00Z')
    const tooClose = booking('2024-01-15T09:00:00Z', '2024-01-15T10:29:30Z')
    const justOutside = booking('2024-01-15T09:00:00Z', '2024-01-15T10:28:59Z')
    expect(buildAdjustStartBody(item, exact)).toBeNull()
    expect(buildAdjustStartBody(item, tooClose)).toBeNull()
    expect(buildAdjustStartBody(item, justOutside)).not.toBeNull()
  })
})

describe('buildAdjustEndBody', () => {
  const item = booking('2024-01-15T10:00:00Z', '2024-01-15T10:30:00Z')

  it('moves the end to the start of the next booking', () => {
    const next = booking('2024-01-15T11:00:00Z', '2024-01-15T12:00:00Z')
    expect(buildAdjustEndBody(item, next)).toEqual({
      end: iso('2024-01-15T11:00:00Z'),
      projectId: 'project-1',
      start: iso('2024-01-15T10:00:00Z'),
      tags: [tag],
    })
  })

  it('keeps the key order of the request body', () => {
    const next = booking('2024-01-15T11:00:00Z')
    expect(Object.keys(buildAdjustEndBody(item, next) ?? {})).toEqual([
      'end',
      'projectId',
      'start',
      'tags',
    ])
  })

  it('returns null without a next booking or for a running booking', () => {
    expect(buildAdjustEndBody(item, null)).toBeNull()
    expect(
      buildAdjustEndBody(booking('2024-01-15T10:00:00Z'), booking('2024-01-15T11:00:00Z')),
    ).toBeNull()
  })

  it('returns null when the gap is one minute or less', () => {
    expect(buildAdjustEndBody(item, booking('2024-01-15T10:31:00Z'))).toBeNull()
    expect(buildAdjustEndBody(item, booking('2024-01-15T10:30:20Z'))).toBeNull()
    expect(buildAdjustEndBody(item, booking('2024-01-15T10:31:01Z'))).not.toBeNull()
  })
})
