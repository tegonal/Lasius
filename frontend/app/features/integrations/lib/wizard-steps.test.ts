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

import {
  flattenMappings,
  getPreviousStep,
  getQueueStep,
  getStepClassName,
} from '~/features/integrations/lib/wizard-steps'

describe('getQueueStep', () => {
  const entry = (externalProjectId: string) => ({
    externalProjectId,
    mapping: { projectId: 'lasius-1' },
  })

  it('stops without an entry, a config id or an importer type', () => {
    expect(getQueueStep(undefined, 'c1', 'gitlab', [])).toEqual({ kind: 'stop' })
    expect(getQueueStep(entry('101'), undefined, 'gitlab', [])).toEqual({ kind: 'stop' })
    expect(getQueueStep(entry('101'), 'c1', undefined, [])).toEqual({ kind: 'stop' })
  })

  it('sends the payload of a valid entry with the config id', () => {
    const step = getQueueStep(entry('101'), 'c1', 'gitlab', [{ id: '101', name: 'Alpha' }])
    expect(step).toMatchObject({ configId: 'c1', kind: 'send' })
  })

  it('marks an entry whose payload cannot be built as invalid', () => {
    expect(getQueueStep(entry('no-slash'), 'c1', 'github', undefined)).toMatchObject({
      kind: 'invalid',
    })
  })
})

describe('getPreviousStep', () => {
  it('goes back one step from config and test, and not from the first step', () => {
    expect(getPreviousStep('config', false)).toBe('platform')
    expect(getPreviousStep('test', false)).toBe('config')
    expect(getPreviousStep('platform', false)).toBeNull()
  })

  it('skips the test step from projects once the config exists', () => {
    expect(getPreviousStep('projects', true)).toBe('config')
    expect(getPreviousStep('projects', false)).toBe('test')
  })
})

describe('getStepClassName', () => {
  it('marks done, current and later steps', () => {
    expect(getStepClassName(0, 1)).toBe('text-success')
    expect(getStepClassName(1, 1)).toBe('text-primary font-medium')
    expect(getStepClassName(2, 1)).toBe('text-base-content/40')
  })
})

describe('flattenMappings', () => {
  it('gives one entry for each Lasius project of each external project', () => {
    expect(
      flattenMappings({
        a: [{ projectId: 'p1' }, { projectId: 'p2' }],
        b: [{ projectId: 'p3' }],
      }),
    ).toEqual([
      { externalProjectId: 'a', mapping: { projectId: 'p1' } },
      { externalProjectId: 'a', mapping: { projectId: 'p2' } },
      { externalProjectId: 'b', mapping: { projectId: 'p3' } },
    ])
  })

  it('gives no entry for no mappings', () => {
    expect(flattenMappings({})).toEqual([])
  })
})
