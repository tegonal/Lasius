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

import { Button } from 'components/primitives/buttons/Button'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { DatePickerCalendar } from 'components/ui/forms/input/datePicker/datePickerCalendar'
import { DatePickerFieldHours } from 'components/ui/forms/input/datePicker/datePickerFieldHours'
import { DatePickerFieldMinutes } from 'components/ui/forms/input/datePicker/datePickerFieldMinutes'
import { DatePickerFieldSeparator } from 'components/ui/forms/input/datePicker/datePickerFieldSeparator'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { IsoDateString } from 'lib/api/apiDateHandling'
import { LucideIcon as LucideIconType } from 'lucide-react'
import React from 'react'
import { useFormContext } from 'react-hook-form'

export type InputDatePickerComponentProps = {
  name: string
  rules?: { validate: Record<string, (value: string) => boolean> }
  label?: string
  withDate?: boolean
  withTime?: boolean
  presetDate?: IsoDateString
  presetLabel?: string
  presetIcon?: LucideIconType
}

export const InputDatePickerComponent: React.FC<InputDatePickerComponentProps> = ({
  name,
  label,
  withDate = true,
  withTime = true,
  presetDate,
  presetLabel,
  presetIcon: PresetIcon,
}) => {
  const parentFormContext = useFormContext()
  if (!parentFormContext) return null

  const hasPreset = presetDate && presetLabel && PresetIcon

  const onPresetClick = () => {
    parentFormContext.setValue(name, presetDate)
  }

  return (
    <>
      <div className="flex w-full flex-col items-start justify-between gap-1 pt-1 select-none sm:flex-row sm:items-center sm:gap-2 sm:pt-0">
        {(label || hasPreset) && (
          <div className="flex-shrink-0">
            {label && <div>{label}</div>}
            {hasPreset && PresetIcon && (
              <div className="flex items-center gap-2">
                <ToolTip toolTipContent={presetLabel}>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={onPresetClick}
                    fullWidth={false}
                    shape="circle"
                    aria-label={presetLabel}>
                    <LucideIcon icon={PresetIcon} size={20} />
                  </Button>
                </ToolTip>
              </div>
            )}
          </div>
        )}
        <div className="bg-base-300 text-base-content relative flex w-full justify-center gap-4 rounded px-3 py-1 sm:w-fit sm:justify-end">
          {withDate && <DatePickerCalendar />}
          {withTime && (
            <div className="flex items-center justify-start gap-0">
              <DatePickerFieldHours />
              <DatePickerFieldSeparator separator=":" />
              <DatePickerFieldMinutes />
            </div>
          )}
        </div>
      </div>
      <FormErrorBadge error={parentFormContext.formState.errors[name]} />
    </>
  )
}
