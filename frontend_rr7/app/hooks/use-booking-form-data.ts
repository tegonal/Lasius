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

import { useEffect, useRef } from 'react'
import { useFetcher } from 'react-router'

import {
	type ModelsBooking,
	type ModelsEntityReference,
	type ModelsTag,
} from '~/services/api/lasius'

type FormDataResponse = {
	projects: ModelsEntityReference[]
	recentBookings?: ModelsBooking[]
	tags?: ModelsTag[]
}

type ProjectTagsResponse = {
	projectTags?: ModelsTag[]
	tags?: ModelsTag[]
}

/**
 * Shared hook for loading booking form data (projects + project tags) via fetcher.
 *
 * Used by BookingStart, BookingEditRunning, and BookingAddUpdateForm.
 */
export function useBookingFormData(
	selectedOrgId: string,
	watchedProjectId: string,
) {
	const formDataFetcher = useFetcher<FormDataResponse>()
	const projectTagsFetcher = useFetcher<ProjectTagsResponse>()
	const prevOrgIdRef = useRef('')
	const prevProjectKeyRef = useRef('')

	// Load projects for the selected org
	useEffect(() => {
		if (selectedOrgId && selectedOrgId !== prevOrgIdRef.current) {
			prevOrgIdRef.current = selectedOrgId
			void formDataFetcher.load(`/api/booking-form-data?orgId=${selectedOrgId}`)
		}
	}, [selectedOrgId, formDataFetcher])

	// Load tags for the selected project
	useEffect(() => {
		const key = `${selectedOrgId}:${watchedProjectId}`
		if (
			selectedOrgId &&
			watchedProjectId &&
			key !== prevProjectKeyRef.current
		) {
			prevProjectKeyRef.current = key
			void projectTagsFetcher.load(
				`/api/booking-form-data?orgId=${selectedOrgId}&projectId=${watchedProjectId}`,
			)
		}
	}, [selectedOrgId, watchedProjectId, projectTagsFetcher])

	const projects = formDataFetcher.data?.projects ?? []
	const recentBookings = formDataFetcher.data?.recentBookings ?? []
	const projectTags =
		projectTagsFetcher.data?.projectTags ?? projectTagsFetcher.data?.tags ?? []
	const isLoading = formDataFetcher.state !== 'idle'

	return { isLoading, projects, projectTags, recentBookings }
}
