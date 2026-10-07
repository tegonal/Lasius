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
import { ModelsUserOrganisationRole } from '~/services/api/lasius/modelsUserOrganisationRole'

import { loadOrgStatsContext, loadStatsContext } from './stats-loader.server'

vi.mock('~/lib/organisation-helpers.server', () => ({ loadOrganisationContext: vi.fn() }))
vi.mock('~/services/auth/auth-helpers.server', () => ({
  mergeAuthHeaders: vi.fn(() => ({ 'Set-Cookie': 'session=new' })),
}))

const auth = { headers: {}, session: {} }
const headers = { Authorization: 'Bearer token' }

const mockContext = (role: ModelsUserOrganisationRole) => {
  const organisations = [{ organisationReference: { id: 'org-1', key: 'org-1' }, role }]
  vi.mocked(loadOrganisationContext).mockResolvedValue({
    auth,
    headers,
    selectedOrgId: 'org-1',
    user: { organisations },
  } as unknown as Awaited<ReturnType<typeof loadOrganisationContext>>)
  return organisations
}

const request = new Request('http://localhost/user/stats')

describe('loadStatsContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 2026-10-07 is a Wednesday, so yesterday is 2026-10-06.
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0, 0))
    mockContext(ModelsUserOrganisationRole.OrganisationMember)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('keeps the range when the URL has both from and to', async () => {
    const url = new URL('http://localhost/user/stats?from=2026-01-01&to=2026-01-31')

    const context = await loadStatsContext(request, url)

    expect(context).toMatchObject({
      from: '2026-01-01',
      headers,
      selectedOrgId: 'org-1',
      to: '2026-01-31',
    })
    expect(context.organisations).toHaveLength(1)
    expect(loadOrganisationContext).toHaveBeenCalledWith(request, url)
  })

  it.each([
    ['only from', '?from=2026-01-01'],
    ['only to', '?to=2026-01-31'],
    ['neither', ''],
  ])('uses the default range of yesterday with %s', async (_label, search) => {
    const context = await loadStatsContext(request, new URL(`http://localhost/user/stats${search}`))

    expect(context.from.startsWith('2026-10-06')).toBe(true)
    expect(context.to.startsWith('2026-10-06')).toBe(true)
  })
})

describe('loadOrgStatsContext', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns the context for an organisation administrator', async () => {
    mockContext(ModelsUserOrganisationRole.OrganisationAdministrator)

    const context = await loadOrgStatsContext(request, new URL('http://localhost/x?from=a&to=b'))

    expect(context.selectedOrgId).toBe('org-1')
  })

  it('throws 403 with the auth headers for a member', async () => {
    mockContext(ModelsUserOrganisationRole.OrganisationMember)

    await expect(loadOrgStatsContext(request, new URL('http://localhost/x'))).rejects.toSatisfy(
      (thrown: unknown) =>
        thrown instanceof Response &&
        thrown.status === 403 &&
        thrown.headers.get('Set-Cookie') === 'session=new',
    )
  })
})
