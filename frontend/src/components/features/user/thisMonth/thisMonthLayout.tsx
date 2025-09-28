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
import { BookingAddButton } from 'components/features/user/index/bookingAddButton'
import { ThisMonthStats } from 'components/features/user/thisMonth/thisMonthStats'
import { ColumnList } from 'components/primitives/layout/ColumnList'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Heading } from 'components/primitives/typography/Heading'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const ThisMonthLayout: React.FC = () => {
  const { t } = useTranslation('common')

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
          <BookingAddButton />
        </ColumnList>
      </ScrollContainer>
    </>
  )
}
