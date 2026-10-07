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

import { type FieldMetadata, useInputControl } from '@conform-to/react'

import { useFocusTagsOnProjectChange } from '~/features/bookings/hooks/use-focus-tags-on-project-change'
import { useProjectTags } from '~/features/bookings/hooks/use-project-tags'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { type ModelsTag } from '~/services/api/lasius'

type UseBookingProjectFieldsOptions = {
  projectField: FieldMetadata<string>
  selectedOrgId: string
  setTags: (value: string) => void
  tagsFieldId: string
}

/** Owns the project control, the tag suggestions of the project and the preset selection. */
export const useBookingProjectFields = ({
  projectField,
  selectedOrgId,
  setTags,
  tagsFieldId,
}: UseBookingProjectFieldsOptions) => {
  const { userProjects } = useProjects()
  const projectIdControl = useInputControl(projectField)
  const { projectTags } = useProjectTags(selectedOrgId, projectIdControl.value)
  useFocusTagsOnProjectChange(projectIdControl.value, tagsFieldId)

  const applyPreset = (preset: { projectId: string; tags: ModelsTag[] }) => {
    projectIdControl.change(preset.projectId)
    setTags(preset.tags.length > 0 ? JSON.stringify(preset.tags) : '')
  }

  return {
    applyPreset,
    changeProject: (id: string) => projectIdControl.change(id),
    projectId: projectIdControl.value,
    projects: userProjects.map((p) => p.projectReference),
    projectTags,
  }
}
