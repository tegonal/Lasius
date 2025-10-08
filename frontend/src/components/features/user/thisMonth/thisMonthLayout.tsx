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

import { CalendarMonthCompact } from 'components/features/calendar/calendarMonthCompact'
import { WorkLoadIndicator } from 'components/features/user/index/workLoadIndicator'
import { ThisMonthStats } from 'components/features/user/thisMonth/thisMonthStats'
import { Divider } from 'components/primitives/divider/Divider'
import { ColumnList } from 'components/primitives/layout/ColumnList'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Heading } from 'components/primitives/typography/Heading'
import { useGetBookingSummaryWeek } from 'lib/api/hooks/useGetbookingSummaryWeek'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useSelectedDate } from 'stores/calendarStore'

export const ThisMonthLayout: React.FC = () => {
  const { t } = useTranslation('common')
  const selectedDate = useSelectedDate()
  const week = useGetBookingSummaryWeek(selectedDate)

  // Pass selectedDate to ensure burnout indicator updates with calendar selection

  return (
    <>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <ThisMonthStats />
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <ColumnList>
          <Heading variant="section">{t('calendar.title', { defaultValue: 'Calendar' })}</Heading>
          <CalendarMonthCompact />
          <Divider />
          <WorkLoadIndicator
            plannedWeeklyHours={week.plannedWorkingHours}
            referenceDate={selectedDate}
          />
        </ColumnList>
      </ScrollContainer>
    </>
  )
}
