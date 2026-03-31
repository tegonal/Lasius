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

import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'

import { dateOptions } from '~/lib/utils/date/date-options'
import { type ModelsTag } from '~/services/api/lasius'

import { type BookingHistoryControls } from '../components/booking-history-layout'

const filterSchema = z.object({
  dateRange: z.string().optional(),
  from: z.string().optional(),
  projectId: z.string().optional(),
  tags: z.string().optional(),
  to: z.string().optional(),
  userId: z.string().optional(),
})

const defaultDateRange = dateOptions[0]

/**
 * Manages filter state, Conform form binding, and URL sync for booking history.
 */
export function useBookingHistoryFilters() {
  const [searchParams] = useSearchParams()

  const projectIdFromUrl = searchParams.get('projectId') ?? ''
  const userIdFromUrl = searchParams.get('userId') ?? ''
  const tagsFromUrl = searchParams.get('tags') ?? ''

  const initialRange = getInitialDateRange(searchParams)

  const [form, fields] = useForm({
    constraint: getZodConstraint(filterSchema),
    defaultValue: {
      dateRange: defaultDateRange?.name ?? '',
      from: initialRange.from,
      projectId: projectIdFromUrl,
      tags: tagsFromUrl,
      to: initialRange.to,
      userId: userIdFromUrl,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: filterSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  // Read values reactively from fields.xxx.value (subscribes per-field via useSyncExternalStore)
  const fromValue = fields.from.value ?? ''
  const toValue = fields.to.value ?? ''
  const dateRangeValue = fields.dateRange.value ?? ''
  const projectIdValue = fields.projectId.value ?? ''
  const userIdValue = fields.userId.value ?? ''
  const tagsValue = fields.tags.value ?? ''

  const noop = () => {}
  const controls: BookingHistoryControls = {
    dateRange: {
      blur: noop,
      change: (v) => form.update({ name: fields.dateRange.name, value: v }),
      focus: noop,
      value: dateRangeValue,
    },
    from: {
      blur: noop,
      change: (v) => form.update({ name: fields.from.name, value: v }),
      focus: noop,
      value: fromValue,
    },
    projectId: {
      blur: noop,
      change: (v) => form.update({ name: fields.projectId.name, value: v }),
      focus: noop,
      value: projectIdValue,
    },
    tags: {
      blur: noop,
      change: (v) => form.update({ name: fields.tags.name, value: v }),
      focus: noop,
      value: tagsValue,
    },
    to: {
      blur: noop,
      change: (v) => form.update({ name: fields.to.name, value: v }),
      focus: noop,
      value: toValue,
    },
    userId: {
      blur: noop,
      change: (v) => form.update({ name: fields.userId.name, value: v }),
      focus: noop,
      value: userIdValue,
    },
  }

  // Sync filter values to URL search params so the loader refetches and filters are shareable
  const [, setSearchParams] = useSearchParams()
  const prevFrom = useRef(fromValue)
  const prevTo = useRef(toValue)
  const prevProjectId = useRef(projectIdValue)
  const prevUserId = useRef(userIdValue)
  const prevTags = useRef(tagsValue)

  useEffect(() => {
    if (!fromValue || !toValue) return
    if (
      fromValue === prevFrom.current &&
      toValue === prevTo.current &&
      projectIdValue === prevProjectId.current &&
      userIdValue === prevUserId.current &&
      tagsValue === prevTags.current
    )
      return

    prevFrom.current = fromValue
    prevTo.current = toValue
    prevProjectId.current = projectIdValue
    prevUserId.current = userIdValue
    prevTags.current = tagsValue

    setSearchParams(
      (prev) => {
        prev.set('from', fromValue)
        prev.set('to', toValue)
        if (projectIdValue) {
          prev.set('projectId', projectIdValue)
        } else {
          prev.delete('projectId')
        }
        if (userIdValue) {
          prev.set('userId', userIdValue)
        } else {
          prev.delete('userId')
        }
        if (tagsValue) {
          prev.set('tags', tagsValue)
        } else {
          prev.delete('tags')
        }
        return prev
      },
      { replace: true },
    )
  }, [
    fromValue,
    toValue,
    projectIdValue,
    userIdValue,
    tagsValue,
    setSearchParams,
  ])

  // Set initial search params on mount if missing
  const didSetInitialParams = useRef(false)
  useEffect(() => {
    if (didSetInitialParams.current) return
    didSetInitialParams.current = true

    if (!searchParams.has('from') || !searchParams.has('to')) {
      setSearchParams(
        (prev) => {
          prev.set('from', initialRange.from)
          prev.set('to', initialRange.to)
          return prev
        },
        { replace: true },
      )
    }
  }, [searchParams, setSearchParams, initialRange.from, initialRange.to])

  // Parse tags for filtering
  const tags: ModelsTag[] = useMemo(() => {
    if (!tagsValue) return []
    try {
      return JSON.parse(tagsValue) as ModelsTag[]
    } catch {
      return []
    }
  }, [tagsValue])

  return {
    controls,
    fields,
    formProps: getFormProps(form),
    fromValue,
    projectId: projectIdValue,
    projectIdFromUrl,
    tags,
    toValue,
    userId: userIdValue,
  }
}

function getInitialDateRange(searchParams: URLSearchParams) {
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  if (fromParam && toParam) {
    return { from: fromParam, to: toParam }
  }
  if (defaultDateRange) {
    return defaultDateRange.dateRangeFn(new Date())
  }
  return { from: '', to: '' }
}
