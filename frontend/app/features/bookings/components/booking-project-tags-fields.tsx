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
import { useTranslation } from 'react-i18next'

import { FormElement } from '~/components/ui/forms/form-element'
import { type SelectAutocompleteSuggestionType } from '~/components/ui/forms/input/input-select-autocomplete'
import { ProjectSelect } from '~/components/ui/forms/input/project-select'
import { InputTagsAutocomplete } from '~/features/tags/components/input-tags-autocomplete'
import { type ModelsEntityReference, type ModelsTag } from '~/services/api/lasius'

type Properties = {
  fallbackProject?: SelectAutocompleteSuggestionType
  onProjectChange: (projectId: string) => void
  projectField: Pick<FieldMetadata<string>, 'errors' | 'id' | 'name'>
  projectId: string | undefined
  projects: ModelsEntityReference[]
  projectTags: ModelsTag[] | undefined
  tagsField: FieldMetadata<string>
}

/** The project select and the tags input of a booking form. */
export const BookingProjectTagsFields = ({
  fallbackProject,
  onProjectChange,
  projectField,
  projectId,
  projects,
  projectTags,
  tagsField,
}: Properties) => {
  const { t } = useTranslation('common')

  return (
    <>
      <FormElement htmlFor={projectField.id} label={t('projects:label', 'Project')} required>
        <ProjectSelect
          errors={projectField.errors}
          fallbackProject={fallbackProject}
          id={projectField.id}
          name={projectField.name}
          onChange={onProjectChange}
          projects={projects}
          value={projectId ?? ''}
        />
      </FormElement>
      <FormElement htmlFor={tagsField.id} label={t('tag-manager:label', 'Tags')}>
        <InputTagsAutocomplete
          field={tagsField}
          id={tagsField.id}
          key={tagsField.key}
          projectId={projectId}
          suggestions={projectTags}
        />
      </FormElement>
    </>
  )
}
