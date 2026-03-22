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

import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { useProjects } from '~/features/projects/hooks/use-projects'
import { StatsGroup } from '~/features/stats/components/stats-group'
import { StatsTileNumber } from '~/features/stats/components/stats-tile-number'

type Props = {
	onCreateProject: () => void
}

export const MyProjectsStats = ({ onCreateProject }: Props) => {
	const { t } = useTranslation('common')
	const { userProjects } = useProjects()
	const projects = userProjects()

	const totalCount = projects.length

	return (
		<div className="bg-base-200 flex items-start justify-between gap-4 p-4">
			<StatsGroup>
				<StatsTileNumber
					label={t('projects.myProjects', {
						defaultValue: 'My projects',
					})}
					standalone={false}
					value={totalCount}
				/>
			</StatsGroup>
			<Button
				className="w-auto"
				data-testid="project-create-btn"
				fullWidth={false}
				onClick={onCreateProject}
				size="sm"
				variant="neutral"
			>
				{t('projects.actions.create', {
					defaultValue: 'Create project',
				})}
			</Button>
		</div>
	)
}
