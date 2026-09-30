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
  const [searchParameters] = useSearchParams()

  const projectIdFromUrl = searchParameters.get('projectId') ?? ''
  const userIdFromUrl = searchParameters.get('userId') ?? ''
  const tagsFromUrl = searchParameters.get('tags') ?? ''

  const initialRange = getInitialDateRange(searchParameters)

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
  const [, setSearchParameters] = useSearchParams()
  const previousFrom = useRef(fromValue)
  const previousTo = useRef(toValue)
  const previousProjectId = useRef(projectIdValue)
  const previousUserId = useRef(userIdValue)
  const previousTags = useRef(tagsValue)

  useEffect(() => {
    if (!fromValue || !toValue) return
    if (
      fromValue === previousFrom.current &&
      toValue === previousTo.current &&
      projectIdValue === previousProjectId.current &&
      userIdValue === previousUserId.current &&
      tagsValue === previousTags.current
    )
      return

    previousFrom.current = fromValue
    previousTo.current = toValue
    previousProjectId.current = projectIdValue
    previousUserId.current = userIdValue
    previousTags.current = tagsValue

    setSearchParameters(
      (previous) => {
        previous.set('from', fromValue)
        previous.set('to', toValue)
        if (projectIdValue) {
          previous.set('projectId', projectIdValue)
        } else {
          previous.delete('projectId')
        }
        if (userIdValue) {
          previous.set('userId', userIdValue)
        } else {
          previous.delete('userId')
        }
        if (tagsValue) {
          previous.set('tags', tagsValue)
        } else {
          previous.delete('tags')
        }
        return previous
      },
      { replace: true },
    )
  }, [fromValue, toValue, projectIdValue, userIdValue, tagsValue, setSearchParameters])

  // Set initial search params on mount if missing
  const didSetInitialParameters = useRef(false)
  useEffect(() => {
    if (didSetInitialParameters.current) return
    didSetInitialParameters.current = true

    if (!searchParameters.has('from') || !searchParameters.has('to')) {
      setSearchParameters(
        (previous) => {
          previous.set('from', initialRange.from)
          previous.set('to', initialRange.to)
          return previous
        },
        { replace: true },
      )
    }
  }, [searchParameters, setSearchParameters, initialRange.from, initialRange.to])

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

function getInitialDateRange(searchParameters: URLSearchParams) {
  const fromParameter = searchParameters.get('from')
  const toParameter = searchParameters.get('to')
  if (fromParameter && toParameter) {
    return { from: fromParameter, to: toParameter }
  }
  if (defaultDateRange) {
    return defaultDateRange.dateRangeFn(new Date())
  }
  return { from: '', to: '' }
}
