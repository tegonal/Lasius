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

import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { InputDatePicker } from 'components/ui/forms/input/datePicker/InputDatePicker'
import { Select, SelectOption } from 'components/ui/forms/input/Select'
import { isAfter, isBefore } from 'date-fns'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

type Props = {
  name: string
}

export const DateRangeFilter: React.FC<Props> = ({ name: rangeFieldName }) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()

  // Convert dateOptions to SelectOption format
  const selectOptions: SelectOption[] = useMemo(
    () =>
      dateOptions.map((option) => ({
        value: option.name,
        label: t(option.name as any),
      })),
    [t],
  )

  const resetForm = () => {
    const { from, to } = dateOptions[0].dateRangeFn(new Date())
    parentFormContext.setValue('from', from)
    parentFormContext.setValue('to', to)

    parentFormContext.register('from', {
      validate: {
        fromBeforeTo: (v) => isBefore(new Date(v), new Date(parentFormContext.getValues('to'))),
      },
    })

    parentFormContext.register('to', {
      validate: {
        toAfterFrom: (v) => isAfter(new Date(v), new Date(parentFormContext.getValues('from'))),
      },
    })
    parentFormContext.trigger()
  }

  useEffect(() => {
    resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const watchFrom = parentFormContext.watch('from')
  const watchTo = parentFormContext.watch('to')

  useEffect(() => {
    if (!watchFrom || !watchTo) return
    const from = watchFrom
    const to = watchTo

    // check matching dateRange
    const today = new Date()
    const option = dateOptions.find((option) => {
      if (!option.dateRangeFn) {
        return true
      }
      const dateRange = option.dateRangeFn(today)
      return dateRange.from === from && dateRange.to === to
    })

    // Update the form value if we found a matching option
    if (option) {
      const currentRange = parentFormContext.getValues(rangeFieldName)
      if (currentRange !== option.name) {
        parentFormContext.setValue(rangeFieldName, option.name)
      }
    }
  }, [watchFrom, watchTo, parentFormContext, rangeFieldName])

  useEffect(() => {
    if (!parentFormContext) return () => null
    const subscription = parentFormContext.watch((value, { name: fieldname }) => {
      switch (fieldname) {
        case rangeFieldName:
          if (value[rangeFieldName]) {
            const option = dateOptions.find((option) => option.name === value[rangeFieldName])
            if (!option || !option.dateRangeFn) return
            const { from, to } = option.dateRangeFn(new Date())
            parentFormContext.setValue('from', from)
            parentFormContext.setValue('to', to)
            parentFormContext.trigger()
          }
          break
        case 'from':
        case 'to':
          parentFormContext.trigger()
          break
        default:
          break
      }
    })
    return () => subscription.unsubscribe()
  }, [parentFormContext, rangeFieldName])

  return (
    <FormBody>
      <FormElement
        label={t('common.time.timeRange', { defaultValue: 'Time range' })}
        htmlFor={rangeFieldName}>
        <Controller
          name={rangeFieldName}
          control={parentFormContext.control}
          rules={{
            validate: {
              required: (v: string | undefined) => !!v,
            },
          }}
          render={({ field: { onChange, value, name } }) => (
            <Select
              id={name}
              name={name}
              value={value || dateOptions[0].name}
              onChange={onChange}
              options={selectOptions}
              placeholder={t('common.time.selectRange', { defaultValue: 'Select time range' })}
            />
          )}
        />
      </FormElement>
      <FormElement label={t('common.time.from', { defaultValue: 'From' })} htmlFor="from">
        <InputDatePicker name="from" withDate />
      </FormElement>
      <FormElement label={t('common.time.to', { defaultValue: 'To' })} htmlFor="to">
        <InputDatePicker name="to" withDate />
      </FormElement>
    </FormBody>
  )
}
