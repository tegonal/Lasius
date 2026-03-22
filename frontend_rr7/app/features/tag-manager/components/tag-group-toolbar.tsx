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

import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

type Props = {
	allExpanded: boolean
	onAddGroup: () => void
	onAddPresets: () => void
	onToggleAll: () => void
	showToggleAll: boolean
}

export const TagGroupToolbar = ({
	allExpanded,
	onAddGroup,
	onAddPresets,
	onToggleAll,
	showToggleAll,
}: Props) => {
	const { t } = useTranslation('common')

	return (
		<div className="mb-4 flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
			<div className="flex gap-2">
				<Button
					fullWidth={false}
					onClick={onAddGroup}
					size="sm"
					type="button"
					variant="secondary"
				>
					{t('tags.actions.addTagGroup', {
						defaultValue: 'Add tag group',
					})}
				</Button>
				<Button
					fullWidth={false}
					onClick={onAddPresets}
					size="sm"
					type="button"
					variant="secondary"
				>
					{t('tags.actions.addDefaultTagGroups', {
						defaultValue: 'Add default tag groups',
					})}
				</Button>
			</div>
			{showToggleAll && (
				<Button
					fullWidth={false}
					onClick={onToggleAll}
					shape="circle"
					size="sm"
					title={
						allExpanded
							? t('tags.actions.collapseAll', {
									defaultValue: 'Collapse all',
								})
							: t('tags.actions.expandAll', {
									defaultValue: 'Expand all',
								})
					}
					type="button"
					variant="ghost"
				>
					<LucideIcon
						icon={allExpanded ? ChevronsDownUp : ChevronsUpDown}
						size={20}
					/>
				</Button>
			)}
		</div>
	)
}
