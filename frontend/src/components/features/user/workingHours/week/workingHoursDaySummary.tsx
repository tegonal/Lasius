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

import { FormatDate } from 'components/ui/data-display/FormatDate'
import { IsoDateString } from 'lib/api/apiDateHandling'
import React from 'react'
import { ModelsWorkingHoursWeekdays } from 'types/common'

type Props = {
  item: {
    day: ModelsWorkingHoursWeekdays
    date: IsoDateString
    value: IsoDateString
    displayValue: string
  }
}

export const WorkingHoursDaySummary: React.FC<Props> = ({ item }) => {
  return (
    <div className="text-center leading-normal">
      <div className="flex flex-col items-center justify-center gap-2">
        <div>
          <FormatDate date={item.date} format="dayNameShort" />
        </div>
        <div>{item.displayValue}</div>
      </div>
    </div>
  )
}
