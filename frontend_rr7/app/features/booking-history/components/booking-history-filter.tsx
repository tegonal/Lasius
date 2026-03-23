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
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Heading } from '~/components/primitives/typography/heading'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { DateRangeFilter } from '~/components/ui/forms/input/date-range-filter'
import { InputTagsAutocomplete } from '~/components/ui/forms/input/input-tags-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { UserSelect } from '~/components/ui/forms/input/user-select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { dateOptions } from '~/lib/utils/date/date-options'
import {
  type ModelsEntityReference,
  type ModelsTag,
  type ModelsUserStub,
} from '~/services/api/lasius'
import { getTagsByProject } from '~/services/api/lasius/user-organisations/user-organisations'

type Props = {
  dataSource: 'organisationBookings' | 'userBookings'
  inactiveProject?: null | { id: string; key: string }
  projects: ModelsEntityReference[]
  users?: ModelsUserStub[]
}

export const BookingHistoryFilter = ({
  dataSource,
  inactiveProject = null,
  projects,
  users = [],
}: Props) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { selectedOrganisationId } = useOrganisation()
  const formContext = useFormContext()
  const [projectTags, setProjectTags] = useState<ModelsTag[]>([])

  const projectId = formContext.watch('projectId') as string

  const showUserFilter = dataSource === 'organisationBookings'

  const firstDateOption = dateOptions[0]

  useEffect(() => {
    if (projectId && selectedOrganisationId) {
      void getTagsByProject(selectedOrganisationId, projectId).then(
        (response) => {
          setProjectTags(response.data)
        },
      )
    } else {
      setProjectTags([])
    }
  }, [projectId, selectedOrganisationId])

  const handleBackToProjects = () => {
    const isUserContext = dataSource === 'userBookings'
    const projectsPath = isUserContext
      ? '/user/projects'
      : '/organisation/projects'
    void navigate(projectsPath)
  }

  const defaultProjectId = ''
  const defaultUserId = ''
  const defaultTags: ModelsTag[] = []
  const defaultDateRange = firstDateOption?.name ?? ''

  const watchedValues = formContext.watch()
  const hasChanges =
    watchedValues.projectId !== defaultProjectId ||
    watchedValues.userId !== defaultUserId ||
    (Array.isArray(watchedValues.tags) && watchedValues.tags.length > 0) ||
    watchedValues.dateRange !== defaultDateRange

  const resetForm = () => {
    if (firstDateOption) {
      const { from, to } = firstDateOption.dateRangeFn(new Date())
      formContext.setValue('from', from)
      formContext.setValue('to', to)
    }
    formContext.setValue('dateRange', defaultDateRange)
    formContext.setValue('projectId', defaultProjectId)
    formContext.setValue('userId', defaultUserId)
    formContext.setValue('tags', defaultTags)
  }

  useEffect(() => {
    const subscription = formContext.watch((_value, { name }) => {
      if (name === 'projectId') {
        formContext.setFocus('tags')
      }
    })
    return () => subscription.unsubscribe()
  }, [formContext])

  return (
    <div className="w-full" data-testid="lists-filter">
      {inactiveProject && (
        <div className="alert alert-warning mb-4">
          <div className="flex w-full items-center justify-between">
            <span>
              {t(
                'projects:warnings.inactiveProjectFilter',
                'Showing data for inactive project',
              )}
            </span>
            <Button
              aria-label={t('actions.back', 'Back')}
              fullWidth={false}
              onClick={handleBackToProjects}
              size="sm"
              variant="ghost"
            >
              <LucideIcon icon={ArrowLeft} size={16} />
              {t('actions.back', 'Back')}
            </Button>
          </div>
        </div>
      )}
      <div className="relative">
        <Heading variant="section">{t('filter.title', 'Filter')}</Heading>
        {hasChanges && (
          <div className="absolute top-3 right-0">
            <Button
              fullWidth={false}
              onClick={resetForm}
              size="xs"
              variant="ghost"
            >
              {t('actions.reset', 'Reset')}
            </Button>
          </div>
        )}
      </div>
      <FormBody>
        {showUserFilter && (
          <FormElement htmlFor="userId" label={t('user', 'User')}>
            <UserSelect id="userId" name="userId" users={users} />
          </FormElement>
        )}
        <FormElement htmlFor="projectId" label={t('projects:label', 'Project')}>
          <ProjectSelect id="projectId" name="projectId" projects={projects} />
        </FormElement>
        <FormElement htmlFor="tags" label={t('tag-manager:label', 'Tags')}>
          <InputTagsAutocomplete
            id="tags"
            name="tags"
            suggestions={projectTags}
          />
        </FormElement>
        <DateRangeFilter name="dateRange" />
      </FormBody>
    </div>
  )
}
