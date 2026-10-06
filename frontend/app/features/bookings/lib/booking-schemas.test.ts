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

import { parseWithZod } from '@conform-to/zod/v4'
import { describe, expect, it } from 'vitest'
import { type z } from 'zod'

import {
  createBookingEditRunningSchema,
  createBookingSchema,
  createBookingStartSchema,
} from './booking-schemas'

const t = (_key: string, options: string | { defaultValue: string }) =>
  `translated:${typeof options === 'string' ? options : options.defaultValue}`

const formDataOf = (entries: Record<string, string>) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(entries)) formData.set(name, value)
  return formData
}

const errorsOf = <Schema extends z.ZodType>(entries: Record<string, string>, schema: Schema) => {
  const submission = parseWithZod(formDataOf(entries), { schema })
  return submission.status === 'success' ? undefined : submission.error
}

describe('booking schemas', () => {
  it('reports the translated message for an empty project in the start form', () => {
    const errors = errorsOf({ projectId: '', tags: '' }, createBookingStartSchema(t))

    expect(errors?.projectId).toEqual(['translated:Required'])
  })

  it('reports the translated message for empty fields in the running booking form', () => {
    const errors = errorsOf({ projectId: '', start: '' }, createBookingEditRunningSchema(t))

    expect(errors?.projectId).toEqual(['translated:Required'])
    expect(errors?.start).toEqual(['translated:Required'])
  })

  it('reports the translated message for empty fields in the booking form', () => {
    const errors = errorsOf({ end: '', projectId: '', start: '' }, createBookingSchema(t))

    expect(errors?.end).toEqual(['translated:Required'])
    expect(errors?.projectId).toEqual(['translated:Required'])
    expect(errors?.start).toEqual(['translated:Required'])
  })

  it('accepts a project id in the start form', () => {
    const submission = parseWithZod(formDataOf({ projectId: 'project-1' }), {
      schema: createBookingStartSchema(t),
    })

    expect(submission.status).toBe('success')
  })
})
