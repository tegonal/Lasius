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

import { UpDownButton } from 'components/primitives/buttons/UpDownButton'
import { Input } from 'components/primitives/inputs/Input'
import { InputDatepickerContext } from 'components/ui/forms/input/datePicker/store/store'
import { useDateFieldInput } from 'components/ui/forms/input/datePicker/useDateFieldInput'
import { getDate } from 'date-fns'
import React, { useContext } from 'react'

export const DatePickerFieldDays: React.FC = () => {
  const { state, dispatch } = useContext(InputDatepickerContext)

  const { handleClickDown, handleClickUp, inputProps } = useDateFieldInput({
    incrementerValue: 1,
    setter: 'setDay',
    dispatch,
    defaultValue: getDate(state.date),
    digits: 2,
  })

  return (
    <div className="grid w-6 grid-rows-3 gap-0">
      <UpDownButton direction="up" onClick={handleClickUp} />
      <div>
        <Input
          {...inputProps}
          aria-label="Days"
          className="focus:bg-accent w-full p-px text-center focus:rounded-sm focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]"
        />
      </div>
      <UpDownButton direction="down" onClick={handleClickDown} />
    </div>
  )
}
