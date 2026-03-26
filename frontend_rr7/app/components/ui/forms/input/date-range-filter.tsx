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

/* eslint-disable react-compiler/react-compiler -- Form integration effects have intentionally partial deps */
import { type FieldMetadata, useInputControl } from '@conform-to/react'
import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { dateOptions } from '~/lib/utils/date/date-options'

export type DateRangeFilterProps = {
  fromField: FieldMetadata<string>
  rangeField: FieldMetadata<string>
  toField: FieldMetadata<string>
}

export const DateRangeFilter = ({
  fromField,
  rangeField,
  toField,
}: DateRangeFilterProps) => {
  const { t } = useTranslation('common')
  const fromControl = useInputControl(fromField)
  const toControl = useInputControl(toField)
  const rangeControl = useInputControl(rangeField)

  const selectOptions: SelectOption[] = useMemo(
    () =>
      dateOptions.map((option) => ({
        label: t(option.name as never),
        value: option.name,
      })),
    [t],
  )

  // Initialize with first date option
  useEffect(() => {
    const firstOption = dateOptions[0]
    if (!firstOption || fromControl.value) return
    const range = firstOption.dateRangeFn(new Date())
    fromControl.change(range.from)
    toControl.change(range.to)
    rangeControl.change(firstOption.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync range selector when from/to change
  useEffect(() => {
    if (!fromControl.value || !toControl.value) return

    const today = new Date()
    const option = dateOptions.find((opt) => {
      if (!opt.dateRangeFn) return true
      const dateRange = opt.dateRangeFn(today)
      return (
        dateRange.from === fromControl.value && dateRange.to === toControl.value
      )
    })

    if (option && rangeControl.value !== option.name) {
      rangeControl.change(option.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromControl.value, toControl.value])

  const handleRangeChange = (rangeName: string) => {
    rangeControl.change(rangeName)
    const option = dateOptions.find((opt) => opt.name === rangeName)
    if (!option?.dateRangeFn) return
    const { from, to } = option.dateRangeFn(new Date())
    fromControl.change(from)
    toControl.change(to)
  }

  return (
    <FormBody>
      <FormElement
        htmlFor={rangeField.id}
        label={t('time.timeRange', 'Time range')}
      >
        <input
          name={rangeField.name}
          type="hidden"
          value={rangeControl.value ?? ''}
        />
        <Select
          id={rangeField.id}
          onChange={handleRangeChange}
          options={selectOptions}
          placeholder={t('time.selectRange', 'Select time range')}
          value={rangeControl.value || dateOptions[0]?.name || ''}
        />
      </FormElement>
      <FormElement htmlFor={fromField.id} label={t('time.from', 'From')}>
        <InputDatePicker field={fromField} withDate />
      </FormElement>
      <FormElement htmlFor={toField.id} label={t('time.to', 'To')}>
        <InputDatePicker field={toField} withDate />
      </FormElement>
    </FormBody>
  )
}
