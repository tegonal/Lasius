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

import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { type ModelsConnectivityStatus } from '~/services/api/lasius'

import { getConnectivityStatusLabel, getConnectivityStatusStyle } from './connectivity-status'

const t = (key: string, options: string | { defaultValue: string }) =>
  `${key}|${typeof options === 'string' ? options : options.defaultValue}`

describe('getConnectivityStatusStyle', () => {
  it('returns the icon and the colors of a status', () => {
    expect(getConnectivityStatusStyle('healthy')).toEqual({
      dotClassName: 'bg-success',
      icon: CheckCircle2,
      iconClassName: 'text-success',
    })
    expect(getConnectivityStatusStyle('failed').icon).toBe(XCircle)
  })

  it('falls back to the unknown style for a status the client does not know', () => {
    expect(getConnectivityStatusStyle('paused' as ModelsConnectivityStatus).icon).toBe(Clock)
  })
})

describe('getConnectivityStatusLabel', () => {
  it('uses a static key for each status', () => {
    expect(getConnectivityStatusLabel('degraded', t)).toBe(
      'integrations:issueImporters.healthStatus.degraded|Degraded',
    )
    expect(getConnectivityStatusLabel('unknown', t)).toBe(
      'integrations:issueImporters.healthStatus.unknown|Unknown',
    )
  })
})
