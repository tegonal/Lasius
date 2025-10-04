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
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { StatsGroup } from 'components/ui/data-display/StatsGroup'
import { StatsTileHours } from 'components/ui/data-display/StatsTileHours'
import { StatsTileNumber } from 'components/ui/data-display/StatsTileNumber'
import { StatsTilePercentage } from 'components/ui/data-display/StatsTilePercentage'
import { Tabs } from 'components/ui/navigation/Tabs'
import { endOfMonth, endOfWeek, getWeek, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { getExpectedVsBookedPercentage } from 'lib/api/functions/getExpectedVsBookedPercentage'
import { useGetBookingSummaryDay } from 'lib/api/hooks/useGetBookingSummaryDay'
import { useGetBookingSummaryMonth } from 'lib/api/hooks/useGetBookingSummaryMonth'
import { useGetBookingSummaryWeek } from 'lib/api/hooks/useGetbookingSummaryWeek'
import { useGetPlannedWorkingHoursMonth } from 'lib/api/hooks/useGetPlannedWorkingHoursMonth'
import { useGetUserStatsBySourceAndDay } from 'lib/api/hooks/useGetUserStatsBySourceAndDay'
import { useMonthlyWeekStreams } from 'lib/api/hooks/useMonthlyWeekStreams'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useWorkHealthMetrics } from 'lib/api/hooks/useWorkHealthMetrics'
import { formatISOLocale } from 'lib/utils/date/dates'
import { useTranslation } from 'next-i18next'
import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'
import { useSelectedDate } from 'stores/calendarStore'

const MonthStreamChart = dynamic(() => import('components/ui/charts/monthStreamChart'), {
  ssr: false,
})

const WeeklyTrendChart = dynamic(() => import('components/ui/charts/weeklyTrendChart'), {
  ssr: false,
})

export const ThisMonthStats: React.FC = () => {
  const { t } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const { selectedOrganisationId } = useOrganisation()

  const day = useGetBookingSummaryDay(selectedDate)
  const week = useGetBookingSummaryWeek(selectedDate)
  const month = useGetBookingSummaryMonth(selectedDate)
  const { plannedHoursMonth } = useGetPlannedWorkingHoursMonth(selectedDate)

  // Get work health metrics for burnout indicator and trend charts
  const { weeklyData: sixMonthData } = useWorkHealthMetrics(
    week.plannedWorkingHours,
    26,
    selectedDate,
  )

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
  const monthStart = formatISOLocale(startOfMonth(new Date(selectedDate)))
  const monthEnd = formatISOLocale(endOfMonth(new Date(selectedDate)))
  const datespan = apiDatespanFromTo(monthStart, monthEnd)
  const { data: projectStatsMonth } = useGetUserStatsBySourceAndDay(selectedOrganisationId, {
    source: 'project',
    from: datespan?.from || '',
    to: datespan?.to || '',
  })

  // Get project stats for the selected day
  const dayDatespan = apiDatespanFromTo(selectedDate, selectedDate)
  const { data: projectStatsDay } = useGetUserStatsBySourceAndDay(selectedOrganisationId, {
    source: 'project',
    from: dayDatespan?.from || '',
    to: dayDatespan?.to || '',
  })

  // Get project stats for the selected week
  const weekStartDate = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 })
  const weekEndDate = endOfWeek(new Date(selectedDate), { weekStartsOn: 1 })
  const weekDatespan = apiDatespanFromTo(
    formatISOLocale(weekStartDate),
    formatISOLocale(weekEndDate),
  )
  const { data: projectStatsWeek } = useGetUserStatsBySourceAndDay(selectedOrganisationId, {
    source: 'project',
    from: weekDatespan?.from || '',
    to: weekDatespan?.to || '',
  })

  // Get project stats for the last 6 months
  const sixMonthsStart = formatISOLocale(subMonths(new Date(selectedDate), 6))
  const sixMonthsEnd = formatISOLocale(new Date(selectedDate))
  const sixMonthsDatespan = apiDatespanFromTo(sixMonthsStart, sixMonthsEnd)
  const { data: projectStatsSixMonths } = useGetUserStatsBySourceAndDay(selectedOrganisationId, {
    source: 'project',
    from: sixMonthsDatespan?.from || '',
    to: sixMonthsDatespan?.to || '',
  })

  // Calculate all projects for the day
  const dayProjects = useMemo(() => {
    if (!projectStatsDay?.data) return []

    const projectHours: Record<string, number> = {}
    projectStatsDay.data.forEach((day) => {
      Object.entries(day).forEach(([key, value]) => {
        if (key !== 'category' && Array.isArray(value)) {
          const hours = value[0] as number
          if (hours > 0) {
            projectHours[key] = (projectHours[key] || 0) + hours
          }
        }
      })
    })

    const sorted = Object.entries(projectHours).sort(([, a], [, b]) => b - a)
    const total = sorted.reduce((sum, [, hours]) => sum + hours, 0)

    return sorted.map(([name, hours]) => ({
      name,
      hours,
      percentage: total > 0 ? (hours / total) * 100 : 0,
    }))
  }, [projectStatsDay])

  // Calculate top 5 projects for the week
  const weekTopProjects = useMemo(() => {
    if (!projectStatsWeek?.data) return []

    const projectHours: Record<string, number> = {}
    projectStatsWeek.data.forEach((day) => {
      Object.entries(day).forEach(([key, value]) => {
        if (key !== 'category' && Array.isArray(value)) {
          const hours = value[0] as number
          if (hours > 0) {
            projectHours[key] = (projectHours[key] || 0) + hours
          }
        }
      })
    })

    const sorted = Object.entries(projectHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    const total = sorted.reduce((sum, [, hours]) => sum + hours, 0)

    return sorted.map(([name, hours]) => ({
      name,
      hours,
      percentage: total > 0 ? (hours / total) * 100 : 0,
    }))
  }, [projectStatsWeek])

  // Calculate top 5 projects for the month
  const monthTopProjects = useMemo(() => {
    if (!projectStatsMonth?.data) return []

    // Aggregate all project hours across the month
    const projectHours: Record<string, number> = {}
    projectStatsMonth.data.forEach((day) => {
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
  }, [projectStatsMonth])

  // Calculate top 5 projects for 6 months
  const sixMonthsTopProjects = useMemo(() => {
    if (!projectStatsSixMonths?.data) return []

    // Aggregate all project hours across 6 months
    const projectHours: Record<string, number> = {}
    projectStatsSixMonths.data.forEach((day) => {
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
  }, [projectStatsSixMonths])

  // Calculate 6-month summary stats
  const sixMonthsStats = useMemo(() => {
    const totalHours = sixMonthData.reduce((sum, week) => sum + week.hours, 0)
    const totalExpected = sixMonthData.reduce((sum, week) => sum + week.plannedHours, 0)
    const { fulfilledPercentage } = getExpectedVsBookedPercentage(totalExpected, totalHours)

    // Calculate total bookings from project stats
    const totalBookings = projectStatsSixMonths?.data?.length || 0

    return {
      hours: totalHours,
      bookings: totalBookings,
      expectedHours: totalExpected,
      fulfilledPercentage,
    }
  }, [sixMonthData, projectStatsSixMonths])

  const tabs = [
    {
      label: t('common.time.day', { defaultValue: 'Day' }),
      component: (
        <>
          <Heading variant="section">
            <FormatDate date={selectedDateObj} format="fullDateShort" />
          </Heading>
          <div className="flex gap-4 pb-4">
            <div className="flex-1 space-y-3">
              <StatsGroup className="grid w-full grid-cols-2">
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
              </StatsGroup>
              <StatsGroup className="grid w-full grid-cols-2">
                <StatsTileHours
                  value={day.plannedWorkingHours}
                  label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
                  standalone={false}
                />
                <StatsTilePercentage
                  value={day.fulfilledPercentage}
                  label={t('statistics.percentOfPlannedHours', {
                    defaultValue: '% of planned hours',
                  })}
                  standalone={false}
                  period="day"
                />
              </StatsGroup>
            </div>

            {dayProjects.length > 0 ? (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="mt-2 space-y-2">
                      {dayProjects.map((project) => (
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
            ) : (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="text-base-content/60 py-8 text-center text-sm">
                      {t('statistics.noProjectsForDay', {
                        defaultValue: 'No projects for this day',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      label: t('common.time.week', { defaultValue: 'Week' }),
      component: (
        <>
          <Heading variant="section">
            {t('common.time.week', { defaultValue: 'Week' })} {weekNumber}
          </Heading>
          <div className="flex gap-4 pb-4">
            <div className="flex-1 space-y-3">
              <StatsGroup className="grid w-full grid-cols-2">
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
              </StatsGroup>
              <StatsGroup className="grid w-full grid-cols-2">
                <StatsTileHours
                  value={week.plannedWorkingHours}
                  label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
                  standalone={false}
                />
                <StatsTilePercentage
                  value={week.fulfilledPercentage}
                  label={t('statistics.percentOfPlannedHours', {
                    defaultValue: '% of planned hours',
                  })}
                  standalone={false}
                  period="week"
                />
              </StatsGroup>
            </div>

            {weekTopProjects.length > 0 ? (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      Top {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="mt-2 space-y-2">
                      {weekTopProjects.map((project) => (
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
            ) : (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      Top {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="text-base-content/60 py-8 text-center text-sm">
                      {t('statistics.noProjectsForWeek', {
                        defaultValue: 'No projects for this week',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ),
    },
    {
      label: t('common.time.month', { defaultValue: 'Month' }),
      component: (
        <>
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
                  label={t('statistics.percentOfPlannedHours', {
                    defaultValue: '% of planned hours',
                  })}
                  standalone={false}
                  period="month"
                />
              </StatsGroup>
            </div>

            {monthTopProjects.length > 0 && (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      Top {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="mt-2 space-y-2">
                      {monthTopProjects.map((project) => (
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
            {t('statistics.weeklyHoursDistribution', {
              defaultValue: 'Weekly Hours Distribution',
            })}
          </Heading>
          <div className="pb-4">
            <MonthStreamChart
              data={monthStreamChart.data}
              keys={monthStreamChart.keys}
              isLoading={monthStreamChart.isLoading}
            />
          </div>
        </>
      ),
    },
    {
      label: t('workHealth.sixMonths', { defaultValue: '6 Months' }),
      component: (
        <>
          <Heading variant="section">
            {t('workHealth.sixMonths', { defaultValue: '6 Months' })}
          </Heading>
          <div className="flex gap-4 pb-4">
            <div className="flex-1 space-y-3">
              <StatsGroup className="grid w-full grid-cols-2">
                <StatsTileNumber
                  value={sixMonthsStats.bookings}
                  label={t('bookings.title', { defaultValue: 'Bookings' })}
                  standalone={false}
                />
                <StatsTileHours
                  value={sixMonthsStats.hours}
                  label={t('common.time.hours', { defaultValue: 'Hours' })}
                  standalone={false}
                />
              </StatsGroup>
              <StatsGroup className="grid w-full grid-cols-2">
                <StatsTileHours
                  value={sixMonthsStats.expectedHours}
                  label={t('statistics.expectedHours', { defaultValue: 'Expected hours' })}
                  standalone={false}
                />
                <StatsTilePercentage
                  value={sixMonthsStats.fulfilledPercentage}
                  label={t('statistics.percentOfPlannedHours', {
                    defaultValue: '% of planned hours',
                  })}
                  standalone={false}
                />
              </StatsGroup>
            </div>

            {sixMonthsTopProjects.length > 0 ? (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      Top {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="mt-2 space-y-2">
                      {sixMonthsTopProjects.map((project) => (
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
            ) : (
              <div className="flex-1">
                <div className="stats h-fit w-full">
                  <div className="stat">
                    <div className="stat-title">
                      Top {t('projects.title', { defaultValue: 'Projects' })}
                    </div>
                    <div className="text-base-content/60 py-8 text-center text-sm">
                      {t('statistics.noProjectsForPeriod', {
                        defaultValue: 'No projects for this period',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Heading variant="section">
            {t('workHealth.sixMonthTrend', { defaultValue: '6-Month Work Trend' })}
          </Heading>
          <div className="pb-4">
            <WeeklyTrendChart weeklyData={sixMonthData} />
          </div>
        </>
      ),
    },
  ]

  return (
    <div className="w-full">
      <Tabs tabs={tabs} />
    </div>
  )
}
