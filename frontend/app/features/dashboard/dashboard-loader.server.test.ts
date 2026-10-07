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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadOrganisationContext } from '~/lib/organisation-helpers.server'
import { formatISOLocale } from '~/lib/utils/dates'

import { loadDashboardContext } from './dashboard-loader.server'

vi.mock('~/lib/organisation-helpers.server', () => ({ loadOrganisationContext: vi.fn() }))
vi.mock('~/services/auth/auth-helpers.server', () => ({ mergeAuthHeaders: vi.fn() }))

const plannedWorkingHours = {
  friday: 8,
  monday: 8,
  saturday: 0,
  sunday: 0,
  thursday: 8,
  tuesday: 8,
  wednesday: 8,
}

const mockContext = (selectedOrg: unknown) => {
  vi.mocked(loadOrganisationContext).mockResolvedValue({
    auth: { headers: {}, session: {} },
    headers: { Authorization: 'Bearer token' },
    selectedOrg,
    selectedOrgId: 'org-1',
  } as unknown as Awaited<ReturnType<typeof loadOrganisationContext>>)
}

const request = new Request('http://localhost/user/home')
const urlWith = (search: string) => new URL(`http://localhost/user/home${search}`)

describe('loadDashboardContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0, 0))
    mockContext({ plannedWorkingHours })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('keeps a valid date from the URL', async () => {
    const context = await loadDashboardContext(request, urlWith('?date=2026-03-15'))

    expect(context.selectedDate).toBe('2026-03-15')
    expect(context.selectedOrgId).toBe('org-1')
    expect(context.plannedHours).toEqual(plannedWorkingHours)
  })

  it.each([
    ['an invalid date', '?date=not-a-date'],
    ['no date', ''],
  ])('falls back to today with %s', async (_label, search) => {
    const context = await loadDashboardContext(request, urlWith(search))

    expect(context.selectedDate).toBe(formatISOLocale(new Date(2026, 9, 7, 12, 0, 0)))
  })

  it('returns null planned hours for an organisation without planned hours', async () => {
    mockContext({ plannedWorkingHours: undefined })

    const context = await loadDashboardContext(request, urlWith(''))

    expect(context.plannedHours).toBeNull()
  })

  it('returns null planned hours without a selected organisation', async () => {
    mockContext(undefined)

    const context = await loadDashboardContext(request, urlWith(''))

    expect(context.plannedHours).toBeNull()
  })
})
