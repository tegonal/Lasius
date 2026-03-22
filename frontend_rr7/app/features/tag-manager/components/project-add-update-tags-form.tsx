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

import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
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
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'
import { updateProject } from '~/services/api/lasius/projects/projects'
import { getTagsByProject } from '~/services/api/lasius/user-organisations/user-organisations'

import { useTagGroupOperations } from '../hooks/use-tag-group-operations'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'
import { TagGroupEmptyState } from './tag-group-empty-state'
import { TagGroupItem } from './tag-group-item'
import { TagGroupToolbar } from './tag-group-toolbar'

type FormValues = {
	newTagGroupName: string
	newTagName: string
	simpleTags: [] | ModelsSimpleTag[]
	tagGroups: [] | ModelsTagGroup[]
}

type Props = {
	item: ModelsUserProject
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
	const { t } = useTranslation('common')

	const hookForm = useForm<FormValues>({
		defaultValues: {
			newTagGroupName: '',
			newTagName: '',
			simpleTags: [],
			tagGroups: [],
		},
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
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
	} = useTagGroupOperations(hookForm, setHasUnsavedChanges)

	const projectId = item.projectReference.id
	const projectKey = item.projectReference.key
	const projectOrganisationId =
		'organisationReference' in item
			? (item as unknown as { organisationReference: { id: string } })
					.organisationReference.id
			: selectedOrganisationId

	// Initialize form data by fetching tags
	useEffect(() => {
		if (!item || !selectedOrganisationId || !projectId) return

		void (async () => {
			try {
				const response = await getTagsByProject(
					selectedOrganisationId,
					projectId,
				)

				const tagGroups = response.data.filter(
					(tag) => tag.type === 'TagGroup',
				) as [] | ModelsTagGroup[]

				const simpleTags = response.data.filter(
					(tag) => tag.type === 'SimpleTag',
				) as [] | ModelsSimpleTag[]

				hookForm.reset({
					newTagGroupName: '',
					newTagName: '',
					simpleTags,
					tagGroups,
				})

				setExpandedGroups(new Set(tagGroups.map((g) => g.id)))
			} catch (error) {
				logger.error('Error fetching tags', error)
			}
		})()
	}, [
		hookForm,
		item,
		projectId,
		projectKey,
		selectedOrganisationId,
		setExpandedGroups,
	])

	// Form submit
	const onSubmit = async () => {
		setIsSubmitting(true)

		try {
			const bookingCategories = [
				...hookForm.getValues('tagGroups'),
				...hookForm.getValues('simpleTags'),
			]

			logger.info('Updating tags', { bookingCategories, projectId })

			await updateProject(projectOrganisationId, projectId, {
				bookingCategories,
			})

			addToast({
				message: t('projects.status.updated', {
					defaultValue: 'Project updated',
				}),
				type: 'SUCCESS',
			})

			setIsSubmitting(false)
			onSave()
		} catch (error) {
			logger.error('Error updating project tags', error)
			setIsSubmitting(false)
			addToast({
				message: t('common.errors.generic', {
					defaultValue: 'Something went wrong',
				}),
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
	const sortedTagGroups = [...hookForm.watch('tagGroups')].sort((a, b) =>
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
						const index = hookForm
							.getValues('tagGroups')
							.findIndex((g) => g.id === tagGroup.id)
						const isExpanded = expandedGroups.has(tagGroup.id)

						return (
							<TagGroupItem
								index={index}
								isExpanded={isExpanded}
								key={tagGroup.id}
								onAddTag={() => setShowAddTagModal({ groupIndex: index })}
								onCopyTags={() =>
									copyTags(tagGroup.id, tagGroup.relatedTags || [])
								}
								onDelete={() => confirmDeleteTagGroup(index, tagGroup.id)}
								onPasteTags={() => pasteTags(index)}
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
						{t('tags.simpleTagsDescription', {
							defaultValue: 'Tags that are not part of any group',
						})}
					</p>
				</Alert>
				<InputTagsAdmin
					name="simpleTags"
					tags={hookForm.getValues('simpleTags')}
				/>
			</div>
		</ScrollArea>
	)

	const tabs = [
		{
			component: tagGroupsContent,
			label: t('tags.tagGroups', { defaultValue: 'Tag groups' }),
		},
		{
			component: simpleTagsContent,
			label: t('tags.simpleTags', { defaultValue: 'Simple tags' }),
		},
	]

	return (
		<FormProvider {...hookForm}>
			<form
				className="flex h-full flex-col"
				onKeyDown={preventEnterOnForm}
				onSubmit={hookForm.handleSubmit(onSubmit)}
			>
				<div className="flex min-h-0 flex-1 flex-col">
					<ModalCloseButton onClose={handleCancel} />

					<ModalHeader className="mb-4">
						{mode === 'add'
							? t('tags.actions.add', {
									defaultValue: 'Add tags',
								})
							: t('tags.actions.editForProject', {
									defaultValue: 'Edit tags for {{projectKey}}',
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
							{t('common.actions.save', {
								defaultValue: 'Save',
							})}
						</Button>
						<Button onClick={handleCancel} type="button" variant="secondary">
							{t('common.actions.cancel', {
								defaultValue: 'Cancel',
							})}
						</Button>
					</ButtonGroup>
				</div>
			</form>

			{/* Modals */}
			<GenericInputModal
				confirmLabel={t('tags.actions.createTagGroup', {
					defaultValue: 'Create tag group',
				})}
				error={hookForm.formState.errors.newTagGroupName}
				fieldName="newTagGroupName"
				label={t('tags.actions.addTagGroup', {
					defaultValue: 'Add tag group',
				})}
				onClose={() => {
					setShowAddGroupModal(false)
					hookForm.setValue('newTagGroupName', '')
				}}
				onConfirm={handleAddGroupConfirm}
				open={showAddGroupModal}
				placeholder={t('common.forms.name', {
					defaultValue: 'Name',
				})}
				register={hookForm.register}
			/>

			<GenericInputModal
				cancelLabel={t('common.actions.close', {
					defaultValue: 'Close',
				})}
				confirmLabel={t('common.actions.add', {
					defaultValue: 'Add',
				})}
				enableEnterKey
				fieldName="newTagName"
				label={t('tags.actions.addTag', {
					defaultValue: 'Add a tag',
				})}
				onClose={() => {
					setShowAddTagModal(null)
					hookForm.setValue('newTagName', '')
				}}
				onConfirm={handleAddTagConfirm}
				open={!!showAddTagModal}
				placeholder={t('tags.enterTagName', {
					defaultValue: 'Enter tag name',
				})}
				register={hookForm.register}
			/>

			{showDeleteConfirm && (
				<GenericConfirmModal
					cancelLabel={t('common.actions.close', {
						defaultValue: 'Close',
					})}
					confirmLabel={t('common.actions.delete', {
						defaultValue: 'Delete',
					})}
					message={t('tags.confirmDeleteGroup', {
						defaultValue:
							'Are you sure you want to delete the tag group "{{groupName}}"?',
						groupName: showDeleteConfirm.groupName,
					})}
					onClose={() => setShowDeleteConfirm(null)}
					onConfirm={handleDeleteConfirm}
					open
				/>
			)}

			{showCancelConfirm && (
				<GenericConfirmModal
					cancelLabel={t('common.actions.keepEditing', {
						defaultValue: 'Keep editing',
					})}
					confirmLabel={t('common.actions.discardChanges', {
						defaultValue: 'Discard changes',
					})}
					message={t('common.confirmUnsavedChanges', {
						defaultValue:
							'You have unsaved changes. Are you sure you want to cancel?',
					})}
					onClose={() => setShowCancelConfirm(false)}
					onConfirm={confirmCancel}
					open
				/>
			)}
		</FormProvider>
	)
}
