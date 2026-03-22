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

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarProject } from '~/components/ui/data-display/avatar/avatar-project'
import {
	DataList,
	DataListField,
	DataListHeaderItem,
	DataListRow,
} from '~/components/ui/data-display/data-list'
import { EmptyStateProjects } from '~/components/ui/data-display/fetch-state/empty-state-projects'
import { ProjectLastActivity } from '~/components/ui/data-display/project-last-activity'
import { ROLES } from '~/config/constants'
import { UserRoles } from '~/config/dynamic-translation-strings'
import { MyProjectsListItemAdminContext } from '~/features/projects/components/my-projects-list-item-admin-context'
import { MyProjectsListItemMemberContext } from '~/features/projects/components/my-projects-list-item-member-context'
import { useProjects } from '~/features/projects/hooks/use-projects'

export type ProjectStatusFilter = 'active' | 'both' | 'inactive'

type Props = {
	searchTerm: string
	statusFilter: ProjectStatusFilter
}

export const MyProjectsList = ({ searchTerm }: Props) => {
	const { t } = useTranslation('common')
	const { userProjects } = useProjects()

	const filteredProjects = useMemo(() => {
		const projects = userProjects()

		if (!searchTerm.trim()) return projects

		const searchLower = searchTerm.toLowerCase()
		return projects.filter((project) =>
			project.projectReference.key.toLowerCase().includes(searchLower),
		)
	}, [userProjects, searchTerm])

	if (userProjects().length === 0) {
		return <EmptyStateProjects />
	}

	return (
		<DataList>
			<DataListRow>
				<DataListHeaderItem />
				<DataListHeaderItem>
					{t('common.forms.name', { defaultValue: 'Name' })}
				</DataListHeaderItem>
				<DataListHeaderItem>
					{t('projects.projectRole', {
						defaultValue: 'Project role',
					})}
				</DataListHeaderItem>
				<DataListHeaderItem>
					{t('projects.lastActivity', {
						defaultValue: 'Last activity',
					})}
				</DataListHeaderItem>
				<DataListHeaderItem />
			</DataListRow>
			{filteredProjects.map((item) => (
				<DataListRow key={item.projectReference.id}>
					<DataListField width={90}>
						<AvatarProject name={item.projectReference.key} />
					</DataListField>
					<DataListField>
						<span>{item.projectReference.key}</span>
					</DataListField>
					<DataListField>
						<span>{UserRoles[item.role]}</span>
					</DataListField>
					<DataListField>
						<ProjectLastActivity />
					</DataListField>
					<DataListField>
						{item.role === ROLES.PROJECT_ADMIN ? (
							<MyProjectsListItemAdminContext item={item} />
						) : (
							<MyProjectsListItemMemberContext item={item} />
						)}
					</DataListField>
				</DataListRow>
			))}
		</DataList>
	)
}
