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

import { type FieldMetadata } from '@conform-to/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FieldSet } from '~/components/ui/forms/field-set'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { InputDatePickerDuration } from '~/components/ui/forms/input/date-picker/input-date-picker-duration'
import { LongDurationWarning } from '~/features/bookings/components/long-duration-warning'
import { type useBookingTimeFields } from '~/features/bookings/hooks/use-booking-time-fields'

interface BookingTimeFieldSetProperties {
  endField: FieldMetadata<string>
  startField: FieldMetadata<string>
  time: ReturnType<typeof useBookingTimeFields>
}

export const BookingTimeFieldSet = ({
  endField,
  startField,
  time,
}: BookingTimeFieldSetProperties) => {
  const { t } = useTranslation('common')
  const [startResetButton, setStartResetButton] = useState<React.ReactNode>(null)
  const [endResetButton, setEndResetButton] = useState<React.ReactNode>(null)

  return (
    <>
      <FieldSet className="flex items-start gap-4">
        <div className="flex-grow space-y-4 pb-6">
          <FormElement
            htmlFor={startField.id}
            label={t('time.starts', 'Starts')}
            labelActionSlot={startResetButton}>
            <InputDatePicker
              field={startField}
              onChange={time.changeStart}
              onRenderLabelAction={setStartResetButton}
              value={time.start}
              {...time.presetStart}
            />
          </FormElement>
          <FormElement
            htmlFor={endField.id}
            label={t('time.ends', 'Ends')}
            labelActionSlot={endResetButton}>
            <InputDatePicker
              field={endField}
              onChange={time.changeEnd}
              onRenderLabelAction={setEndResetButton}
              value={time.end}
              {...time.presetEnd}
            />
          </FormElement>
        </div>
        <div className="flex w-28 flex-col items-center pt-8">
          <InputDatePickerDuration
            endValue={time.end}
            onEndChange={time.handleEndChange}
            startValue={time.start}
          />
        </div>
      </FieldSet>

      {time.isShowDurationWarning && <LongDurationWarning />}
    </>
  )
}
