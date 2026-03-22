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

import { ContextButtonClose } from '~/components/features/context-menu/buttons/context-button-close'
import { ContextButtonLeaveProject } from '~/components/features/context-menu/buttons/context-button-leave-project'
import { ContextButtonOpen } from '~/components/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/components/features/context-menu/context-animate-presence'
import { ContextBar } from '~/components/features/context-menu/context-bar'
import { ContextBarDivider } from '~/components/features/context-menu/context-bar-divider'
import { ContextBody } from '~/components/features/context-menu/context-body'
import { useContextMenu } from '~/components/features/context-menu/hooks/use-context-menu'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

type Props = {
	item: ModelsUserProject
}

export const MyProjectsListItemMemberContext = ({ item }: Props) => {
	const { currentOpenContextMenuId } = useContextMenu()

	return (
		<ContextBody variant="compact">
			<ContextButtonOpen hash={item.projectReference.id} />
			{currentOpenContextMenuId === item.projectReference.id && (
				<ContextAnimatePresence variant="compact">
					<ContextBar>
						<ContextButtonLeaveProject item={item} variant="compact" />
						<ContextBarDivider />
						<ContextButtonClose variant="compact" />
					</ContextBar>
				</ContextAnimatePresence>
			)}
		</ContextBody>
	)
}
