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

import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { InputDatePicker } from 'components/ui/forms/input/datePicker/inputDatePicker'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { isAfter, isBefore } from 'date-fns'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useRef } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

type Props = {
  name: string
}

export const DateRangeFilter: React.FC<Props> = ({ name: rangeFieldName }) => {
  const { t } = useTranslation('common')
  const dateRangeRef = useRef<HTMLSelectElement>(null)

  const parentFormContext = useFormContext()

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
    if (dateRangeRef.current) {
      const option = dateOptions.find((option) => {
        if (!option.dateRangeFn) {
          return true
        }
        const dateRange = option.dateRangeFn(today)
        return dateRange.from === from && dateRange.to === to
      })
      if (option && dateRangeRef.current.value !== option.name) {
        dateRangeRef.current.value = option.name
      }
    }
  }, [watchFrom, watchTo])

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
      <FormElement>
        <Controller
          name={rangeFieldName}
          control={parentFormContext.control}
          rules={{
            validate: {
              required: (v: string | undefined) => !!v,
            },
          }}
          render={({ field: { onChange, name } }) => (
            <div className="relative">
              <select
                className="input input-bordered w-full cursor-pointer appearance-none pr-8"
                name={name}
                ref={dateRangeRef}
                onChange={onChange}
                defaultValue={dateOptions[0].name}>
                {dateOptions.map((option) => (
                  <option key={option.name} value={option.name}>
                    {t(option.name as any)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <LucideIcon icon={ChevronDown} size={16} strokeWidth={2} className="opacity-50" />
              </div>
            </div>
          )}
        />
      </FormElement>
      <FormElement>
        <InputDatePicker
          name="from"
          label={t('common.time.from', { defaultValue: 'From' })}
          withTime={false}
        />
      </FormElement>
      <FormElement>
        <InputDatePicker
          name="to"
          label={t('common.time.to', { defaultValue: 'To' })}
          withTime={false}
        />
      </FormElement>
    </FormBody>
  )
}
