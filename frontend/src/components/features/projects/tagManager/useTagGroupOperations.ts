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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import { isEqual, unionWith } from 'es-toolkit/compat'
import { ModelsSimpleTag, ModelsTagGroup } from 'lib/api/lasius'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { tagGroupTemplate } from './tagGroupTemplate'

type FormValues = {
  tagGroups: ModelsTagGroup[]
  simpleTags: ModelsSimpleTag[]
  newTagGroupName: string
  newTagName: string
}

type CopiedTags = {
  tags: ModelsSimpleTag[]
  fromGroupId: string
}

export const useTagGroupOperations = (
  hookForm: UseFormReturn<FormValues>,
  setHasUnsavedChanges: (value: boolean) => void,
) => {
  const { t } = useTranslation('common')
  const { addToast } = useToast()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [copiedTags, setCopiedTags] = useState<CopiedTags | null>(null)

  const addTemplate = () => {
    const tagGroups = hookForm.getValues('tagGroups')
    const simpleTags = hookForm.getValues('simpleTags')

    const newTagGroups = tagGroupTemplate.filter((tag) => tag.type === 'TagGroup') as
      | ModelsTagGroup[]
      | []

    const newSimpleTags = tagGroupTemplate.filter((tag) => tag.type === 'SimpleTag') as
      | ModelsSimpleTag[]
      | []

    hookForm.setValue('tagGroups', unionWith(tagGroups, newTagGroups, isEqual), {
      shouldDirty: true,
    })
    hookForm.setValue('simpleTags', unionWith(simpleTags, newSimpleTags, isEqual), {
      shouldDirty: true,
    })

    // Expand newly added groups
    const allGroupIds = [...tagGroups, ...newTagGroups].map((g) => g.id)
    setExpandedGroups(new Set(allGroupIds))

    hookForm.trigger('tagGroups')
    hookForm.trigger('simpleTags')
    setHasUnsavedChanges(true)
  }

  const removeTagGroup = (index: number) => {
    const tagGroups = hookForm.getValues('tagGroups')
    const removedGroupId = tagGroups[index].id
    tagGroups.splice(index, 1)
    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    hookForm.trigger('tagGroups')

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
        message: t('tags.validation.tagGroupNameRequired', { defaultValue: 'Tag group name is required' }),
        type: 'ERROR',
      })
      return false
    }

    if (tagGroups.find((tagGroup) => tagGroup.id === newTagGroupName)) {
      addToast({
        message: t('tags.validation.tagGroupExists', { defaultValue: 'Tag group already exists' }),
        type: 'ERROR',
      })
      return false
    }

    const newTagGroup: ModelsTagGroup = {
      id: newTagGroupName,
      type: 'TagGroup',
      relatedTags: [],
    }
    tagGroups.push(newTagGroup)
    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    hookForm.setValue('newTagGroupName', '')
    hookForm.trigger('tagGroups')
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
    setCopiedTags({ tags, fromGroupId: groupId })
    addToast({
      message: t('tags.status.tagsCopied', { defaultValue: 'Tags copied' }),
      type: 'SUCCESS',
    })
  }

  const pasteTags = (targetIndex: number) => {
    if (!copiedTags) return

    const tagGroups = hookForm.getValues('tagGroups')
    const targetGroup = tagGroups[targetIndex]

    // Merge tags, avoiding duplicates
    const existingTags = targetGroup.relatedTags || []
    const newTags = copiedTags.tags.filter(
      (tag) => !existingTags.some((existing) => existing.id === tag.id),
    )

    targetGroup.relatedTags = [...existingTags, ...newTags]
    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    hookForm.trigger('tagGroups')
    setHasUnsavedChanges(true)

    addToast({
      message: t('tags.status.tagsPasted', {
        defaultValue: 'Tags pasted',
      }),
      type: 'SUCCESS',
    })

    // Reset copy state after pasting
    setCopiedTags(null)
  }

  const addTagToGroup = (groupIndex: number) => {
    const newTagName = hookForm.getValues('newTagName')
    if (!newTagName.trim()) {
      addToast({
        message: t('tags.validation.tagNameRequired', { defaultValue: 'Tag name is required' }),
        type: 'ERROR',
      })
      return false
    }

    const tagGroups = hookForm.getValues('tagGroups')
    const targetGroup = tagGroups[groupIndex]

    if (!targetGroup.relatedTags) {
      targetGroup.relatedTags = []
    }

    // Check for duplicates
    if (targetGroup.relatedTags.some((tag) => tag.id === newTagName.trim())) {
      addToast({
        message: t('tags.validation.tagExists', { defaultValue: 'Tag already exists' }),
        type: 'ERROR',
      })
      return false
    }

    const newTag: ModelsSimpleTag = { id: newTagName.trim(), type: 'SimpleTag' }
    targetGroup.relatedTags.push(newTag)

    hookForm.setValue('tagGroups', tagGroups, { shouldDirty: true })
    hookForm.setValue('newTagName', '')
    hookForm.trigger('tagGroups')
    setHasUnsavedChanges(true)
    return true
  }

  return {
    expandedGroups,
    setExpandedGroups,
    copiedTags,
    addTemplate,
    removeTagGroup,
    createTagGroup,
    expandAll,
    collapseAll,
    toggleGroup,
    copyTags,
    pasteTags,
    addTagToGroup,
  }
}
