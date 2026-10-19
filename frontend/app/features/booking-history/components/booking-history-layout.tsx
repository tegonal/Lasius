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

import { useMemo } from 'react'

import { Loading } from '~/components/ui/data-display/loading'
import { ColumnList } from '~/components/ui/layouts/column-list'
import { ColumnCenter, ColumnRight } from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { useBookingHistoryFilters } from '~/features/booking-history/hooks/use-booking-history-filters'
import {
  type BookingPageQuery,
  useBookingPages,
} from '~/features/booking-history/hooks/use-booking-pages'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { getExtendedModelsBookingList } from '~/lib/api/functions/get-extended-models-booking-list'
import {
  EMPTY_BOOKING_SUMMARY,
  getBookingSummaryFromApi,
} from '~/lib/api/functions/get-models-booking-summary'
import {
  type ModelsBookingPage,
  type ModelsEntityReference,
  type ModelsUserStub,
} from '~/services/api/lasius'

import { BookingHistoryExport } from './booking-history-export'
import { BookingHistoryFilter } from './booking-history-filter'
import { BookingHistoryStats } from './booking-history-stats'
import { BookingHistoryTable } from './booking-history-table'

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

type Properties = {
  dataSource: BookingPageQuery['dataSource']
  firstPage: ModelsBookingPage
  projects?: ModelsEntityReference[]
  query: BookingPageQuery
  signature: string
  users?: ModelsUserStub[]
}

const NO_USERS: ModelsUserStub[] = []

export const BookingHistoryLayout = ({
  dataSource,
  firstPage,
  projects: projectsProperty,
  query,
  signature,
  users = NO_USERS,
}: Properties) => {
  const { findProjectById, userProjects } = useProjects()

  const projectSuggestions: ModelsEntityReference[] = useMemo(() => {
    if (projectsProperty) return projectsProperty
    return userProjects.map((p) => p.projectReference)
  }, [projectsProperty, userProjects])

  const {
    controls,
    fields,
    formProps,
    fromValue,
    projectId,
    projectIdFromUrl,
    tags,
    toValue,
    userId,
  } = useBookingHistoryFilters()

  const { isLoading, items, onScroll, total } = useBookingPages({ firstPage, query, signature })
  const extendedItems = useMemo(() => getExtendedModelsBookingList(items), [items])

  const filteredSummary = firstPage.summary ?? EMPTY_BOOKING_SUMMARY
  const summary = getBookingSummaryFromApi(filteredSummary)

  const isAllowEdit = dataSource === 'userBookings'
  const isAllowDelete = dataSource === 'userBookings'
  const isShowUserColumn = dataSource === 'organisationBookings'
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
    <form {...formProps} className="contents">
      <ContextMenuProvider>
        <ColumnCenter>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="bg-base-200 flex flex-shrink-0 flex-wrap items-start justify-between gap-4 p-4">
              <BookingHistoryStats
                bookings={summary.elements}
                hours={summary.hours}
                projects={filteredSummary.distinctProjects}
                users={filteredSummary.distinctUsers}
              />
              <BookingHistoryExport
                context={exportContext}
                from={fromValue}
                hasBookings={total > 0}
                projectId={projectId}
                tagIds={tags.map((tag) => tag.id)}
                to={toValue}
                userId={userId}
              />
            </div>
            <ScrollArea className="min-h-0 flex-1" onScroll={onScroll}>
              <div className="pt-4">
                <BookingHistoryTable
                  allowDelete={isAllowDelete}
                  allowEdit={isAllowEdit}
                  controls={controls}
                  items={extendedItems}
                  showUserColumn={isShowUserColumn}
                />
                {isLoading && <Loading />}
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
