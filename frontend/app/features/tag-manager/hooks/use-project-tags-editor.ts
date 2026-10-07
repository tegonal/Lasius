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

import { useEffect, useRef, useState } from 'react'

import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import {
  resolveProjectReferences,
  splitBookingCategories,
} from '~/features/tag-manager/lib/project-tag-form'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

import { useTagGroupOperations } from './use-tag-group-operations'
import { useUnsavedChanges } from './use-unsaved-changes'

/**
 * Loads the tags of one project once and keeps the edited tag groups and simple tags in plain
 * state (decision rr7-tag-manager-plain-state).
 */
export const useProjectTagsEditor = (item: ModelsProject | ModelsUserProject) => {
  const [tagGroups, setTagGroups] = useState<ModelsTagGroup[]>([])
  const [simpleTags, setSimpleTags] = useState<ModelsSimpleTag[]>([])
  const [newTagGroupName, setNewTagGroupName] = useState('')
  const [newTagName, setNewTagName] = useState('')

  const { selectedOrganisationId } = useOrganisation()
  const { data: tagsData, isSuccess: isTagsLoaded, submit: submitTags } = useGetTagsByProject()

  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges()
  const operations = useTagGroupOperations(
    {
      newTagGroupName,
      newTagName,
      setNewTagGroupName,
      setNewTagName,
      setSimpleTags,
      setTagGroups,
      simpleTags,
      tagGroups,
    },
    setHasUnsavedChanges,
  )

  // Initialize the state during render when a new tag response arrives.
  const [initializedTags, setInitializedTags] = useState<typeof tagsData>()
  if (isTagsLoaded && tagsData && tagsData !== initializedTags) {
    setInitializedTags(tagsData)
    const { groups, simple } = splitBookingCategories(tagsData)
    setTagGroups(groups)
    setSimpleTags(simple)
    setNewTagGroupName('')
    setNewTagName('')
    operations.setExpandedGroups(new Set(groups.map((g) => g.id)))
  }

  const references = resolveProjectReferences(item, selectedOrganisationId)
  const { projectId } = references

  const loadedReference = useRef(false)
  useEffect(() => {
    if (!item || !selectedOrganisationId || !projectId || loadedReference.current) return
    loadedReference.current = true
    submitTags({ orgId: selectedOrganisationId, projectId })
  }, [item, projectId, selectedOrganisationId, submitTags])

  const changeSimpleTags = (tags: ModelsTag[]) => {
    setSimpleTags(tags as ModelsSimpleTag[])
    setHasUnsavedChanges(true)
  }

  return {
    bookingCategories: [...tagGroups, ...simpleTags],
    changeSimpleTags,
    hasUnsavedChanges,
    newTagGroupName,
    newTagName,
    operations,
    references,
    setNewTagGroupName,
    setNewTagName,
    simpleTags,
    tagGroups,
  }
}
