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

import { isValid, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'

import { Loading } from '~/components/ui/data-display/loading'
import { ColumnList } from '~/components/ui/layouts/column-list'
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

type FormValues = {
	dateRange: string
	from: string
	projectId: string
	tags: ModelsTag[]
	to: string
	userId: string
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
	const dateFromUrl = searchParams.get('date')
	const initialDate = useMemo(() => {
		if (!dateFromUrl) return undefined
		const parsed = parseISO(dateFromUrl)
		return isValid(parsed) ? parsed : undefined
	}, [dateFromUrl])

	const projectSuggestions: ModelsEntityReference[] = useMemo(() => {
		if (projectsProp) return projectsProp
		return userProjects().map((p) => p.projectReference)
	}, [projectsProp, userProjects])

	const hookForm = useForm<FormValues>({
		defaultValues: {
			dateRange: '',
			from: formatISOLocale(new Date()),
			projectId: projectIdFromUrl,
			tags: [],
			to: formatISOLocale(new Date()),
			userId: '',
		},
	})

	// Sync form from/to to URL search params so the loader refetches
	const [, setSearchParams] = useSearchParams()
	const isInitialMount = useRef(true)

	useEffect(() => {
		const subscription = hookForm.watch((values, { name }) => {
			if (name !== 'from' && name !== 'to') return
			if (!values.from || !values.to) return

			// Skip the initial mount — the loader already has the right data
			if (isInitialMount.current) {
				isInitialMount.current = false
				return
			}

			setSearchParams(
				(prev) => {
					prev.set('from', values.from as string)
					prev.set('to', values.to as string)
					prev.delete('date')
					return prev
				},
				{ replace: true },
			)
		})
		return () => subscription.unsubscribe()
	}, [hookForm, setSearchParams])

	const tags = hookForm.watch('tags')
	const projectId = hookForm.watch('projectId')
	const userId = hookForm.watch('userId')

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

	// Check if the project from URL is inactive (not in active suggestions)
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
		<FormProvider {...hookForm}>
			<ContextMenuProvider>
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
							from={hookForm.watch('from')}
							to={hookForm.watch('to')}
						/>
					</div>
					{!bookings.length && isLoading && <Loading />}
					<ScrollArea className="min-h-0 flex-1" onScroll={onScroll}>
						<div className="pt-4">
							<BookingHistoryTable
								allowDelete={allowDelete}
								allowEdit={allowEdit}
								items={visibleElements}
								showUserColumn={showUserColumn}
							/>
						</div>
					</ScrollArea>
				</div>
				<ScrollArea className="h-full rounded-tr-lg">
					<ColumnList>
						<BookingHistoryFilter
							dataSource={dataSource}
							inactiveProject={inactiveProject}
							initialDate={initialDate}
							projects={projectSuggestions}
							users={users}
						/>
					</ColumnList>
				</ScrollArea>
			</ContextMenuProvider>
		</FormProvider>
	)
}
