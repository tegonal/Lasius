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
import { ResetButton } from 'components/primitives/buttons/ResetButton'
import { Heading } from 'components/primitives/typography/Heading'
import { DateRangeFilter } from 'components/ui/forms/DateRangeFilter'
import { FormBody } from 'components/ui/forms/FormBody'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

type StatsFilterProps = {
  inactiveProject?: { id: string; key: string } | null
}

export const StatsFilter: React.FC<StatsFilterProps> = ({ inactiveProject = null }) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const parentFormContext = useFormContext()
  const [hasChanges, setHasChanges] = useState(false)

  const defaultDateRange = dateOptions[0].name

  const handleBackToProjects = () => {
    // Determine if user or organisation context based on current path
    const isUserContext = router.pathname.startsWith('/user/')
    const projectsPath = isUserContext ? '/user/projects' : '/organisation/projects'
    router.push(projectsPath)
  }

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
      {inactiveProject && (
        <div className="alert alert-warning mb-4">
          <div className="flex w-full items-center justify-between">
            <span>
              {t('projects.warnings.inactiveProjectContext', {
                defaultValue: 'Viewing stats from inactive project',
              })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleBackToProjects}>
              <LucideIcon icon={ArrowLeft} size={16} />
              {t('projects.actions.backToProjects', { defaultValue: 'Back to projects' })}
            </Button>
          </div>
        </div>
      )}
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
