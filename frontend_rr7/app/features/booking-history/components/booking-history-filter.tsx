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

import { type FieldMetadata } from '@conform-to/react'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef } from 'react'
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
import { type BookingHistoryControls } from '~/features/booking-history/components/booking-history-layout'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { dateOptions } from '~/lib/utils/date/date-options'
import {
  type ModelsEntityReference,
  type ModelsUserStub,
} from '~/services/api/lasius'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'

type Props = {
  controls: BookingHistoryControls
  dataSource: 'organisationBookings' | 'userBookings'
  fields: {
    dateRange: FieldMetadata<string | undefined>
    from: FieldMetadata<string | undefined>
    projectId: FieldMetadata<string | undefined>
    tags: FieldMetadata<string | undefined>
    to: FieldMetadata<string | undefined>
    userId: FieldMetadata<string | undefined>
  }
  inactiveProject?: null | { id: string; key: string }
  projects: ModelsEntityReference[]
  users?: ModelsUserStub[]
}

export const BookingHistoryFilter = ({
  controls,
  dataSource,
  fields,
  inactiveProject = null,
  projects,
  users = [],
}: Props) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { selectedOrganisationId } = useOrganisation()

  // Tags via Orval hook
  const tagsApi = useGetTagsByProject()
  const tagsSubmitRef = useRef(tagsApi.submit)
  tagsSubmitRef.current = tagsApi.submit
  const prevProjectKeyRef = useRef('')

  const projectId = controls.projectId.value ?? ''

  const showUserFilter = dataSource === 'organisationBookings'

  const firstDateOption = dateOptions[0]

  // Load tags when project changes
  useEffect(() => {
    const key = `${selectedOrganisationId}:${projectId}`
    if (
      selectedOrganisationId &&
      projectId &&
      key !== prevProjectKeyRef.current
    ) {
      prevProjectKeyRef.current = key
      tagsSubmitRef.current({ orgId: selectedOrganisationId, projectId })
    }
  }, [projectId, selectedOrganisationId])

  const projectTags = tagsApi.data ?? []

  const handleBackToProjects = () => {
    const isUserContext = dataSource === 'userBookings'
    const projectsPath = isUserContext
      ? '/user/projects'
      : '/organisation/projects'
    void navigate(projectsPath)
  }

  const defaultProjectId = ''
  const defaultUserId = ''
  const defaultDateRange = firstDateOption?.name ?? ''

  const hasChanges =
    (controls.projectId.value ?? '') !== defaultProjectId ||
    (controls.userId.value ?? '') !== defaultUserId ||
    !!controls.tags.value ||
    (controls.dateRange.value ?? '') !== defaultDateRange

  const resetForm = () => {
    if (firstDateOption) {
      const { from, to } = firstDateOption.dateRangeFn(new Date())
      controls.from.change(from)
      controls.to.change(to)
    }
    controls.dateRange.change(defaultDateRange)
    controls.projectId.change(defaultProjectId)
    controls.userId.change(defaultUserId)
    controls.tags.change('')
  }

  // Auto-focus tags after project selection
  useEffect(() => {
    if (projectId && fields.tags.id) {
      document.querySelector<HTMLElement>(`#${fields.tags.id}`)?.focus()
    }
  }, [projectId, fields.tags.id])

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
          <FormElement htmlFor={fields.userId.id} label={t('user', 'User')}>
            <UserSelect
              id={fields.userId.id}
              name={fields.userId.name}
              onChange={(id) => controls.userId.change(id)}
              users={users}
              value={controls.userId.value ?? ''}
            />
          </FormElement>
        )}
        <FormElement
          htmlFor={fields.projectId.id}
          label={t('projects:label', 'Project')}
        >
          <ProjectSelect
            id={fields.projectId.id}
            name={fields.projectId.name}
            onChange={(id) => controls.projectId.change(id)}
            projects={projects}
            value={controls.projectId.value ?? ''}
          />
        </FormElement>
        <FormElement
          htmlFor={fields.tags.id}
          label={t('tag-manager:label', 'Tags')}
        >
          <InputTagsAutocomplete
            field={fields.tags}
            id={fields.tags.id}
            key={fields.tags.key}
            projectId={controls.projectId.value}
            suggestions={projectTags}
          />
        </FormElement>
        <DateRangeFilter
          fromField={fields.from}
          rangeField={fields.dateRange}
          toField={fields.to}
        />
      </FormBody>
    </div>
  )
}
