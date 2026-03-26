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
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Alert } from '~/components/ui/feedback/alert'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { InputTagsAdmin } from '~/components/ui/forms/input/input-tags-admin'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { Tabs } from '~/components/ui/navigation/tabs'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { GenericInputModal } from '~/components/ui/overlays/modal/generic-input-modal'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { logger } from '~/lib/logger'
import { useUpdateProject } from '~/services/api/lasius-hooks/projects/projects'
import { useGetTagsByProject } from '~/services/api/lasius-hooks/user-organisations/user-organisations'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

import { useTagGroupOperations } from '../hooks/use-tag-group-operations'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'
import { TagGroupEmptyState } from './tag-group-empty-state'
import { TagGroupItem } from './tag-group-item'
import { TagGroupToolbar } from './tag-group-toolbar'

type Props = {
  item: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onCancel: () => void
  onSave: () => void
}

const preventEnterOnForm = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
    e.preventDefault()
  }
}

export const ProjectAddUpdateTagsForm = ({
  item,
  mode,
  onCancel,
  onSave,
}: Props) => {
  const { t } = useTranslation(['tag-manager', 'projects'])

  const [tagGroups, setTagGroups] = useState<ModelsTagGroup[]>([])
  const [simpleTags, setSimpleTags] = useState<ModelsSimpleTag[]>([])
  const [newTagGroupName, setNewTagGroupName] = useState('')
  const [newTagName, setNewTagName] = useState('')

  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showAddTagModal, setShowAddTagModal] = useState<null | {
    groupIndex: number
  }>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<null | {
    groupIndex: number
    groupName: string
  }>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()

  const tagsFetcher = useGetTagsByProject()
  const updateProjectFetcher = useUpdateProject({
    onSuccess: () => {
      addToast({
        message: t('projects:status.updated', 'Project updated'),
        type: 'SUCCESS',
      })
      onSave()
    },
  })
  const isSubmitting = updateProjectFetcher.isLoading

  // Custom hooks
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges()
  const {
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
  } = useTagGroupOperations(
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

  const projectId =
    'projectReference' in item ? item.projectReference.id : item.id
  const projectKey =
    'projectReference' in item ? item.projectReference.key : item.key
  const projectOrganisationId =
    'organisationReference' in item
      ? (item as unknown as { organisationReference: { id: string } })
          .organisationReference.id
      : selectedOrganisationId

  // Load tags via Orval hook
  const loadedRef = useRef(false)
  useEffect(() => {
    if (!item || !selectedOrganisationId || !projectId || loadedRef.current)
      return
    loadedRef.current = true
    tagsFetcher.submit({
      orgId: selectedOrganisationId,
      projectId,
    })
  }, [item, projectId, selectedOrganisationId, tagsFetcher])

  // Initialize state when tags arrive
  useEffect(() => {
    if (!tagsFetcher.isSuccess || !tagsFetcher.data) return

    const tags = tagsFetcher.data

    const groups = tags.filter((tag) => tag.type === 'TagGroup') as
      | []
      | ModelsTagGroup[]

    const simple = tags.filter((tag) => tag.type === 'SimpleTag') as
      | []
      | ModelsSimpleTag[]

    setTagGroups(groups)
    setSimpleTags(simple)
    setNewTagGroupName('')
    setNewTagName('')
    setExpandedGroups(new Set(groups.map((g) => g.id)))
  }, [tagsFetcher.isSuccess, tagsFetcher.data, setExpandedGroups])

  // Form submit via Orval hook
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const bookingCategories = [...tagGroups, ...simpleTags]

    logger.info('Updating tags', { bookingCategories, projectId })

    updateProjectFetcher.submit({
      body: { bookingCategories },
      orgId: projectOrganisationId,
      projectId,
    })
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
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

  const handleSimpleTagsChange = (tags: ModelsTag[]) => {
    setSimpleTags(tags as ModelsSimpleTag[])
    setHasUnsavedChanges(true)
  }

  // Sort tag groups alphabetically
  const sortedTagGroups = [...tagGroups].toSorted((a, b) =>
    a.id.localeCompare(b.id),
  )

  // Tab content
  const tagGroupsContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      <TagGroupToolbar
        allExpanded={expandedGroups.size === sortedTagGroups.length}
        onAddGroup={() => setShowAddGroupModal(true)}
        onAddPresets={addTemplate}
        onToggleAll={
          expandedGroups.size === sortedTagGroups.length
            ? collapseAll
            : expandAll
        }
        showToggleAll={sortedTagGroups.length > 0}
      />

      <ScrollArea className="min-h-0 flex-1 pr-2">
        <div className="space-y-2 pb-4">
          {sortedTagGroups.length === 0 && <TagGroupEmptyState />}

          {sortedTagGroups.map((tagGroup: ModelsTagGroup) => {
            const index = tagGroups.findIndex((g) => g.id === tagGroup.id)
            const isExpanded = expandedGroups.has(tagGroup.id)

            return (
              <TagGroupItem
                isExpanded={isExpanded}
                key={tagGroup.id}
                onAddTag={() => setShowAddTagModal({ groupIndex: index })}
                onCopyTags={() =>
                  copyTags(tagGroup.id, tagGroup.relatedTags || [])
                }
                onDelete={() => confirmDeleteTagGroup(index, tagGroup.id)}
                onPasteTags={() => pasteTags(index)}
                onTagsChange={(tags) =>
                  updateTagGroupTags(index, tags as ModelsSimpleTag[])
                }
                onToggle={() => toggleGroup(tagGroup.id)}
                showPasteButton={
                  !!copiedTags && copiedTags.fromGroupId !== tagGroup.id
                }
                tagGroup={tagGroup}
              />
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )

  const simpleTagsContent = (
    <ScrollArea className="min-h-0 flex-1 pr-2">
      <div className="space-y-6 pb-4">
        <Alert variant="info">
          <p>
            {t('simpleTagsDescription', 'Tags that are not part of any group')}
          </p>
        </Alert>
        <InputTagsAdmin
          onTagsChange={handleSimpleTagsChange}
          tags={simpleTags}
        />
      </div>
    </ScrollArea>
  )

  const tabs = [
    {
      component: tagGroupsContent,
      label: t('tagGroups', 'Tag groups'),
    },
    {
      component: simpleTagsContent,
      label: t('simpleTags', 'Simple tags'),
    },
  ]

  return (
    <>
      <form
        className="flex h-full flex-col"
        onKeyDown={preventEnterOnForm}
        onSubmit={onSubmit}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <ModalCloseButton onClose={handleCancel} />

          <ModalHeader className="mb-4">
            {mode === 'add'
              ? t('actions.addTags', 'Add tags')
              : t('actions.editForProject', 'Edit tags for {{projectKey}}', {
                  projectKey,
                })}
          </ModalHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <Tabs tabs={tabs} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-base-300 mt-auto flex-shrink-0 border-t pt-4">
          <ButtonGroup>
            <Button
              className="relative z-0"
              disabled={isSubmitting}
              type="submit"
            >
              {t('actions.save', 'Save')}
            </Button>
            <Button onClick={handleCancel} type="button" variant="secondary">
              {t('actions.cancel', 'Cancel')}
            </Button>
          </ButtonGroup>
        </div>
      </form>

      {/* Modals */}
      <GenericInputModal
        confirmLabel={t('actions.createTagGroup', 'Create tag group')}
        label={t('actions.addTagGroup', 'Add tag group')}
        onChange={setNewTagGroupName}
        onClose={() => {
          setShowAddGroupModal(false)
          setNewTagGroupName('')
        }}
        onConfirm={handleAddGroupConfirm}
        open={showAddGroupModal}
        placeholder={t('forms.name', 'Name')}
        value={newTagGroupName}
      />

      <GenericInputModal
        cancelLabel={t('actions.close', 'Close')}
        confirmLabel={t('actions.add', 'Add')}
        enableEnterKey
        label={t('actions.addTag', 'Add a tag')}
        onChange={setNewTagName}
        onClose={() => {
          setShowAddTagModal(null)
          setNewTagName('')
        }}
        onConfirm={handleAddTagConfirm}
        open={!!showAddTagModal}
        placeholder={t('enterTagName', 'Enter tag name')}
        value={newTagName}
      />

      {showDeleteConfirm && (
        <GenericConfirmModal
          cancelLabel={t('actions.close', 'Close')}
          confirmLabel={t('actions.delete', 'Delete')}
          message={t(
            'confirmDeleteGroup',
            'Are you sure you want to delete the tag group "{{groupName}}"?',
            { groupName: showDeleteConfirm.groupName },
          )}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={handleDeleteConfirm}
          open
        />
      )}

      {showCancelConfirm && (
        <GenericConfirmModal
          cancelLabel={t('actions.keepEditing', 'Keep editing')}
          confirmLabel={t('actions.discardChanges', 'Discard changes')}
          message={t(
            'confirmUnsavedChanges',
            'You have unsaved changes. Are you sure you want to cancel?',
          )}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={confirmCancel}
          open
        />
      )}
    </>
  )
}
