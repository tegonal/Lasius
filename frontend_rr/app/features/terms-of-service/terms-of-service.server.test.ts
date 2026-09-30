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

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { loadTermsOfService } from './terms-of-service.server'

describe('loadTermsOfService', () => {
  let directory: string

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'lasius-tos-'))
    await writeFile(join(directory, 'en.html'), '<p>English terms</p>')
    await writeFile(join(directory, 'de.html'), '<p>Deutsche Bedingungen</p>')
  })

  afterAll(async () => {
    await rm(directory, { force: true, recursive: true })
  })

  it('returns null when the operator sets no version', async () => {
    expect(await loadTermsOfService({ directory, locale: 'de', version: '' })).toBeNull()
  })

  it('returns null when the user accepted the current version', async () => {
    const terms = await loadTermsOfService({
      acceptedVersion: '2026-01',
      directory,
      locale: 'de',
      version: '2026-01',
    })
    expect(terms).toBeNull()
  })

  it('returns the file of the locale when the user accepted an older version', async () => {
    const terms = await loadTermsOfService({
      acceptedVersion: '2025-01',
      directory,
      locale: 'de',
      version: '2026-01',
    })
    expect(terms).toEqual({
      html: '<p>Deutsche Bedingungen</p>',
      isFallback: false,
      version: '2026-01',
    })
  })

  it('falls back to the English file for a locale without a file', async () => {
    const terms = await loadTermsOfService({ directory, locale: 'fr', version: '2026-01' })
    expect(terms).toEqual({ html: '<p>English terms</p>', isFallback: true, version: '2026-01' })
  })

  it('returns no HTML when neither the locale nor English has a file', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'lasius-tos-empty-'))
    const terms = await loadTermsOfService({ directory: empty, locale: 'it', version: '1' })
    await rm(empty, { force: true, recursive: true })
    expect(terms).toEqual({ html: null, isFallback: false, version: '1' })
  })
})
