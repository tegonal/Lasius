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
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { Heading } from '~/components/primitives/typography/heading'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { DateRangeFilter } from '~/components/ui/forms/input/date-range-filter'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { UserSelect } from '~/components/ui/forms/input/user-select'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type BookingHistoryControls } from '~/features/booking-history/components/booking-history-layout'
import {
  getFilterDefaults,
  getFilterResetValues,
  hasFilterChanges,
  projectsPathFor,
} from '~/features/booking-history/lib/booking-history-filter-state'
import { useFocusTagsOnProjectChange } from '~/features/bookings/hooks/use-focus-tags-on-project-change'
import { useProjectTags } from '~/features/bookings/hooks/use-project-tags'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { InputTagsAutocomplete } from '~/features/tags/components/input-tags-autocomplete'
import { dateOptions } from '~/lib/utils/date/date-options'
import { type ModelsEntityReference, type ModelsUserStub } from '~/services/api/lasius'

type Properties = {
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

const NO_USERS: ModelsUserStub[] = []

export const BookingHistoryFilter = ({
  controls,
  dataSource,
  fields,
  inactiveProject = null,
  projects,
  users = NO_USERS,
}: Properties) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { selectedOrganisationId } = useOrganisation()

  const projectId = controls.projectId.value ?? ''
  const { projectTags } = useProjectTags(selectedOrganisationId, projectId)
  useFocusTagsOnProjectChange(projectId, fields.tags.id)

  const isShowUserFilter = dataSource === 'organisationBookings'

  const firstDateOption = dateOptions[0]

  const handleBackToProjects = () => {
    void navigate(projectsPathFor(dataSource))
  }

  const hasChanges = hasFilterChanges(
    {
      dateRange: controls.dateRange.value,
      projectId: controls.projectId.value,
      tags: controls.tags.value,
      userId: controls.userId.value,
    },
    getFilterDefaults(firstDateOption),
  )

  const resetForm = () => {
    const reset = getFilterResetValues(firstDateOption, new Date())
    if (reset.range) {
      controls.from.change(reset.range.from)
      controls.to.change(reset.range.to)
    }
    controls.dateRange.change(reset.dateRange)
    controls.projectId.change(reset.projectId)
    controls.userId.change(reset.userId)
    controls.tags.change(reset.tags)
  }

  return (
    <div className="w-full" data-testid="lists-filter">
      {inactiveProject && (
        <div className="alert alert-warning mb-4">
          <div className="flex w-full items-center justify-between">
            <span>
              {t('projects:warnings.inactiveProjectFilter', 'Showing data for inactive project')}
            </span>
            <Button
              aria-label={t('actions.back', 'Back')}
              fullWidth={false}
              onClick={handleBackToProjects}
              size="sm"
              type="button"
              variant="ghost">
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
              data-testid="lists-filter-reset-btn"
              fullWidth={false}
              onClick={resetForm}
              size="xs"
              type="button"
              variant="ghost">
              {t('actions.reset', 'Reset')}
            </Button>
          </div>
        )}
      </div>
      <FormBody>
        {isShowUserFilter && (
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
        <FormElement htmlFor={fields.projectId.id} label={t('projects:label', 'Project')}>
          <ProjectSelect
            id={fields.projectId.id}
            name={fields.projectId.name}
            onChange={(id) => controls.projectId.change(id)}
            projects={projects}
            value={controls.projectId.value ?? ''}
          />
        </FormElement>
        <FormElement htmlFor={fields.tags.id} label={t('tag-manager:label', 'Tags')}>
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
