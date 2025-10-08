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

import { StatsContent } from 'components/features/organisation/stats/statsContent'
import { StatsExport } from 'components/features/organisation/stats/statsExport'
import { StatsOverview } from 'components/features/organisation/stats/statsOverview'
import { ColumnList } from 'components/primitives/layout/ColumnList'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { StatsFilter } from 'components/ui/data-display/stats/statsFilter'
import { ErrorBoundary } from 'components/ui/feedback/ErrorBoundary'
import { useProjects } from 'lib/api/hooks/useProjects'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

type FormValues = {
  to: string
  from: string
  dateRange: string
}

export const StatsLayout: React.FC = () => {
  const router = useRouter()
  const { projectSuggestions } = useProjects()
  const hookForm = useForm<FormValues>({
    defaultValues: {
      from: formatISOLocale(new Date()),
      to: formatISOLocale(new Date()),
      dateRange: dateOptions[0].name,
    },
  })

  // Read projectId and projectName from URL search params
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

  return (
    <FormProvider {...hookForm}>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        {/* Top section with summary and export */}
        <div className="bg-base-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <StatsOverview />
            </div>
            <div className="flex-shrink-0">
              <StatsExport />
            </div>
          </div>
        </div>
        <div className="pt-4">
          <ErrorBoundary>
            <StatsContent />
          </ErrorBoundary>
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <ColumnList>
          <StatsFilter inactiveProject={inactiveProject} />
        </ColumnList>
      </ScrollContainer>
    </FormProvider>
  )
}
