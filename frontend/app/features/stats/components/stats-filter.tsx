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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Heading } from '~/components/primitives/typography/heading'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDateStandalone } from '~/components/ui/forms/input/input-date-standalone'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { untyped } from '~/lib/i18n-types'
import { dateOptions } from '~/lib/utils/date/date-options'

type StatsFilterProperties = {
  /** The range that the loader applied: the URL params, or the default range in the user zone. */
  from: string
  to: string
}

export const StatsFilter = ({ from: currentFrom, to: currentTo }: StatsFilterProperties) => {
  const { t } = useTranslation('common')
  const [searchParameters, setSearchParameters] = useSearchParams()
  const [selectedRange, setSelectedRange] = useState(
    () => searchParameters.get('dateRange') || dateOptions[0]?.name || '',
  )

  const defaultDateRange = dateOptions[0]?.name || ''

  const hasChanges = selectedRange !== defaultDateRange

  const selectOptions: SelectOption[] = dateOptions.map((option) => ({
    label: option.label(untyped(t)),
    value: option.name,
  }))

  const handleRangeChange = (value: string) => {
    setSelectedRange(value)

    const option = dateOptions.find((opt) => opt.name === value)
    if (!option?.dateRangeFn) return

    const { from, to } = option.dateRangeFn(new Date())
    setSearchParameters(
      (previous) => {
        previous.set('from', from)
        previous.set('to', to)
        previous.set('dateRange', value)
        return previous
      },
      { replace: true },
    )
  }

  const handleFromChange = (value: string) => {
    setSearchParameters(
      (previous) => {
        previous.set('from', value)
        previous.set('dateRange', t('custom', { defaultValue: 'Custom' }))
        return previous
      },
      { replace: true },
    )
    setSelectedRange(t('custom', { defaultValue: 'Custom' }))
  }

  const handleToChange = (value: string) => {
    setSearchParameters(
      (previous) => {
        previous.set('to', value)
        previous.set('dateRange', t('custom', { defaultValue: 'Custom' }))
        return previous
      },
      { replace: true },
    )
    setSelectedRange(t('custom', { defaultValue: 'Custom' }))
  }

  const resetForm = () => {
    const firstOption = dateOptions[0]
    if (!firstOption) return
    const { from, to } = firstOption.dateRangeFn(new Date())
    setSelectedRange(defaultDateRange)
    setSearchParameters(
      (previous) => {
        previous.set('from', from)
        previous.set('to', to)
        previous.set('dateRange', defaultDateRange)
        return previous
      },
      { replace: true },
    )
  }

  return (
    <div className="w-full" data-testid="stats-filter">
      <div className="relative">
        <Heading variant="section">{t('filter.title', { defaultValue: 'Filter' })}</Heading>
        {hasChanges && (
          <div className="absolute top-3 right-0">
            <button className="btn btn-ghost btn-xs" onClick={resetForm} type="button">
              {t('actions.reset', {
                defaultValue: 'Reset',
              })}
            </button>
          </div>
        )}
      </div>
      <FormBody>
        <FormElement
          htmlFor="dateRange"
          label={t('time.timeRange', {
            defaultValue: 'Time range',
          })}>
          <Select
            id="dateRange"
            onChange={handleRangeChange}
            options={selectOptions}
            value={selectedRange}
          />
        </FormElement>
        <FormElement htmlFor="from" label={t('time.from', { defaultValue: 'From' })}>
          <InputDateStandalone
            id="from"
            onChange={handleFromChange}
            value={currentFrom.split('T', 1)[0] || ''}
          />
        </FormElement>
        <FormElement htmlFor="to" label={t('time.to', { defaultValue: 'To' })}>
          <InputDateStandalone
            id="to"
            onChange={handleToChange}
            value={currentTo.split('T', 1)[0] || ''}
          />
        </FormElement>
      </FormBody>
    </div>
  )
}
