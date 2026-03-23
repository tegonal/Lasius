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

import { subDays } from 'date-fns'
import { useEffect, useMemo, useRef } from 'react'

import { formatISOLocale } from '~/lib/utils/dates'
import { useGetUserBookingListByOrganisation } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'
import { useGetUserProfile } from '~/services/api/lasius-hooks/user/user'

/**
 * Shared hook for loading booking form data (projects + project tags) via useApiProxy hooks.
 *
 * Used by BookingStart, BookingEditRunning, and BookingAddUpdateForm.
 */
export function useBookingFormData(
  selectedOrgId: string,
  watchedProjectId: string,
) {
  const prevOrgIdRef = useRef('')
  const prevProjectKeyRef = useRef('')

  const profileHook = useGetUserProfile()
  const recentBookingsHook = useGetUserBookingListByOrganisation()
  const projectTagsHook = useGetTagsByProject()

  // Load user profile and recent bookings for the selected org
  useEffect(() => {
    if (selectedOrgId && selectedOrgId !== prevOrgIdRef.current) {
      prevOrgIdRef.current = selectedOrgId
      profileHook.submit()

      const now = new Date()
      const sevenDaysAgo = subDays(now, 7)
      recentBookingsHook.submit({
        orgId: selectedOrgId,
        params: {
          from: formatISOLocale(sevenDaysAgo),
          to: formatISOLocale(now),
        },
      })
    }
  }, [selectedOrgId, profileHook, recentBookingsHook])

  // Load tags for the selected project
  useEffect(() => {
    const key = `${selectedOrgId}:${watchedProjectId}`
    if (
      selectedOrgId &&
      watchedProjectId &&
      key !== prevProjectKeyRef.current
    ) {
      prevProjectKeyRef.current = key
      projectTagsHook.submit({
        orgId: selectedOrgId,
        projectId: watchedProjectId,
      })
    }
  }, [selectedOrgId, watchedProjectId, projectTagsHook])

  // Extract projects for the selected org from the user profile, sorted by key
  const projects = useMemo(() => {
    if (!profileHook.data) return []
    const selectedOrg = profileHook.data.organisations?.find(
      (o) => o.organisationReference.id === selectedOrgId,
    )
    return (selectedOrg?.projects ?? [])
      .map((p) => p.projectReference)
      .slice()
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [profileHook.data, selectedOrgId])

  const recentBookings = recentBookingsHook.data ?? []
  const projectTags = projectTagsHook.data ?? []
  const isLoading = profileHook.isLoading

  return { isLoading, projects, projectTags, recentBookings }
}
