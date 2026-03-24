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
import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'

import { tagGroupTemplate } from '../tag-group-template'

type CopiedTags = {
  fromGroupId: string
  tags: ModelsSimpleTag[]
}

type FormValues = {
  newTagGroupName: string
  newTagName: string
  simpleTags: ModelsSimpleTag[]
  tagGroups: ModelsTagGroup[]
}

export const useTagGroupOperations = (
  hookForm: UseFormReturn<FormValues>,
  setHasUnsavedChanges: (value: boolean) => void,
) => {
  const { t } = useTranslation('tag-manager')
  const { addToast } = useToast()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [copiedTags, setCopiedTags] = useState<CopiedTags | null>(null)

  const addTemplate = () => {
    const tagGroups = hookForm.getValues('tagGroups')
    const simpleTags = hookForm.getValues('simpleTags')

    const newTagGroups = tagGroupTemplate.filter(
      (tag) => tag.type === 'TagGroup',
    ) as ModelsTagGroup[]

    const newSimpleTags = tagGroupTemplate.filter(
      (tag) => tag.type === 'SimpleTag',
    ) as ModelsSimpleTag[]

    hookForm.setValue(
      'tagGroups',
      unionWith(tagGroups, newTagGroups, (a, b) => a.id === b.id),
      { shouldDirty: true },
    )
    hookForm.setValue(
      'simpleTags',
      unionWith(simpleTags, newSimpleTags, (a, b) => a.id === b.id),
      { shouldDirty: true },
    )

    // Expand newly added groups
    const allGroupIds = [...tagGroups, ...newTagGroups].map((g) => g.id)
    setExpandedGroups(new Set(allGroupIds))

    void hookForm.trigger('tagGroups')
    void hookForm.trigger('simpleTags')
    setHasUnsavedChanges(true)
  }

  const removeTagGroup = (index: number) => {
    const tagGroups = hookForm.getValues('tagGroups')
    const group = tagGroups[index]
    if (!group) return
    const removedGroupId = group.id
    tagGroups.splice(index, 1)
    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    void hookForm.trigger('tagGroups')

    // Remove from expanded groups
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.delete(removedGroupId)
      return next
    })

    setHasUnsavedChanges(true)
  }

  const createTagGroup = () => {
    const newTagGroupName = hookForm.getValues('newTagGroupName')
    const tagGroups: ModelsTagGroup[] = hookForm.getValues('tagGroups')
    if (!newTagGroupName) {
      addToast({
        message: t(
          'validation.tagGroupNameRequired',
          'Tag group name is required',
        ),
        type: 'ERROR',
      })
      return false
    }

    if (tagGroups.find((tagGroup) => tagGroup.id === newTagGroupName)) {
      addToast({
        message: t('validation.tagGroupExists', 'Tag group already exists'),
        type: 'ERROR',
      })
      return false
    }

    const newTagGroup: ModelsTagGroup = {
      id: newTagGroupName,
      relatedTags: [],
      type: 'TagGroup',
    }
    tagGroups.push(newTagGroup)
    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    hookForm.setValue('newTagGroupName', '')
    void hookForm.trigger('tagGroups')
    setHasUnsavedChanges(true)

    // Expand the newly created group
    setExpandedGroups((prev) => new Set([...prev, newTagGroupName]))
    return true
  }

  const expandAll = () => {
    const allGroupIds = hookForm.getValues('tagGroups').map((g) => g.id)
    setExpandedGroups(new Set(allGroupIds))
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

    const tagGroups = hookForm.getValues('tagGroups')
    const targetGroup = tagGroups[targetIndex]
    if (!targetGroup) return

    // Merge tags, avoiding duplicates
    const existingTags = targetGroup.relatedTags || []
    const newTags = copiedTags.tags.filter(
      (tag) => !existingTags.some((existing) => existing.id === tag.id),
    )

    targetGroup.relatedTags = [...existingTags, ...newTags]
    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    void hookForm.trigger('tagGroups')
    setHasUnsavedChanges(true)

    addToast({
      message: t('status.tagsPasted', 'Tags pasted'),
      type: 'SUCCESS',
    })

    // Reset copy state after pasting
    setCopiedTags(null)
  }

  const addTagToGroup = (groupIndex: number) => {
    const newTagName = hookForm.getValues('newTagName')
    if (!newTagName.trim()) {
      addToast({
        message: t('validation.tagNameRequired', 'Tag name is required'),
        type: 'ERROR',
      })
      return false
    }

    const tagGroups = hookForm.getValues('tagGroups')
    const targetGroup = tagGroups[groupIndex]
    if (!targetGroup) return false

    if (!targetGroup.relatedTags) {
      targetGroup.relatedTags = []
    }

    // Check for duplicates
    if (targetGroup.relatedTags.some((tag) => tag.id === newTagName.trim())) {
      addToast({
        message: t('validation.tagExists', 'Tag already exists'),
        type: 'ERROR',
      })
      return false
    }

    const newTag: ModelsSimpleTag = {
      id: newTagName.trim(),
      type: 'SimpleTag',
    }
    targetGroup.relatedTags.push(newTag)

    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    hookForm.setValue('newTagName', '')
    void hookForm.trigger('tagGroups')
    setHasUnsavedChanges(true)
    return true
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
  }
}
