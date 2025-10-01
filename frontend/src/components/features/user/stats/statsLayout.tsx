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

import { StatsExport } from 'components/features/user/stats/statsExport'
import { StatsOverview } from 'components/features/user/stats/statsOverview'
import { ColumnList } from 'components/primitives/layout/ColumnList'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { StatsFilter } from 'components/ui/data-display/stats/statsFilter'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { formatISOLocale } from 'lib/utils/date/dates'
import dynamic from 'next/dynamic'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'

type FormValues = {
  to: string
  from: string
  dateRange: string
}

export const StatsLayout: React.FC = () => {
  const hookForm = useForm<FormValues>({
    defaultValues: {
      from: formatISOLocale(new Date()),
      to: formatISOLocale(new Date()),
      dateRange: dateOptions[0].name,
    },
  })

  const StatsContent = dynamic<any>(() => import('./statsContent').then((mod) => mod.StatsContent))

  return (
    <FormProvider {...hookForm}>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <div className="bg-base-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <StatsOverview />
            <StatsExport />
          </div>
        </div>
        <div className="pt-4">
          <StatsContent />
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <ColumnList>
          <StatsFilter />
        </ColumnList>
      </ScrollContainer>
    </FormProvider>
  )
}
