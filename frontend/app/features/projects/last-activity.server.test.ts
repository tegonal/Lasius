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

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProjectsLastActivity } from '~/services/api/lasius/projects/projects'

import { loadLastActivityDates } from './last-activity.server'

vi.mock('~/services/api/lasius/projects/projects', () => ({ getProjectsLastActivity: vi.fn() }))
vi.mock('~/lib/logger', () => ({ logger: { error: vi.fn() } }))

describe('loadLastActivityDates', () => {
  beforeEach(() => {
    vi.mocked(getProjectsLastActivity).mockReset()
  })

  it('maps each project id to its last activity', async () => {
    vi.mocked(getProjectsLastActivity).mockResolvedValue({
      data: [
        { lastActivity: '2026-10-01T09:00:00.000', projectId: 'p1' },
        { lastActivity: '2026-09-01T09:00:00.000', projectId: 'p2' },
      ],
      headers: new Headers(),
      status: 200,
    })
    expect(await loadLastActivityDates('o1', {})).toEqual({
      p1: '2026-10-01T09:00:00.000',
      p2: '2026-09-01T09:00:00.000',
    })
  })

  it('returns no dates when the request fails', async () => {
    vi.mocked(getProjectsLastActivity).mockRejectedValue(new Error('API error: 500'))
    expect(await loadLastActivityDates('o1', {})).toEqual({})
  })
})
