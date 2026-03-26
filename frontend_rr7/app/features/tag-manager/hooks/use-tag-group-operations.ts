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

import { unionWith } from 'es-toolkit/compat'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'

import { tagGroupTemplate } from '../tag-group-template'

type CopiedTags = {
  fromGroupId: string
  tags: ModelsSimpleTag[]
}

type TagGroupOpsInput = {
  newTagGroupName: string
  newTagName: string
  setNewTagGroupName: (value: string) => void
  setNewTagName: (value: string) => void
  setSimpleTags: Dispatch<SetStateAction<ModelsSimpleTag[]>>
  setTagGroups: Dispatch<SetStateAction<ModelsTagGroup[]>>
  simpleTags: ModelsSimpleTag[]
  tagGroups: ModelsTagGroup[]
}

export const useTagGroupOperations = (
  input: TagGroupOpsInput,
  setHasUnsavedChanges: (value: boolean) => void,
) => {
  const { t } = useTranslation('tag-manager')
  const { addToast } = useToast()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [copiedTags, setCopiedTags] = useState<CopiedTags | null>(null)

  const addTemplate = () => {
    const newTagGroups = tagGroupTemplate.filter(
      (tag) => tag.type === 'TagGroup',
    ) as ModelsTagGroup[]

    const newSimpleTags = tagGroupTemplate.filter(
      (tag) => tag.type === 'SimpleTag',
    ) as ModelsSimpleTag[]

    input.setTagGroups((prev) => {
      const merged = unionWith(prev, newTagGroups, (a, b) => a.id === b.id)
      setExpandedGroups(new Set(merged.map((g) => g.id)))
      return merged
    })

    input.setSimpleTags((prev) =>
      unionWith(prev, newSimpleTags, (a, b) => a.id === b.id),
    )

    setHasUnsavedChanges(true)
  }

  const removeTagGroup = (index: number) => {
    const group = input.tagGroups[index]
    if (!group) return
    const removedGroupId = group.id

    input.setTagGroups((prev) => prev.filter((_, i) => i !== index))

    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.delete(removedGroupId)
      return next
    })

    setHasUnsavedChanges(true)
  }

  const createTagGroup = () => {
    const name = input.newTagGroupName
    if (!name) {
      addToast({
        message: t(
          'validation.tagGroupNameRequired',
          'Tag group name is required',
        ),
        type: 'ERROR',
      })
      return false
    }

    if (input.tagGroups.some((g) => g.id === name)) {
      addToast({
        message: t('validation.tagGroupExists', 'Tag group already exists'),
        type: 'ERROR',
      })
      return false
    }

    const newTagGroup: ModelsTagGroup = {
      id: name,
      relatedTags: [],
      type: 'TagGroup',
    }

    input.setTagGroups((prev) => [...prev, newTagGroup])
    input.setNewTagGroupName('')
    setHasUnsavedChanges(true)
    setExpandedGroups((prev) => new Set([...prev, name]))
    return true
  }

  const expandAll = () => {
    setExpandedGroups(new Set(input.tagGroups.map((g) => g.id)))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const copyTags = (groupId: string, tags: ModelsSimpleTag[]) => {
    setCopiedTags({ fromGroupId: groupId, tags })
    addToast({
      message: t('status.tagsCopied', 'Tags copied'),
      type: 'SUCCESS',
    })
  }

  const pasteTags = (targetIndex: number) => {
    if (!copiedTags) return

    input.setTagGroups((prev) => {
      const updated = [...prev]
      const targetGroup = updated[targetIndex]
      if (!targetGroup) return prev

      const existingTags = targetGroup.relatedTags || []
      const newTags = copiedTags.tags.filter(
        (tag) => !existingTags.some((existing) => existing.id === tag.id),
      )

      updated[targetIndex] = {
        ...targetGroup,
        relatedTags: [...existingTags, ...newTags],
      }
      return updated
    })

    setHasUnsavedChanges(true)
    addToast({
      message: t('status.tagsPasted', 'Tags pasted'),
      type: 'SUCCESS',
    })
    setCopiedTags(null)
  }

  const addTagToGroup = (groupIndex: number) => {
    const tagName = input.newTagName
    if (!tagName.trim()) {
      addToast({
        message: t('validation.tagNameRequired', 'Tag name is required'),
        type: 'ERROR',
      })
      return false
    }

    const targetGroup = input.tagGroups[groupIndex]
    if (!targetGroup) return false

    if (targetGroup.relatedTags?.some((tag) => tag.id === tagName.trim())) {
      addToast({
        message: t('validation.tagExists', 'Tag already exists'),
        type: 'ERROR',
      })
      return false
    }

    const newTag: ModelsSimpleTag = {
      id: tagName.trim(),
      type: 'SimpleTag',
    }

    input.setTagGroups((prev) => {
      const updated = [...prev]
      const group = updated[groupIndex]
      if (!group) return prev
      updated[groupIndex] = {
        ...group,
        relatedTags: [...(group.relatedTags || []), newTag],
      }
      return updated
    })

    input.setNewTagName('')
    setHasUnsavedChanges(true)
    return true
  }

  const updateTagGroupTags = (groupIndex: number, tags: ModelsSimpleTag[]) => {
    input.setTagGroups((prev) => {
      const updated = [...prev]
      const group = updated[groupIndex]
      if (!group) return prev
      updated[groupIndex] = {
        ...group,
        relatedTags: tags,
      }
      return updated
    })
    setHasUnsavedChanges(true)
  }

  return {
    addTagToGroup,
    addTemplate,
    collapseAll,
    copiedTags,
    copyTags,
    createTagGroup,
    expandAll,
    expandedGroups,
    pasteTags,
    removeTagGroup,
    setExpandedGroups,
    toggleGroup,
    updateTagGroupTags,
  }
}
