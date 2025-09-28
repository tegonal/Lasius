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

import { dateToObj } from 'components/ui/forms/input/datePicker/store/dateToObj'
import { Store } from 'components/ui/forms/input/datePicker/store/store'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { FieldValues, UseFormReturn } from 'react-hook-form'

export type initializerType = {
  initialDate: IsoDateString
  name: string
  parentFormContext: UseFormReturn<FieldValues, any>
}

export const datePickerCreateInitialState = ({
  initialDate,
  parentFormContext,
  name,
}: initializerType): Store => {
  const date = new Date(initialDate)
  return {
    ...dateToObj(date),
    initialDate,
    date: new Date(initialDate),
    isoString: initialDate,
    parentFormContext,
    name,
  }
}
