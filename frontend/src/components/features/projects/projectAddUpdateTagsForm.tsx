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
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Heading } from 'components/primitives/typography/Heading'
import { P } from 'components/primitives/typography/Paragraph'
import { Alert } from 'components/ui/feedback/Alert'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { InputTagsAdmin2 } from 'components/ui/forms/input/InputTagsAdmin2'
import { preventEnterOnForm } from 'components/ui/forms/input/shared/preventEnterOnForm'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Tabs } from 'components/ui/navigation/Tabs'
import { GenericConfirmModal } from 'components/ui/overlays/modal/GenericConfirmModal'
import { GenericInputModal } from 'components/ui/overlays/modal/GenericInputModal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsProject, ModelsSimpleTag, ModelsTagGroup, ModelsUserProject } from 'lib/api/lasius'
import { getGetProjectListKey, updateProject } from 'lib/api/lasius/projects/projects'
import {
  getTagsByProject,
  useGetTagsByProject,
} from 'lib/api/lasius/user-organisations/user-organisations'
import { getGetUserProfileKey } from 'lib/api/lasius/user/user'
import { logger } from 'lib/logger'
import { HelpCircle } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useHelpStore } from 'stores/helpStore'
import { useSWRConfig } from 'swr'

import { TagGroupEmptyState } from './tagManager/TagGroupEmptyState'
import { TagGroupItem } from './tagManager/TagGroupItem'
import { TagGroupToolbar } from './tagManager/TagGroupToolbar'
import { useTagGroupOperations } from './tagManager/useTagGroupOperations'
import { useUnsavedChanges } from './tagManager/useUnsavedChanges'

type Props = {
  item?: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onSave: () => void
  onCancel: () => void
}

type FormValues = {
  newTagGroupName: string
  newTagName: string
  tagGroups: ModelsTagGroup[] | []
  simpleTags: ModelsSimpleTag[] | []
}

export const ProjectAddUpdateTagsForm: React.FC<Props> = ({ item, onSave, onCancel, mode }) => {
  const { t } = useTranslation('common')
  const { openHelp } = useHelpStore()

  const hookForm = useForm<FormValues>({
    defaultValues: {
      newTagGroupName: '',
      newTagName: '',
      tagGroups: [],
      simpleTags: [],
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showAddTagModal, setShowAddTagModal] = useState<{ groupIndex: number } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    groupIndex: number
    groupName: string
  } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()
  const { mutate } = useSWRConfig()

  // Custom hooks
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges()
  const {
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
  } = useTagGroupOperations(hookForm, setHasUnsavedChanges)

  const projectId = (item && 'id' in item ? item.id : item?.projectReference.id) || ''
  const projectKey = (item && 'key' in item ? item.key : item?.projectReference.key) || ''
  const projectOrganisationId =
    (item && 'organisationReference' in item
      ? item.organisationReference.id
      : selectedOrganisationId) || selectedOrganisationId

  const bookingCategories = useGetTagsByProject(selectedOrganisationId, projectId)

  // Initialize form data
  useEffect(() => {
    if (item && bookingCategories.data) {
      const tagGroups = bookingCategories.data.filter((tag) => tag.type === 'TagGroup') as
        | ModelsTagGroup[]
        | []

      const simpleTags = bookingCategories.data.filter((tag) => tag.type === 'SimpleTag') as
        | ModelsSimpleTag[]
        | []

      hookForm.reset({
        newTagGroupName: '',
        newTagName: '',
        tagGroups,
        simpleTags,
      })

      setExpandedGroups(new Set(tagGroups.map((g) => g.id)))
    }
  }, [bookingCategories.data, hookForm, item, projectKey, setExpandedGroups])

  // Form submit
  const onSubmit = async () => {
    setIsSubmitting(true)

    try {
      const bookingCategories = [
        ...hookForm.getValues('tagGroups'),
        ...hookForm.getValues('simpleTags'),
      ]

      logger.info('Updating tags', { projectId, bookingCategories })

      await updateProject(projectOrganisationId, projectId, {
        ...item,
        bookingCategories,
      })

      addToast({
        message: t('projects.status.updated', { defaultValue: 'Project updated' }),
        type: 'SUCCESS',
      })

      await mutate(getGetProjectListKey(projectOrganisationId))
      await mutate(getGetUserProfileKey())
      await mutate(getTagsByProject(selectedOrganisationId, projectId))

      setIsSubmitting(false)
      onSave()
    } catch (error) {
      logger.error('Error updating project tags', error)
      setIsSubmitting(false)
      addToast({
        message: t('common.errors.generic', { defaultValue: 'Something went wrong' }),
        type: 'ERROR',
      })
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges || hookForm.formState.isDirty) {
      setShowCancelConfirm(true)
    } else {
      onCancel()
    }
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    onCancel()
  }

  const handleAddGroupConfirm = () => {
    const success = createTagGroup()
    if (success) {
      setShowAddGroupModal(false)
    }
  }

  const handleAddTagConfirm = () => {
    if (!showAddTagModal) return
    const success = addTagToGroup(showAddTagModal.groupIndex)
    if (success) {
      setShowAddTagModal(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (!showDeleteConfirm) return
    removeTagGroup(showDeleteConfirm.groupIndex)
    setShowDeleteConfirm(null)
  }

  const confirmDeleteTagGroup = (index: number, groupName: string) => {
    setShowDeleteConfirm({ groupIndex: index, groupName })
  }

  // Sort tag groups alphabetically
  const sortedTagGroups = [...hookForm.watch('tagGroups')].sort((a, b) => a.id.localeCompare(b.id))

  // Tab content
  const tagGroupsContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      <TagGroupToolbar
        onAddGroup={() => setShowAddGroupModal(true)}
        onAddPresets={addTemplate}
        onToggleAll={expandedGroups.size === sortedTagGroups.length ? collapseAll : expandAll}
        showToggleAll={sortedTagGroups.length > 0}
        allExpanded={expandedGroups.size === sortedTagGroups.length}
      />

      <ScrollContainer className="min-h-0 flex-1 pr-2">
        <div className="space-y-2 pb-4">
          {sortedTagGroups.length === 0 && <TagGroupEmptyState />}

          {sortedTagGroups.map((tagGroup: ModelsTagGroup) => {
            const index = hookForm.getValues('tagGroups').findIndex((g) => g.id === tagGroup.id)
            const isExpanded = expandedGroups.has(tagGroup.id)

            return (
              <TagGroupItem
                key={tagGroup.id}
                tagGroup={tagGroup}
                index={index}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(tagGroup.id)}
                onDelete={() => confirmDeleteTagGroup(index, tagGroup.id)}
                onAddTag={() => setShowAddTagModal({ groupIndex: index })}
                onCopyTags={() => copyTags(tagGroup.id, tagGroup.relatedTags || [])}
                onPasteTags={() => pasteTags(index)}
                showPasteButton={!!copiedTags && copiedTags.fromGroupId !== tagGroup.id}
              />
            )
          })}
        </div>
      </ScrollContainer>
    </div>
  )

  const simpleTagsContent = (
    <ScrollContainer className="min-h-0 flex-1 pr-2">
      <div className="space-y-6 pb-4">
        <Alert variant="info">
          <P>
            {t('tags.simpleTagsDescription', {
              defaultValue: 'Tags that are not part of any group',
            })}
          </P>
        </Alert>
        <InputTagsAdmin2 tags={hookForm.getValues('simpleTags')} name="simpleTags" />
      </div>
    </ScrollContainer>
  )

  const tabs = [
    {
      label: t('tags.tagGroups', { defaultValue: 'Tag groups' }),
      component: tagGroupsContent,
    },
    {
      label: t('tags.simpleTags', { defaultValue: 'Simple tags' }),
      component: simpleTagsContent,
    },
  ]

  return (
    <FormProvider {...hookForm}>
      <form
        onSubmit={hookForm.handleSubmit(onSubmit)}
        onKeyDown={preventEnterOnForm}
        className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <Heading variant="h2" as="h2">
              {mode === 'add'
                ? t('tags.actions.add', { defaultValue: 'Add tags' })
                : t('tags.actions.editForProject', {
                    defaultValue: 'Edit tags for {{projectKey}}',
                    projectKey,
                  })}
            </Heading>
            <Button
              type="button"
              variant="ghost"
              shape="circle"
              size="sm"
              onClick={() => openHelp('modal-edit-tags')}
              fullWidth={false}>
              <LucideIcon icon={HelpCircle} size={20} />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <Tabs tabs={tabs} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-base-300 mt-auto flex-shrink-0 border-t pt-4">
          <ButtonGroup>
            <Button type="submit" disabled={isSubmitting} className="relative z-0">
              {t('common.actions.save', { defaultValue: 'Save' })}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {t('common.actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
          </ButtonGroup>
        </div>
      </form>

      {/* Modals */}
      <GenericInputModal
        open={showAddGroupModal}
        onClose={() => {
          setShowAddGroupModal(false)
          hookForm.setValue('newTagGroupName', '')
        }}
        onConfirm={handleAddGroupConfirm}
        register={hookForm.register}
        fieldName="newTagGroupName"
        label={t('tags.actions.addTagGroup', { defaultValue: 'Add tag group' })}
        placeholder={t('common.forms.name', { defaultValue: 'Name' })}
        confirmLabel={t('tags.actions.createTagGroup', { defaultValue: 'Create tag group' })}
        cancelLabel={t('common.actions.cancel', { defaultValue: 'Cancel' })}
        error={hookForm.formState.errors.newTagGroupName}
      />

      <GenericInputModal
        open={!!showAddTagModal}
        onClose={() => {
          setShowAddTagModal(null)
          hookForm.setValue('newTagName', '')
        }}
        onConfirm={handleAddTagConfirm}
        register={hookForm.register}
        fieldName="newTagName"
        label={t('tags.actions.addTag', { defaultValue: 'Add a tag' })}
        placeholder={t('tags.enterTagName', { defaultValue: 'Enter tag name' })}
        confirmLabel={t('common.actions.add', { defaultValue: 'Add' })}
        cancelLabel={t('common.actions.cancel', { defaultValue: 'Cancel' })}
        enableEnterKey
      />

      {showDeleteConfirm && (
        <GenericConfirmModal
          open
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={handleDeleteConfirm}
          message={t('tags.confirmDeleteGroup', {
            defaultValue: 'Are you sure you want to delete the tag group "{{groupName}}"?',
            groupName: showDeleteConfirm.groupName,
          })}
          confirmLabel={t('common.actions.delete', { defaultValue: 'Delete' })}
          cancelLabel={t('common.actions.cancel', { defaultValue: 'Cancel' })}
        />
      )}

      {showCancelConfirm && (
        <GenericConfirmModal
          open
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={confirmCancel}
          message={t('common.confirmUnsavedChanges', {
            defaultValue: 'You have unsaved changes. Are you sure you want to cancel?',
          })}
          confirmLabel={t('common.actions.discardChanges', { defaultValue: 'Discard changes' })}
          cancelLabel={t('common.actions.keepEditing', { defaultValue: 'Keep editing' })}
        />
      )}
    </FormProvider>
  )
}
