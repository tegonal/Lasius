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

import { isBefore, isFuture } from 'date-fns'
import { z } from 'zod'

import { type SchemaTranslationFn } from '~/lib/i18n-types'

/**
 * Schema for the booking start form (projectId + tags only).
 */
export const createBookingStartSchema = (t: SchemaTranslationFn) =>
  z.object({
    projectId: z.string().min(1, t('validation.required', 'Required')),
    tags: z.string().optional(),
  })

/**
 * Schema for editing a running booking.
 * Validates that start time is in the past.
 */
export const createBookingEditRunningSchema = (t: SchemaTranslationFn) =>
  z
    .object({
      projectId: z.string().min(1, t('validation.required', 'Required')),
      start: z.string().min(1, t('validation.required', 'Required')),
      tags: z.string().optional(),
    })
    .refine(
      (d) => {
        if (!d.start) return true
        return !isFuture(new Date(d.start))
      },
      {
        error: t(
          'validation.startMustBeInPast',
          'Start time must be in the past',
        ),
        path: ['start'],
      },
    )

/**
 * Schema for the booking add/update form.
 * Cross-field validation ensures start < end.
 */
export const createBookingSchema = (t: SchemaTranslationFn) =>
  z
    .object({
      end: z.string().min(1, t('validation.required', 'Required')),
      projectId: z.string().min(1, t('validation.required', 'Required')),
      start: z.string().min(1, t('validation.required', 'Required')),
      tags: z.string().optional(),
    })
    .refine(
      (d) => {
        if (!d.start || !d.end) return true
        return isBefore(new Date(d.start), new Date(d.end))
      },
      {
        error: t(
          'validation.startBeforeEnd',
          'Start time must be before end time',
        ),
        path: ['start'],
      },
    )

/**
 * Parse tags JSON from form data back to ModelsTag[].
 */
export const parseTagsFromFormData = (
  tagsJson: string | undefined,
): Array<{ id: string; type: string }> => {
  if (!tagsJson) return []
  try {
    const parsed = JSON.parse(tagsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t: unknown) =>
        typeof t === 'object' && t !== null && 'id' in t && 'type' in t,
    ) as Array<{ id: string; type: string }>
  } catch {
    return []
  }
}
