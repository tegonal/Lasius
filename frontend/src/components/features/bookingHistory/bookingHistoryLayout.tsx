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

import { BookingHistoryExport } from 'components/features/bookingHistory/bookingHistoryExport'
import { BookingHistoryFilter } from 'components/features/bookingHistory/bookingHistoryFilter'
import { BookingHistoryStats } from 'components/features/bookingHistory/bookingHistoryStats'
import { BookingHistoryTable } from 'components/features/bookingHistory/bookingHistoryTable'
import { ColumnList } from 'components/primitives/layout/ColumnList'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Loading } from 'components/ui/data-display/fetchState/loading'
import { apiTimespanFromTo } from 'lib/api/apiDateHandling'
import { filterModelsBookingListByTags } from 'lib/api/functions/filterModelsBookingListByTags'
import { filterModelsBookingListProjectId } from 'lib/api/functions/filterModelsBookingListProjectId'
import { filterModelsBookingListUserId } from 'lib/api/functions/filterModelsBookingListUserId'
import { getExtendedModelsBookingList } from 'lib/api/functions/getExtendedModelsBookingList'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProjects } from 'lib/api/hooks/useProjects'
import { ModelsBooking } from 'lib/api/lasius'
import { useGetOrganisationBookingList } from 'lib/api/lasius/organisation-bookings/organisation-bookings'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { ErrorType } from 'lib/api/lasiusAxiosInstance'
import useScrollPagination from 'lib/hooks/useScrollPaginationHook'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { KeyedMutator } from 'swr'
import { ModelsTags } from 'types/common'
import { useIsClient } from 'usehooks-ts'

type FormValues = {
  projectId: string
  userId: string
  tags: ModelsTags[]
  from: string
  to: string
  dateRange: string
}

type Props = {
  dataSource: 'userBookings' | 'organisationBookings'
}
export const BookingHistoryLayout: React.FC<Props> = ({ dataSource }) => {
  const isClient = useIsClient()
  const router = useRouter()

  const hookForm = useForm<FormValues>({
    defaultValues: {
      projectId: '',
      userId: '',
      tags: [],
      from: formatISOLocale(new Date()),
      to: formatISOLocale(new Date()),
      dateRange: '',
    },
  })
  const { selectedOrganisationId } = useOrganisation()
  const { projectSuggestions } = useProjects()

  // Read projectId and projectName from URL search params on mount
  // Only show as inactive if project is not in active suggestions
  const inactiveProject = useMemo(() => {
    const projectIdFromUrl = router.query.projectId as string | undefined
    const projectNameFromUrl = router.query.projectName as string | undefined

    if (projectIdFromUrl && projectNameFromUrl) {
      const suggestions = projectSuggestions()
      const isProjectActive = suggestions.some((p) => p.id === projectIdFromUrl)

      if (!isProjectActive) {
        return { id: projectIdFromUrl, key: projectNameFromUrl }
      }
    }
    return null
  }, [router.query.projectId, router.query.projectName, projectSuggestions])

  useEffect(() => {
    const projectIdFromUrl = router.query.projectId as string | undefined
    if (projectIdFromUrl && hookForm.getValues('projectId') === '') {
      hookForm.setValue('projectId', projectIdFromUrl)
    }
  }, [router.query.projectId, hookForm])

  let response: {
    data?: ModelsBooking[]
    isValidating: any
    isLoading?: boolean
    error?: ErrorType<unknown> | undefined
    mutate?: KeyedMutator<ModelsBooking[]>
    swrKey?: string | false | Record<any, any>
  }

  const timespan = apiTimespanFromTo(hookForm.getValues('from'), hookForm.getValues('to'))

  switch (dataSource) {
    case 'userBookings':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      response = useGetUserBookingListByOrganisation(
        selectedOrganisationId,
        timespan || { from: '', to: '' },
      )
      break
    case 'organisationBookings':
    default:
      // eslint-disable-next-line react-hooks/rules-of-hooks
      response = useGetOrganisationBookingList(
        selectedOrganisationId,
        timespan || { from: '', to: '' },
      )
      break
  }

  const tags = hookForm.watch('tags')
  const projectId = hookForm.watch('projectId')
  const userId = hookForm.watch('userId')

  const processedItems = useMemo(() => {
    return getExtendedModelsBookingList(
      filterModelsBookingListUserId(
        filterModelsBookingListProjectId(
          filterModelsBookingListByTags(response.data || [], tags),
          projectId,
        ),
        userId,
      ),
    )
  }, [response.data, tags, projectId, userId])

  const summary = useMemo(() => {
    return getModelsBookingSummary(processedItems)
  }, [processedItems])

  // Calculate distinct users and projects
  const distinctUsers = useMemo(() => {
    const users = new Set(processedItems.map((item) => item.userReference?.key).filter(Boolean))
    return users.size
  }, [processedItems])

  const distinctProjects = useMemo(() => {
    const projects = new Set(
      processedItems.map((item) => item.projectReference?.key).filter(Boolean),
    )
    return projects.size
  }, [processedItems])

  const { onScroll, visibleElements } = useScrollPagination(processedItems)

  const allowEdit = dataSource === 'userBookings'
  const allowDelete = dataSource === 'userBookings'
  const showUserColumn = dataSource === 'organisationBookings'
  const exportContext = dataSource === 'userBookings' ? 'user' : 'organisation'

  if (!isClient) return null

  return (
    <FormProvider {...hookForm}>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto" onScroll={onScroll}>
        <div className="bg-base-200 flex items-start justify-between p-4">
          <BookingHistoryStats
            hours={summary.hours}
            bookings={summary.elements}
            users={distinctUsers}
            projects={distinctProjects}
          />
          <BookingHistoryExport
            bookings={processedItems}
            context={exportContext}
            from={hookForm.getValues('from')}
            to={hookForm.getValues('to')}
          />
        </div>
        {!response.data && response.isValidating && <Loading />}
        <div className="pt-4">
          {response.data && (
            <BookingHistoryTable
              items={visibleElements}
              allowEdit={allowEdit}
              allowDelete={allowDelete}
              showUserColumn={showUserColumn}
            />
          )}
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <ColumnList>
          <BookingHistoryFilter inactiveProject={inactiveProject} dataSource={dataSource} />
        </ColumnList>
      </ScrollContainer>
    </FormProvider>
  )
}
