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

import {
  applyFilterParameters,
  areFilterValuesEqual,
  type FilterUrlValues,
  parseTagsParameter,
} from '~/features/booking-history/lib/booking-history-search-parameters'
import { dateOptions } from '~/lib/utils/date/date-options'
import { orEmpty } from '~/lib/utils/strings'
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
  const [searchParameters, setSearchParameters] = useSearchParams()

  const projectIdFromUrl = orEmpty(searchParameters.get('projectId'))
  const userIdFromUrl = orEmpty(searchParameters.get('userId'))
  const tagsFromUrl = orEmpty(searchParameters.get('tags'))

  const initialRange = getInitialDateRange(searchParameters)

  const [form, fields] = useForm({
    constraint: getZodConstraint(filterSchema),
    defaultValue: {
      dateRange: orEmpty(defaultDateRange?.name),
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
  const fromValue = orEmpty(fields.from.value)
  const toValue = orEmpty(fields.to.value)
  const dateRangeValue = orEmpty(fields.dateRange.value)
  const projectIdValue = orEmpty(fields.projectId.value)
  const userIdValue = orEmpty(fields.userId.value)
  const tagsValue = orEmpty(fields.tags.value)

  const noop = () => {}
  const makeControl = (name: string, value: string) => ({
    blur: noop,
    change: (v: string) => form.update({ name, value: v }),
    focus: noop,
    value,
  })
  const controls: BookingHistoryControls = {
    dateRange: makeControl(fields.dateRange.name, dateRangeValue),
    from: makeControl(fields.from.name, fromValue),
    projectId: makeControl(fields.projectId.name, projectIdValue),
    tags: makeControl(fields.tags.name, tagsValue),
    to: makeControl(fields.to.name, toValue),
    userId: makeControl(fields.userId.name, userIdValue),
  }

  // Sync filter values to URL search params so the loader refetches and filters are shareable
  const previousValues = useRef<FilterUrlValues>({
    from: fromValue,
    projectId: projectIdValue,
    tags: tagsValue,
    to: toValue,
    userId: userIdValue,
  })

  useEffect(() => {
    if (!fromValue || !toValue) return
    const values: FilterUrlValues = {
      from: fromValue,
      projectId: projectIdValue,
      tags: tagsValue,
      to: toValue,
      userId: userIdValue,
    }
    if (areFilterValuesEqual(values, previousValues.current)) return

    previousValues.current = values
    setSearchParameters((previous) => applyFilterParameters(previous, values), { replace: true })
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

  const tags: ModelsTag[] = useMemo(() => parseTagsParameter(tagsValue), [tagsValue])

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
