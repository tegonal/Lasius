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

import { useForm, useInputControl } from '@conform-to/react'
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
import { formatISOLocale } from '~/lib/utils/dates'
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

  const projectSuggestions: ModelsEntityReference[] = useMemo(() => {
    if (projectsProp) return projectsProp
    return userProjects.map((p) => p.projectReference)
  }, [projectsProp, userProjects])

  const [, fields] = useForm({
    constraint: getZodConstraint(filterSchema),
    defaultValue: {
      dateRange: '',
      from: formatISOLocale(new Date()),
      projectId: projectIdFromUrl,
      tags: '',
      to: formatISOLocale(new Date()),
      userId: '',
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: filterSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const controls: BookingHistoryControls = {
    dateRange: useInputControl(fields.dateRange),
    from: useInputControl(fields.from),
    projectId: useInputControl(fields.projectId),
    tags: useInputControl(fields.tags),
    to: useInputControl(fields.to),
    userId: useInputControl(fields.userId),
  }

  // Sync from/to to URL search params so the loader refetches
  const [, setSearchParams] = useSearchParams()
  const isInitialMount = useRef(true)
  const prevFrom = useRef(controls.from.value)
  const prevTo = useRef(controls.to.value)

  useEffect(() => {
    const fromVal = controls.from.value
    const toVal = controls.to.value

    if (!fromVal || !toVal) return
    if (fromVal === prevFrom.current && toVal === prevTo.current) return

    prevFrom.current = fromVal
    prevTo.current = toVal

    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    setSearchParams(
      (prev) => {
        prev.set('from', fromVal)
        prev.set('to', toVal)
        return prev
      },
      { replace: true },
    )
  }, [controls.from.value, controls.to.value, setSearchParams])

  // Parse tags for filtering
  const tags: ModelsTag[] = useMemo(() => {
    const tagsJson = controls.tags.value
    if (!tagsJson) return []
    try {
      return JSON.parse(tagsJson) as ModelsTag[]
    } catch {
      return []
    }
  }, [controls.tags.value])

  const projectId = controls.projectId.value ?? ''
  const userId = controls.userId.value ?? ''

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
              bookings={processedItems}
              context={exportContext}
              from={controls.from.value}
              to={controls.to.value}
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
  )
}
