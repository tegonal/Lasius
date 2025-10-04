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
import { FormElement } from 'components/ui/forms/FormElement'
import { InputSelectAutocomplete } from 'components/ui/forms/input/InputSelectAutocomplete'
import { InputTagsAutocomplete } from 'components/ui/forms/input/InputTagsAutocomplete'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProjects } from 'lib/api/hooks/useProjects'
import { useGetTagsByProject } from 'lib/api/lasius/user-organisations/user-organisations'
import { dateOptions } from 'lib/utils/date/dateOptions'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

type BookingHistoryFilterProps = {
  inactiveProject?: { id: string; key: string } | null
}

export const BookingHistoryFilter: React.FC<BookingHistoryFilterProps> = ({
  inactiveProject = null,
}) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { projectSuggestions, findProjectById } = useProjects()
  const formContext = useFormContext()
  const { selectedOrganisationId } = useOrganisation()
  const { data: projectTags } = useGetTagsByProject(
    selectedOrganisationId,
    formContext.watch('projectId'),
  )
  const [hasChanges, setHasChanges] = useState(false)

  const handleBackToProjects = () => {
    // Determine if user or organisation context based on current path
    const isUserContext = router.pathname.startsWith('/user/')
    const projectsPath = isUserContext ? '/user/projects' : '/organisation/projects'
    router.push(projectsPath)
  }

  // No longer needed - InputSelectAutocomplete now handles missing projects via findMissingProject

  const defaultValues = {
    projectId: '',
    tags: [],
    dateRange: dateOptions[0].name,
  }

  const resetForm = () => {
    const { from, to } = dateOptions[0].dateRangeFn(new Date())
    formContext.setValue('from', from)
    formContext.setValue('to', to)
    formContext.setValue('dateRange', defaultValues.dateRange)
    formContext.setValue('projectId', defaultValues.projectId)
    formContext.setValue('tags', defaultValues.tags)
  }

  useEffect(() => {
    const subscription = formContext.watch((values) => {
      const changed =
        values.projectId !== defaultValues.projectId ||
        (values.tags?.length ?? 0) > 0 ||
        values.dateRange !== defaultValues.dateRange

      setHasChanges(changed)
    })
    return () => subscription.unsubscribe()
  }, [formContext, defaultValues.projectId, defaultValues.dateRange])

  useEffect(() => {
    const subscription = formContext.watch((value, { name }) => {
      switch (name) {
        case 'projectId':
          formContext.setFocus('tags')
          break
        default:
          break
      }
    })
    return () => subscription.unsubscribe()
  }, [formContext])

  return (
    <div className="w-full">
      {inactiveProject && (
        <div className="alert alert-warning mb-4">
          <div className="flex w-full items-center justify-between">
            <span>
              {t('projects.warnings.inactiveProjectFilter', {
                defaultValue: 'Showing data for inactive project',
              })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToProjects}
              aria-label={t('projects.actions.backToProjects', {
                defaultValue: 'Back to projects',
              })}>
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
        <FormElement label={t('projects.label', { defaultValue: 'Project' })} htmlFor="projectId">
          <InputSelectAutocomplete
            id="projectId"
            suggestions={projectSuggestions()}
            findMissingProject={findProjectById}
            name="projectId"
          />
        </FormElement>
        <FormElement label={t('tags.label', { defaultValue: 'Tags' })} htmlFor="tags">
          <InputTagsAutocomplete id="tags" name="tags" suggestions={projectTags} />
        </FormElement>
        <DateRangeFilter name="dateRange" />
      </FormBody>
    </div>
  )
}
