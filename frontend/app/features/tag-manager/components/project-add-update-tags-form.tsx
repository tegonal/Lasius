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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Alert } from '~/components/ui/feedback/alert'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { preventEnterOnForm } from '~/components/ui/forms/input/prevent-enter-on-form'
import { Tabs } from '~/components/ui/navigation/tabs'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { GenericInputModal } from '~/components/ui/overlays/modal/generic-input-modal'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { InputTagsAdmin } from '~/features/tags/components/input-tags-admin'
import { logger } from '~/lib/logger'
import { useUpdateProject } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsProject } from '~/services/api/lasius/modelsProject'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

import { useProjectTagsEditor } from '../hooks/use-project-tags-editor'
import { getTagDialogFlags, type TagDialog } from '../lib/tag-dialog'
import { TagGroupsTab } from './tag-groups-tab'

type Properties = {
  item: ModelsProject | ModelsUserProject
  mode: 'add' | 'update'
  onCancel: () => void
  onSave: () => void
}

type TagsEditor = ReturnType<typeof useProjectTagsEditor>

export const ProjectAddUpdateTagsForm = ({ item, mode, onCancel, onSave }: Properties) => {
  const { t } = useTranslation(['tag-manager', 'projects'])

  const [dialog, setDialog] = useState<TagDialog>(null)
  const { addToast } = useToast()
  const {
    bookingCategories,
    changeSimpleTags,
    hasUnsavedChanges,
    newTagGroupName,
    newTagName,
    operations,
    references: { organisationId, projectId, projectKey },
    setNewTagGroupName,
    setNewTagName,
    simpleTags,
    tagGroups,
  } = useProjectTagsEditor(item)

  const { isLoading: isSubmitting, submit: submitProject } = useUpdateProject({
    onSuccess: () => {
      addToast({
        message: t('projects:status.updated', 'Project updated'),
        type: 'SUCCESS',
      })
      onSave()
    },
  })

  const onSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    logger.info('Updating tags', { bookingCategories, projectId })
    submitProject({ body: { bookingCategories }, orgId: organisationId, projectId })
  }

  const closeDialog = () => setDialog(null)

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setDialog({ kind: 'cancel' })
    } else {
      onCancel()
    }
  }

  const handleAddGroupConfirm = () => {
    if (operations.createTagGroup()) closeDialog()
  }

  const handleAddTagConfirm = () => {
    if (dialog?.kind !== 'addTag') return
    if (operations.addTagToGroup(dialog.groupIndex)) closeDialog()
  }

  const handleDeleteConfirm = () => {
    if (dialog?.kind !== 'deleteGroup') return
    operations.removeTagGroup(dialog.groupIndex)
    closeDialog()
  }

  const dialogFlags = getTagDialogFlags(dialog)

  return (
    <>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
        <div
          className="flex min-h-0 flex-1 flex-col"
          onKeyDown={preventEnterOnForm}
          role="presentation">
          <div className="flex min-h-0 flex-1 flex-col">
            <ModalCloseButton onClose={handleCancel} />
            <ModalHeader
              actionSlot={<ModalHelpButton helpKey="modal-edit-tags" />}
              className="mb-4">
              <TagFormTitle mode={mode} projectKey={projectKey} />
            </ModalHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              <TagManagerTabs
                changeSimpleTags={changeSimpleTags}
                operations={operations}
                setDialog={setDialog}
                simpleTags={simpleTags}
                tagGroups={tagGroups}
              />
            </div>
          </div>

          <div className="border-base-300 mt-auto flex-shrink-0 border-t pt-4">
            <ButtonGroup>
              <Button
                className="relative z-0"
                data-testid="tag-manager-save-btn"
                disabled={isSubmitting}
                type="submit">
                {t('actions.save', 'Save')}
              </Button>
              <Button
                data-testid="tag-manager-cancel-btn"
                onClick={handleCancel}
                type="button"
                variant="secondary">
                {t('actions.cancel', 'Cancel')}
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </form>

      <GenericInputModal
        confirmLabel={t('actions.createTagGroup', 'Create tag group')}
        label={t('actions.addTagGroup', 'Add tag group')}
        onChange={setNewTagGroupName}
        onClose={() => {
          closeDialog()
          setNewTagGroupName('')
        }}
        onConfirm={handleAddGroupConfirm}
        open={dialogFlags.isAddGroupOpen}
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
          closeDialog()
          setNewTagName('')
        }}
        onConfirm={handleAddTagConfirm}
        open={dialogFlags.isAddTagOpen}
        placeholder={t('enterTagName', 'Enter tag name')}
        value={newTagName}
      />

      {dialogFlags.deleteGroupName !== null && (
        <GenericConfirmModal
          cancelLabel={t('actions.close', 'Close')}
          confirmLabel={t('actions.delete', 'Delete')}
          message={t(
            'confirmDeleteGroup',
            'Are you sure you want to delete the tag group "{{groupName}}"?',
            { groupName: dialogFlags.deleteGroupName },
          )}
          onClose={closeDialog}
          onConfirm={handleDeleteConfirm}
          open
        />
      )}

      {dialogFlags.isCancelOpen && (
        <GenericConfirmModal
          cancelLabel={t('actions.keepEditing', 'Keep editing')}
          confirmLabel={t('actions.discardChanges', 'Discard changes')}
          message={t(
            'confirmUnsavedChanges',
            'You have unsaved changes. Are you sure you want to cancel?',
          )}
          onClose={closeDialog}
          onConfirm={() => {
            closeDialog()
            onCancel()
          }}
          open
        />
      )}
    </>
  )
}

const TagFormTitle = ({ mode, projectKey }: { mode: 'add' | 'update'; projectKey: string }) => {
  const { t } = useTranslation(['tag-manager', 'projects'])
  return mode === 'add'
    ? t('actions.addTags', 'Add tags')
    : t('actions.editForProject', 'Edit tags for {{projectKey}}', { projectKey })
}

const TagManagerTabs = ({
  changeSimpleTags,
  operations,
  setDialog,
  simpleTags,
  tagGroups,
}: Pick<TagsEditor, 'changeSimpleTags' | 'operations' | 'simpleTags' | 'tagGroups'> & {
  setDialog: (dialog: TagDialog) => void
}) => {
  const { t } = useTranslation(['tag-manager', 'projects'])
  const tabs = [
    {
      component: (
        <TagGroupsTab
          copiedFromGroupId={operations.copiedTags?.fromGroupId ?? null}
          expandedGroups={operations.expandedGroups}
          onAddGroup={() => setDialog({ kind: 'addGroup' })}
          onAddPresets={operations.addTemplate}
          onAddTag={(groupIndex) => setDialog({ groupIndex, kind: 'addTag' })}
          onCollapseAll={operations.collapseAll}
          onCopyTags={(group) => operations.copyTags(group.id, group.relatedTags || [])}
          onDeleteGroup={(groupIndex, groupName) =>
            setDialog({ groupIndex, groupName, kind: 'deleteGroup' })
          }
          onExpandAll={operations.expandAll}
          onPasteTags={operations.pasteTags}
          onTagsChange={operations.updateTagGroupTags}
          onToggleGroup={operations.toggleGroup}
          tagGroups={tagGroups}
        />
      ),
      label: t('tagGroups', 'Tag groups'),
    },
    {
      component: (
        <ModalBody className="min-h-0 flex-1 pr-2">
          <div className="space-y-6 pb-4">
            <Alert variant="info">
              <p>{t('simpleTagsDescription', 'Tags that are not part of any group')}</p>
            </Alert>
            <InputTagsAdmin onTagsChange={changeSimpleTags} tags={simpleTags} />
          </div>
        </ModalBody>
      ),
      label: t('simpleTags', 'Simple tags'),
    },
  ]
  return <Tabs tabs={tabs} />
}
