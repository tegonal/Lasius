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

import { List, Pencil, PieChart, Tags, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonLeaveProject } from '~/features/context-menu/buttons/context-button-leave-project'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { ManageProjectMembers } from '~/features/projects/components/manage-members'
import { ProjectAddUpdateForm } from '~/features/projects/components/project-add-update-form'
import { ProjectAddUpdateTagsForm } from '~/features/tag-manager/components/project-add-update-tags-form'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

type Props = {
	item: ModelsUserProject
}

export const MyProjectsListItemAdminContext = ({ item }: Props) => {
	const [isUpdateOpen, setIsUpdateOpen] = useState(false)
	const [isManageOpen, setIsManageOpen] = useState(false)
	const [isTagOpen, setIsTagOpen] = useState(false)
	const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
	const navigate = useNavigate()

	const { t } = useTranslation('common')

	const handleUpdateClose = () => setIsUpdateOpen(false)
	const handleManageClose = () => setIsManageOpen(false)
	const handleTagClose = () => setIsTagOpen(false)

	const showStats = () => {
		void navigate(
			`/user/stats?projectId=${item.projectReference.id}&projectName=${encodeURIComponent(item.projectReference.key)}`,
		)
		handleCloseAll()
	}

	const showLists = () => {
		void navigate(
			`/user/lists?projectId=${item.projectReference.id}&projectName=${encodeURIComponent(item.projectReference.key)}`,
		)
		handleCloseAll()
	}

	const manageMembers = () => {
		setIsManageOpen(true)
		handleCloseAll()
	}

	const manageTags = () => {
		setIsTagOpen(true)
		handleCloseAll()
	}

	const editProject = () => {
		setIsUpdateOpen(true)
		handleCloseAll()
	}

	return (
		<>
			<ContextBody variant="compact">
				<ContextButtonOpen
					data-testid="project-ctx-open-btn"
					hash={item.projectReference.id}
				/>
				{currentOpenContextMenuId === item.projectReference.id && (
					<ContextAnimatePresence variant="compact">
						<ContextBar>
							<ContextButtonWrapper variant="compact">
								<Button
									aria-label={t('members.actions.manage', {
										defaultValue: 'Manage members',
									})}
									fullWidth={false}
									onClick={() => manageMembers()}
									shape="circle"
									title={t('members.actions.manage', {
										defaultValue: 'Manage members',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={Users} size={24} />
								</Button>
							</ContextButtonWrapper>
							<ContextButtonWrapper variant="compact">
								<Button
									aria-label={t('bookings.showLists', {
										defaultValue: 'Show bookings',
									})}
									fullWidth={false}
									onClick={() => showLists()}
									shape="circle"
									title={t('bookings.showLists', {
										defaultValue: 'Show bookings',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={List} size={24} />
								</Button>
							</ContextButtonWrapper>
							<ContextButtonWrapper variant="compact">
								<Button
									aria-label={t('statistics.showStatistics', {
										defaultValue: 'Show statistics',
									})}
									fullWidth={false}
									onClick={() => showStats()}
									shape="circle"
									title={t('statistics.showStatistics', {
										defaultValue: 'Show statistics',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={PieChart} size={24} />
								</Button>
							</ContextButtonWrapper>
							<ContextButtonWrapper variant="compact">
								<Button
									aria-label={t('projects.actions.edit', {
										defaultValue: 'Edit project',
									})}
									data-testid="project-ctx-edit-btn"
									fullWidth={false}
									onClick={() => editProject()}
									shape="circle"
									title={t('projects.actions.edit', {
										defaultValue: 'Edit project',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={Pencil} size={24} />
								</Button>
							</ContextButtonWrapper>
							<ContextButtonWrapper variant="compact">
								<Button
									aria-label={t('tags.actions.edit', {
										defaultValue: 'Edit tags',
									})}
									fullWidth={false}
									onClick={() => manageTags()}
									shape="circle"
									title={t('tags.actions.edit', {
										defaultValue: 'Edit tags',
									})}
									variant="contextIcon"
								>
									<LucideIcon icon={Tags} size={24} />
								</Button>
							</ContextButtonWrapper>
							<ContextButtonLeaveProject item={item} variant="compact" />
							<ContextBarDivider />
							<ContextButtonClose variant="compact" />
						</ContextBar>
					</ContextAnimatePresence>
				)}
			</ContextBody>
			<Modal onClose={handleUpdateClose} open={isUpdateOpen}>
				<ProjectAddUpdateForm
					item={item}
					mode="update"
					onCancel={handleUpdateClose}
					onSave={handleUpdateClose}
				/>
			</Modal>
			<Modal onClose={handleTagClose} open={isTagOpen} size="lg">
				<ProjectAddUpdateTagsForm
					item={item}
					mode="update"
					onCancel={handleTagClose}
					onSave={handleTagClose}
				/>
			</Modal>
			<Modal onClose={handleManageClose} open={isManageOpen} size="xl">
				<ManageProjectMembers
					item={item}
					onCancel={handleManageClose}
					onSave={handleManageClose}
				/>
			</Modal>
		</>
	)
}
