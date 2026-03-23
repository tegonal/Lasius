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

type BookingFormData = {
  favorites: unknown
  orgBookings: ModelsBooking[]
  projects: ModelsEntityReference[]
  projectTags: ModelsTag[]
  recentBookings: ModelsBooking[]
}

/**
 * Shared hook for loading booking form data via the /api/booking-form-data resource route.
 * Server-side aggregation: 1 round-trip fetches profile, favorites, recent bookings, org bookings.
 *
 * Used by BookingStart, BookingEditRunning, and BookingAddUpdateForm.
 */
export function useBookingFormData(
  selectedOrgId: string,
  watchedProjectId: string,
) {
  const prevOrgIdRef = useRef('')
  const prevProjectKeyRef = useRef('')

  const formDataFetcher = useFetcher<BookingFormData>()
  const formDataLoad = formDataFetcher.load

  const projectTagsFetcher = useFetcher<BookingFormData>()
  const projectTagsLoad = projectTagsFetcher.load

  // Load form data (projects, recent bookings, etc.) for the selected org
  useEffect(() => {
    if (selectedOrgId && selectedOrgId !== prevOrgIdRef.current) {
      prevOrgIdRef.current = selectedOrgId
      void formDataLoad(`/api/booking-form-data?orgId=${selectedOrgId}`)
    }
  }, [selectedOrgId, formDataLoad])

  // Load tags for the selected project
  useEffect(() => {
    const key = `${selectedOrgId}:${watchedProjectId}`
    if (
      selectedOrgId &&
      watchedProjectId &&
      key !== prevProjectKeyRef.current
    ) {
      prevProjectKeyRef.current = key
      void projectTagsLoad(
        `/api/booking-form-data?orgId=${selectedOrgId}&projectId=${watchedProjectId}`,
      )
    }
  }, [selectedOrgId, watchedProjectId, projectTagsLoad])

  const projects = formDataFetcher.data?.projects ?? []
  const recentBookings = formDataFetcher.data?.recentBookings ?? []
  const projectTags = projectTagsFetcher.data?.projectTags ?? []
  const isLoading = formDataFetcher.state !== 'idle'

  return { isLoading, projects, projectTags, recentBookings }
}
