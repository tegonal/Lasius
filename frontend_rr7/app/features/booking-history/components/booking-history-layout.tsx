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

import { Loading } from '~/components/ui/data-display/loading'
import { ColumnList } from '~/components/ui/layouts/column-list'
import {
  ColumnCenter,
  ColumnRight,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { useScrollPagination } from '~/hooks/use-scroll-pagination'
import { filterModelsBookingListByTags } from '~/lib/api/functions/filter-models-booking-list-by-tags'
import { filterModelsBookingListProjectId } from '~/lib/api/functions/filter-models-booking-list-project-id'
import { filterModelsBookingListUserId } from '~/lib/api/functions/filter-models-booking-list-user-id'
import { getExtendedModelsBookingList } from '~/lib/api/functions/get-extended-models-booking-list'
import { getModelsBookingSummary } from '~/lib/api/functions/get-models-booking-summary'
import { dateOptions } from '~/lib/utils/date/date-options'
import {
  type ModelsBooking,
  type ModelsEntityReference,
  type ModelsTag,
  type ModelsUserStub,
} from '~/services/api/lasius'

import { BookingHistoryExport } from './booking-history-export'
import { BookingHistoryFilter } from './booking-history-filter'
import { BookingHistoryStats } from './booking-history-stats'
import { BookingHistoryTable } from './booking-history-table'

const filterSchema = z.object({
  dateRange: z.string().optional(),
  from: z.string().optional(),
  projectId: z.string().optional(),
  tags: z.string().optional(),
  to: z.string().optional(),
  userId: z.string().optional(),
})

const defaultDateRange = dateOptions[0]

export type BookingHistoryControls = {
  dateRange: InputControl
  from: InputControl
  projectId: InputControl
  tags: InputControl
  to: InputControl
  userId: InputControl
}

type InputControl = {
  blur: () => void
  change: (value: string) => void
  focus: () => void
  value: string | undefined
}

type Props = {
  bookings: ModelsBooking[]
  dataSource: 'organisationBookings' | 'userBookings'
  isLoading?: boolean
  projects?: ModelsEntityReference[]
  users?: ModelsUserStub[]
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

export const BookingHistoryLayout = ({
  bookings,
  dataSource,
  isLoading = false,
  projects: projectsProp,
  users = [],
}: Props) => {
  const [searchParams] = useSearchParams()
  const { selectedOrganisationId: _selectedOrganisationId } = useOrganisation()
  const { findProjectById, userProjects } = useProjects()

  const projectIdFromUrl = searchParams.get('projectId') ?? ''
  const userIdFromUrl = searchParams.get('userId') ?? ''
  const tagsFromUrl = searchParams.get('tags') ?? ''

  const projectSuggestions: ModelsEntityReference[] = useMemo(() => {
    if (projectsProp) return projectsProp
    return userProjects.map((p) => p.projectReference)
  }, [projectsProp, userProjects])

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
  // Do NOT use form.value — it only subscribes to root form changes, not individual fields
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

  const projectId = projectIdValue
  const userId = userIdValue

  const processedItems = useMemo(
    () =>
      getExtendedModelsBookingList(
        filterModelsBookingListUserId(
          filterModelsBookingListProjectId(
            filterModelsBookingListByTags(bookings, tags),
            projectId,
          ),
          userId,
        ),
      ),
    [bookings, tags, projectId, userId],
  )

  const summary = useMemo(
    () => getModelsBookingSummary(processedItems),
    [processedItems],
  )

  const distinctUsers = useMemo(() => {
    const userSet = new Set(
      processedItems.map((item) => item.userReference?.key).filter(Boolean),
    )
    return userSet.size
  }, [processedItems])

  const distinctProjects = useMemo(() => {
    const projectSet = new Set(
      processedItems.map((item) => item.projectReference?.key).filter(Boolean),
    )
    return projectSet.size
  }, [processedItems])

  const { onScroll, visibleElements } = useScrollPagination(processedItems)

  const allowEdit = dataSource === 'userBookings'
  const allowDelete = dataSource === 'userBookings'
  const showUserColumn = dataSource === 'organisationBookings'
  const exportContext = dataSource === 'userBookings' ? 'user' : 'organisation'

  const inactiveProject = useMemo(() => {
    if (!projectIdFromUrl) return null
    const isActive = projectSuggestions.some((p) => p.id === projectIdFromUrl)
    if (isActive) return null
    const found = findProjectById(projectIdFromUrl)
    if (found) {
      return { id: found.id, key: found.key }
    }
    return null
  }, [projectIdFromUrl, projectSuggestions, findProjectById])

  return (
    <form {...getFormProps(form)} className="contents">
      <ContextMenuProvider>
        <ColumnCenter>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="bg-base-200 flex flex-shrink-0 items-start justify-between p-4">
              <BookingHistoryStats
                bookings={summary.elements}
                hours={summary.hours}
                projects={distinctProjects}
                users={distinctUsers}
              />
              <BookingHistoryExport
                context={exportContext}
                from={fromValue}
                hasBookings={processedItems.length > 0}
                projectId={projectId}
                tags={
                  tags.length > 0
                    ? tags.map((tag) => tag.id).join(',')
                    : undefined
                }
                to={toValue}
                userId={userId}
              />
            </div>
            {bookings.length === 0 && isLoading && <Loading />}
            <ScrollArea className="min-h-0 flex-1" onScroll={onScroll}>
              <div className="pt-4">
                <BookingHistoryTable
                  allowDelete={allowDelete}
                  allowEdit={allowEdit}
                  controls={controls}
                  items={visibleElements}
                  showUserColumn={showUserColumn}
                />
              </div>
            </ScrollArea>
          </div>
        </ColumnCenter>
        <ColumnRight>
          <ScrollArea className="h-full">
            <ColumnList>
              <BookingHistoryFilter
                controls={controls}
                dataSource={dataSource}
                fields={fields}
                inactiveProject={inactiveProject}
                projects={projectSuggestions}
                users={users}
              />
            </ColumnList>
          </ScrollArea>
        </ColumnRight>
      </ContextMenuProvider>
    </form>
  )
}
