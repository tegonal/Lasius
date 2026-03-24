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

import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Heading } from '~/components/primitives/typography/heading'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { InputDateStandalone } from '~/components/ui/forms/input/input-date-standalone'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { dateOptions } from '~/lib/utils/date/date-options'
import { formatISOLocale } from '~/lib/utils/dates'

type StatsFilterProps = {
  inactiveProject?: null | { id: string; key: string }
}

export const StatsFilter = ({ inactiveProject = null }: StatsFilterProps) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedRange, setSelectedRange] = useState(
    () => searchParams.get('dateRange') || dateOptions[0]?.name || '',
  )

  const defaultDateRange = dateOptions[0]?.name || ''

  const hasChanges = selectedRange !== defaultDateRange

  const selectOptions: SelectOption[] = dateOptions.map((option) => ({
    label: t(option.name as never),
    value: option.name,
  }))

  const handleRangeChange = (value: string) => {
    setSelectedRange(value)

    const option = dateOptions.find((opt) => opt.name === value)
    if (!option?.dateRangeFn) return

    const { from, to } = option.dateRangeFn(new Date())
    setSearchParams(
      (prev) => {
        prev.set('from', from)
        prev.set('to', to)
        prev.set('dateRange', value)
        return prev
      },
      { replace: true },
    )
  }

  const handleFromChange = (value: string) => {
    setSearchParams(
      (prev) => {
        prev.set('from', value)
        prev.set('dateRange', t('custom', { defaultValue: 'Custom' }))
        return prev
      },
      { replace: true },
    )
    setSelectedRange(t('custom', { defaultValue: 'Custom' }))
  }

  const handleToChange = (value: string) => {
    setSearchParams(
      (prev) => {
        prev.set('to', value)
        prev.set('dateRange', t('custom', { defaultValue: 'Custom' }))
        return prev
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
    setSearchParams(
      (prev) => {
        prev.set('from', from)
        prev.set('to', to)
        prev.set('dateRange', defaultDateRange)
        return prev
      },
      { replace: true },
    )
  }

  const handleBackToProjects = () => {
    void navigate('/user/projects')
  }

  const currentFrom = searchParams.get('from') || formatISOLocale(new Date())
  const currentTo = searchParams.get('to') || formatISOLocale(new Date())

  return (
    <div className="w-full" data-testid="stats-filter">
      {inactiveProject && (
        <div className="alert alert-warning mb-4">
          <div className="flex w-full items-center justify-between">
            <span>
              {t('projects:warnings.inactiveProjectContext', {
                defaultValue: 'Viewing stats from inactive project',
              })}
            </span>
            <Button
              aria-label={t('actions.back', {
                defaultValue: 'Back',
              })}
              fullWidth={false}
              onClick={handleBackToProjects}
              size="sm"
              variant="ghost"
            >
              <LucideIcon icon={ArrowLeft} size={16} />
              {t('actions.back', { defaultValue: 'Back' })}
            </Button>
          </div>
        </div>
      )}
      <div className="relative">
        <Heading variant="section">
          {t('filter.title', { defaultValue: 'Filter' })}
        </Heading>
        {hasChanges && (
          <div className="absolute top-3 right-0">
            <button
              className="btn btn-ghost btn-xs"
              onClick={resetForm}
              type="button"
            >
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
          })}
        >
          <Select
            id="dateRange"
            onChange={handleRangeChange}
            options={selectOptions}
            value={selectedRange}
          />
        </FormElement>
        <FormElement
          htmlFor="from"
          label={t('time.from', { defaultValue: 'From' })}
        >
          <InputDateStandalone
            id="from"
            onChange={handleFromChange}
            value={currentFrom.split('T')[0] || ''}
          />
        </FormElement>
        <FormElement htmlFor="to" label={t('time.to', { defaultValue: 'To' })}>
          <InputDateStandalone
            id="to"
            onChange={handleToChange}
            value={currentTo.split('T')[0] || ''}
          />
        </FormElement>
      </FormBody>
    </div>
  )
}
