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

import { StatsOverviewGrid } from 'components/features/user/thisMonth/StatsOverviewGrid'
import { TopProjectsCard } from 'components/features/user/thisMonth/TopProjectsCard'
import { Heading } from 'components/primitives/typography/Heading'
import { FormatDate } from 'components/ui/data-display/FormatDate'
import { ToggleSwitch } from 'components/ui/forms/input/ToggleSwitch'
import { Tabs } from 'components/ui/navigation/Tabs'
import {
  differenceInWeeks,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getWeek,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from 'date-fns'
import { apiDatespanFromTo } from 'lib/api/apiDateHandling'
import { aggregateProjectHours } from 'lib/api/functions/aggregateProjectHours'
import { getExpectedVsBookedPercentage } from 'lib/api/functions/getExpectedVsBookedPercentage'
import { getModelsBookingSummary } from 'lib/api/functions/getModelsBookingSummary'
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
import React, { useMemo, useState } from 'react'
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
  const { weeklyData: sixMonthData, bookings: sixMonthsBookings } = useWorkHealthMetrics(
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

  // Year tab state and computed params
  const [isCalendarYear, setIsCalendarYear] = useState(false)

  const yearParams = useMemo(() => {
    const dateObj = new Date(selectedDate)
    const today = new Date()
    if (isCalendarYear) {
      const start = startOfYear(dateObj)
      const end = endOfYear(dateObj) > today ? today : endOfYear(dateObj)
      const weeks = differenceInWeeks(end, start) + 1
      return {
        weeksToAnalyze: weeks,
        referenceDate: formatISOLocale(end),
        start: formatISOLocale(start),
        end: formatISOLocale(end),
      }
    }
    return {
      weeksToAnalyze: 52,
      referenceDate: selectedDate,
      start: formatISOLocale(subMonths(dateObj, 12)),
      end: formatISOLocale(dateObj),
    }
  }, [isCalendarYear, selectedDate])

  const { weeklyData: yearData, bookings: yearBookings } = useWorkHealthMetrics(
    week.plannedWorkingHours,
    yearParams.weeksToAnalyze,
    yearParams.referenceDate,
  )

  const yearDatespan = apiDatespanFromTo(yearParams.start, yearParams.end)
  const { data: projectStatsYear } = useGetUserStatsBySourceAndDay(selectedOrganisationId, {
    source: 'project',
    from: yearDatespan?.from || '',
    to: yearDatespan?.to || '',
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

  const dayProjects = useMemo(() => aggregateProjectHours(projectStatsDay?.data), [projectStatsDay])
  const weekTopProjects = useMemo(
    () => aggregateProjectHours(projectStatsWeek?.data, 5),
    [projectStatsWeek],
  )
  const monthTopProjects = useMemo(
    () => aggregateProjectHours(projectStatsMonth?.data, 5),
    [projectStatsMonth],
  )
  const sixMonthsTopProjects = useMemo(
    () => aggregateProjectHours(projectStatsSixMonths?.data, 5),
    [projectStatsSixMonths],
  )

  // Calculate 6-month summary stats
  const sixMonthsStats = useMemo(() => {
    const totalHours = sixMonthData.reduce((sum, week) => sum + week.hours, 0)
    const totalExpected = sixMonthData.reduce((sum, week) => sum + week.plannedHours, 0)
    const { fulfilledPercentage } = getExpectedVsBookedPercentage(totalExpected, totalHours)

    // Get booking count from actual booking list (same as day/week/month)
    const bookingSummary = getModelsBookingSummary(sixMonthsBookings || [])

    return {
      hours: totalHours,
      bookings: bookingSummary.elements,
      expectedHours: totalExpected,
      fulfilledPercentage,
    }
  }, [sixMonthData, sixMonthsBookings])

  // Calculate year summary stats
  const yearStats = useMemo(() => {
    const totalHours = yearData.reduce((sum, week) => sum + week.hours, 0)
    const totalExpected = yearData.reduce((sum, week) => sum + week.plannedHours, 0)
    const { fulfilledPercentage } = getExpectedVsBookedPercentage(totalExpected, totalHours)
    const bookingSummary = getModelsBookingSummary(yearBookings || [])

    return {
      hours: totalHours,
      bookings: bookingSummary.elements,
      expectedHours: totalExpected,
      fulfilledPercentage,
    }
  }, [yearData, yearBookings])

  const yearTopProjects = useMemo(
    () => aggregateProjectHours(projectStatsYear?.data, 5),
    [projectStatsYear],
  )

  const tabs = [
    {
      label: t('common.time.day', { defaultValue: 'Day' }),
      component: (
        <>
          <Heading variant="section">
            <FormatDate date={selectedDateObj} format="fullDateShort" />
          </Heading>
          <div className="flex gap-4 pb-4">
            <StatsOverviewGrid
              bookings={day.elements}
              hours={day.hours}
              expectedHours={day.plannedWorkingHours}
              fulfilledPercentage={day.fulfilledPercentage}
              period="day"
            />
            <TopProjectsCard
              projects={dayProjects}
              showTopPrefix={false}
              emptyMessage={t('statistics.noProjectsForDay', {
                defaultValue: 'No projects for this day',
              })}
            />
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
            <StatsOverviewGrid
              bookings={week.elements}
              hours={week.hours}
              expectedHours={week.plannedWorkingHours}
              fulfilledPercentage={week.fulfilledPercentage}
              period="week"
            />
            <TopProjectsCard
              projects={weekTopProjects}
              emptyMessage={t('statistics.noProjectsForWeek', {
                defaultValue: 'No projects for this week',
              })}
            />
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
            <StatsOverviewGrid
              bookings={month.elements}
              hours={month.hours}
              expectedHours={plannedHoursMonth}
              fulfilledPercentage={monthPercentage}
              period="month"
            />
            <TopProjectsCard
              projects={monthTopProjects}
              emptyMessage={t('statistics.noProjectsForMonth', {
                defaultValue: 'No projects for this month',
              })}
            />
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
            <StatsOverviewGrid
              bookings={sixMonthsStats.bookings}
              hours={sixMonthsStats.hours}
              expectedHours={sixMonthsStats.expectedHours}
              fulfilledPercentage={sixMonthsStats.fulfilledPercentage}
            />
            <TopProjectsCard
              projects={sixMonthsTopProjects}
              emptyMessage={t('statistics.noProjectsForPeriod', {
                defaultValue: 'No projects for this period',
              })}
            />
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
    {
      label: t('common.time.year', { defaultValue: 'Year' }),
      component: (
        <>
          <Heading variant="section">
            {isCalendarYear ? (
              <FormatDate date={selectedDateObj} format="year" />
            ) : (
              t('statistics.rolling12Months', { defaultValue: 'Rolling 12 Months' })
            )}
          </Heading>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-base-content/60">
              {t('statistics.calendarYear', { defaultValue: 'Calendar year' })}
            </span>
            <ToggleSwitch checked={isCalendarYear} onChange={setIsCalendarYear} size="sm" />
          </label>
          <div className="flex gap-4 pb-4">
            <StatsOverviewGrid
              bookings={yearStats.bookings}
              hours={yearStats.hours}
              expectedHours={yearStats.expectedHours}
              fulfilledPercentage={yearStats.fulfilledPercentage}
            />
            <TopProjectsCard
              projects={yearTopProjects}
              emptyMessage={t('statistics.noProjectsForPeriod', {
                defaultValue: 'No projects for this period',
              })}
            />
          </div>

          <Heading variant="section">
            {t('statistics.yearlyWorkTrend', { defaultValue: 'Yearly Work Trend' })}
          </Heading>
          <div className="pb-4">
            <WeeklyTrendChart weeklyData={yearData} tickEvery={4} />
          </div>
        </>
      ),
    },
  ]

  return (
    <div className="w-full">
      <Tabs tabs={tabs} defaultIndex={2} />
    </div>
  )
}
