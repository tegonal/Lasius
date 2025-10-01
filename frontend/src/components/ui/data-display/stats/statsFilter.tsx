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

import { ResetButton } from 'components/primitives/buttons/ResetButton'
import { Heading } from 'components/primitives/typography/Heading'
import { DateRangeFilter } from 'components/ui/forms/DateRangeFilter'
import { FormBody } from 'components/ui/forms/FormBody'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

export const StatsFilter: React.FC = () => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()
  const [hasChanges, setHasChanges] = useState(false)

  const defaultDateRange = dateOptions[0].name

  const resetForm = () => {
    const { from, to } = dateOptions[0].dateRangeFn(new Date())
    parentFormContext.setValue('from', from)
    parentFormContext.setValue('to', to)
    parentFormContext.setValue('dateRange', defaultDateRange)
  }

  useEffect(() => {
    const subscription = parentFormContext.watch((values) => {
      const changed = values.dateRange !== defaultDateRange
      setHasChanges(changed)
    })
    return () => subscription.unsubscribe()
  }, [parentFormContext, defaultDateRange])

  return (
    <div className="w-full">
      <div className="relative">
        <Heading variant="section">{t('common.filter.title', { defaultValue: 'Filter' })}</Heading>
        {hasChanges && (
          <div className="absolute top-3 right-0">
            <ResetButton onClick={resetForm} />
          </div>
        )}
      </div>
      <FormBody>
        <DateRangeFilter name="dateRange" />
      </FormBody>
    </div>
  )
}
