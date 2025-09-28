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
import { Heading } from 'components/primitives/typography/Heading'
import { DateRangeFilter } from 'components/ui/forms/DateRangeFilter'
import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useFormContext } from 'react-hook-form'

export const StatsFilter: React.FC = () => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()

  const resetForm = () => {
    const { from, to } = dateOptions[0].dateRangeFn(new Date())
    parentFormContext.setValue('from', from)
    parentFormContext.setValue('to', to)
    parentFormContext.setValue('dateRange', dateOptions[0].name)
  }

  return (
    <div className="w-full">
      <Heading variant="section">{t('common.filter.title', { defaultValue: 'Filter' })}</Heading>
      <FormBody>
        <DateRangeFilter name="dateRange" />
        <FormElement>
          <Button type="button" onClick={resetForm} variant="secondary">
            {t('common.actions.reset', { defaultValue: 'Reset' })}
          </Button>
        </FormElement>
      </FormBody>
    </div>
  )
}
