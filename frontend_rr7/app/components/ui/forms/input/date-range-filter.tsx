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
import { isAfter, isBefore } from 'date-fns'
import React, { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDatePicker } from '~/components/ui/forms/input/date-picker/input-date-picker'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { dateOptions } from '~/lib/utils/date/date-options'

type DateRangeFilterProps = {
  name: string
}

export const DateRangeFilter = ({
  name: rangeFieldName,
}: DateRangeFilterProps) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()

  // Convert dateOptions to SelectOption format
  const selectOptions: SelectOption[] = useMemo(
    () =>
      dateOptions.map((option) => ({
        label: t(option.name as never),
        value: option.name,
      })),
    [t],
  )

  const resetForm = () => {
    const firstOption = dateOptions[0]
    if (!firstOption) return
    const range = firstOption.dateRangeFn(new Date())

    parentFormContext.setValue('from', range.from)
    parentFormContext.setValue('to', range.to)

    parentFormContext.register('from', {
      validate: {
        fromBeforeTo: (v: string) =>
          isBefore(new Date(v), new Date(parentFormContext.getValues('to'))),
      },
    })

    parentFormContext.register('to', {
      validate: {
        toAfterFrom: (v: string) =>
          isAfter(new Date(v), new Date(parentFormContext.getValues('from'))),
      },
    })
    void parentFormContext.trigger()
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
    const option = dateOptions.find((opt) => {
      if (!opt.dateRangeFn) {
        return true
      }
      const dateRange = opt.dateRangeFn(today)
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
    const subscription = parentFormContext.watch(
      (value, { name: fieldname }) => {
        switch (fieldname) {
          case 'from':
          case 'to':
            void parentFormContext.trigger()
            break
          case rangeFieldName:
            if (value[rangeFieldName]) {
              const option = dateOptions.find(
                (opt) => opt.name === value[rangeFieldName],
              )
              if (!option || !option.dateRangeFn) return
              const { from, to } = option.dateRangeFn(new Date())
              parentFormContext.setValue('from', from)
              parentFormContext.setValue('to', to)
              void parentFormContext.trigger()
            }
            break
          default:
            break
        }
      },
    )
    return () => subscription.unsubscribe()
  }, [parentFormContext, rangeFieldName])

  return (
    <FormBody>
      <FormElement
        htmlFor={rangeFieldName}
        label={t('time.timeRange', 'Time range')}
      >
        <Controller
          control={parentFormContext.control}
          name={rangeFieldName}
          render={({ field: { name, onChange, value } }) => (
            <Select
              id={name}
              name={name}
              onChange={onChange}
              options={selectOptions}
              placeholder={t('time.selectRange', 'Select time range')}
              value={value || dateOptions[0]?.name || ''}
            />
          )}
          rules={{
            validate: {
              required: (v: string | undefined) => !!v,
            },
          }}
        />
      </FormElement>
      <FormElement htmlFor="from" label={t('time.from', 'From')}>
        <InputDatePicker name="from" withDate />
      </FormElement>
      <FormElement htmlFor="to" label={t('time.to', 'To')}>
        <InputDatePicker name="to" withDate />
      </FormElement>
    </FormBody>
  )
}
