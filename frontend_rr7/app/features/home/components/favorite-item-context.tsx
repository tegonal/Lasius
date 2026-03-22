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

import { roundToNearestMinutes } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextButtonStartBooking } from '~/features/context-menu/buttons/context-button-start-booking'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { useStopAndStart } from '~/hooks/use-stop-and-start'
import { formatISOLocale } from '~/lib/utils/dates'
import { stringHash } from '~/lib/utils/string-hash'
import { type ModelsBookingStub } from '~/services/api/lasius'
import { useDeleteFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

type Props = {
	item: ModelsBookingStub
	selectedOrgId: string
}

export const FavoriteItemContext = ({ item, selectedOrgId }: Props) => {
	const { t } = useTranslation('common')
	const deleteFavoriteApi = useDeleteFavoriteBooking()
	const stopAndStart = useStopAndStart()

	const itemHash = stringHash(item)
	const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()

	const deleteFavorite = () => {
		const {
			projectReference: { id: projectId },
			tags,
		} = item
		deleteFavoriteApi.submit({
			body: { projectId, tags },
			orgId: selectedOrgId,
		})
		handleCloseAll()
	}

	const handleStart = () => {
		stopAndStart.submit({
			orgId: selectedOrgId,
			projectId: item.projectReference.id,
			start: formatISOLocale(
				roundToNearestMinutes(new Date(), { roundingMethod: 'floor' }),
			),
			tags: item.tags,
		})
		handleCloseAll()
	}

	return (
		<ContextBody variant="compact">
			<ContextButtonOpen hash={itemHash} />
			{currentOpenContextMenuId === itemHash && (
				<ContextAnimatePresence variant="compact">
					<ContextBar className="-mr-3">
						<ContextButtonStartBooking
							item={item}
							onStart={handleStart}
							variant="compact"
						/>
						<ContextButtonWrapper variant="compact">
							<Button
								aria-label={t('favorites.actions.delete', {
									defaultValue: 'Delete favorite',
								})}
								fullWidth={false}
								onClick={deleteFavorite}
								shape="circle"
								title={t('favorites.actions.delete', {
									defaultValue: 'Delete favorite',
								})}
								variant="contextIcon"
							>
								<LucideIcon icon={Trash2} size={24} />
							</Button>
						</ContextButtonWrapper>
						<ContextBarDivider />
						<ContextButtonClose variant="compact" />
					</ContextBar>
				</ContextAnimatePresence>
			)}
		</ContextBody>
	)
}
