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

import { Heading } from 'components/primitives/typography/Heading'
import { MonthStreamChart } from 'components/ui/charts/monthStreamChart'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileHours } from 'components/ui/data-display/StatsTileHours'
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { StatsTilePercentage } from 'components/ui/data-display/StatsTilePercentage'
import { endOfMonth, getWeek, startOfMonth } from 'date-fns'
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { getExpectedVsBookedPercentage } from 'lib/api/functions/getExpectedVsBookedPercentage'
import { useGetBookingSummaryDay } from 'lib/api/hooks/useGetBookingSummaryDay'
import { useGetBookingSummaryMonth } from 'lib/api/hooks/useGetBookingSummaryMonth'
import { useGetBookingSummaryWeek } from 'lib/api/hooks/useGetbookingSummaryWeek'
import { useGetPlannedWorkingHoursMonth } from 'lib/api/hooks/useGetPlannedWorkingHoursMonth'
import { useGetUserStatsBySourceAndDay } from 'lib/api/hooks/useGetUserStatsBySourceAndDay'
import { useMonthlyWeekStreams } from 'lib/api/hooks/useMonthlyWeekStreams'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useSelectedDate } from 'stores/calendarStore'

export const ThisMonthStats: React.FC = () => {
  const { t } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const { selectedOrganisationId } = useOrganisation()

  const day = useGetBookingSummaryDay(selectedDate)
  const week = useGetBookingSummaryWeek(selectedDate)
  const month = useGetBookingSummaryMonth(selectedDate)
  const { plannedHoursMonth } = useGetPlannedWorkingHoursMonth(selectedDate)

  const selectedDateObj = new Date(selectedDate)
  const weekNumber = getWeek(selectedDateObj, { weekStartsOn: 1 })

  // Calculate percentage for month
  const { fulfilledPercentage: monthPercentage } = getExpectedVsBookedPercentage(
    plannedHoursMonth,
    month.hours,
  )

  // Get monthly stream data for visualization
  const monthStreamChart = useMonthlyWeekStreams(selectedDate)

  // Get project stats for the selected month
  const monthStart = formatISOLocale(startOfMonth(selectedDateObj))
  const monthEnd = formatISOLocale(endOfMonth(selectedDateObj))
  const datespan = apiDatespanFromTo(monthStart, monthEnd)
  const { data: projectStats } = useGetUserStatsBySourceAndDay(selectedOrganisationId, {
    source: 'project',
    from: datespan?.from || '',
    to: datespan?.to || '',
  })

  // Calculate top 5 projects for the month
  const topProjects = useMemo(() => {
    if (!projectStats?.data) return []

    // Aggregate all project hours across the month
    const projectHours: Record<string, number> = {}
    projectStats.data.forEach((day) => {
      Object.entries(day).forEach(([key, value]) => {
        if (key !== 'category' && Array.isArray(value)) {
          const hours = value[0] as number
          if (hours > 0) {
            projectHours[key] = (projectHours[key] || 0) + hours
          }
        }
      })
    })

    // Sort and take top 5
    const sorted = Object.entries(projectHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    // Calculate total for percentages
    const total = sorted.reduce((sum, [, hours]) => sum + hours, 0)

    return sorted.map(([name, hours]) => ({
      name,
      hours,
      percentage: total > 0 ? (hours / total) * 100 : 0,
    }))
  }, [projectStats])

  return (
    <div className="w-full">
      <Heading variant="section">
        <FormatDate date={selectedDateObj} format="monthNameLong" />{' '}
        <FormatDate date={selectedDateObj} format="year" />
      </Heading>
      <div className="flex gap-4 pb-4">
        <div className="flex-1 space-y-3">
          <StatsGroup className="grid w-full grid-cols-2">
            <StatsTileNumber
              value={month.elements}
              label={t('bookings.title', { defaultValue: 'Bookings' })}
              standalone={false}
            />
            <StatsTileHours
              value={month.hours}
              label={t('common.time.hours', { defaultValue: 'Hours' })}
              standalone={false}
            />
          </StatsGroup>
          <StatsGroup className="grid w-full grid-cols-2">
            <StatsTileHours
              value={plannedHoursMonth}
              label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
              standalone={false}
            />
            <StatsTilePercentage
              value={monthPercentage}
              label={t('statistics.percentOfPlannedHours', { defaultValue: '% of planned hours' })}
              standalone={false}
              period="month"
            />
          </StatsGroup>
        </div>

        {topProjects.length > 0 && (
          <div className="flex-1">
            <div className="stats h-fit w-full">
              <div className="stat">
                <div className="stat-title">
                  Top {t('projects.title', { defaultValue: 'Projects' })}
                </div>
                <div className="mt-2 space-y-2">
                  {topProjects.map((project) => (
                    <div key={project.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex-1 truncate font-medium">{project.name}</span>
                        <span className="text-base-content/60 ml-2 text-xs">
                          {project.hours.toFixed(1)}h
                        </span>
                      </div>
                      <progress
                        className="progress progress-primary h-2"
                        value={project.percentage}
                        max="100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Heading variant="section">
        {t('statistics.weeklyHoursDistribution', { defaultValue: 'Weekly Hours Distribution' })}
      </Heading>
      <div className="pb-4">
        <MonthStreamChart
          data={monthStreamChart.data}
          keys={monthStreamChart.keys}
          isLoading={monthStreamChart.isLoading}
        />
      </div>

      <Heading variant="section">
        {t('common.time.week', { defaultValue: 'Week' })} {weekNumber}
      </Heading>
      <StatsGroup className="grid w-full grid-cols-2 pb-4 md:grid-cols-4">
        <StatsTileNumber
          value={week.elements}
          label={t('bookings.title', { defaultValue: 'Bookings' })}
          standalone={false}
        />
        <StatsTileHours
          value={week.hours}
          label={t('common.time.hours', { defaultValue: 'Hours' })}
          standalone={false}
        />
        <StatsTileHours
          value={week.plannedWorkingHours}
          label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
          standalone={false}
        />
        <StatsTilePercentage
          value={week.fulfilledPercentage}
          label={t('statistics.percentOfPlannedHours', { defaultValue: '% of planned hours' })}
          standalone={false}
          period="week"
        />
      </StatsGroup>

      <Heading variant="section">
        <FormatDate date={selectedDateObj} format="fullDateShort" />
      </Heading>
      <StatsGroup className="grid w-full grid-cols-2 pb-4 md:grid-cols-4">
        <StatsTileNumber
          value={day.elements}
          label={t('bookings.title', { defaultValue: 'Bookings' })}
          standalone={false}
        />
        <StatsTileHours
          value={day.hours}
          label={t('common.time.hours', { defaultValue: 'Hours' })}
          standalone={false}
        />
        <StatsTileHours
          value={day.plannedWorkingHours}
          label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
          standalone={false}
        />
        <StatsTilePercentage
          value={day.fulfilledPercentage}
          label={t('statistics.percentOfPlannedHours', { defaultValue: '% of planned hours' })}
          standalone={false}
          period="day"
        />
      </StatsGroup>
    </div>
  )
}
