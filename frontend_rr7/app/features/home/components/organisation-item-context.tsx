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

import { ContextButtonClose } from '~/components/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/components/features/context-menu/buttons/context-button-open'
import { ContextButtonStartBooking } from '~/components/features/context-menu/buttons/context-button-start-booking'
import { ContextAnimatePresence } from '~/components/features/context-menu/context-animate-presence'
import { ContextBar } from '~/components/features/context-menu/context-bar'
import { ContextBarDivider } from '~/components/features/context-menu/context-bar-divider'
import { ContextBody } from '~/components/features/context-menu/context-body'
import { useContextMenu } from '~/components/features/context-menu/hooks/use-context-menu'
import { useStopAndStart } from '~/hooks/use-stop-and-start'
import { formatISOLocale } from '~/lib/utils/dates'
import { stringHash } from '~/lib/utils/string-hash'
import { type ModelsCurrentUserTimeBooking } from '~/services/api/lasius'

type Props = {
	item: ModelsCurrentUserTimeBooking
	selectedOrgId: string
}

export const OrganisationItemContext = ({ item, selectedOrgId }: Props) => {
	const itemHash = stringHash(item)
	const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()
	const stopAndStart = useStopAndStart()

	const handleStart = () => {
		if (!item.booking) return
		stopAndStart.submit({
			orgId: selectedOrgId,
			projectId: item.booking.projectReference.id,
			start: formatISOLocale(
				roundToNearestMinutes(new Date(), { roundingMethod: 'floor' }),
			),
			tags: item.booking.tags,
		})
		handleCloseAll()
	}

	return (
		<ContextBody variant="compact">
			<ContextButtonOpen hash={itemHash} />
			{currentOpenContextMenuId === itemHash && (
				<ContextAnimatePresence variant="compact">
					<ContextBar className="-mr-3">
						{item.booking && (
							<ContextButtonStartBooking
								item={item.booking}
								onStart={handleStart}
								variant="compact"
							/>
						)}
						<ContextBarDivider />
						<ContextButtonClose variant="compact" />
					</ContextBar>
				</ContextAnimatePresence>
			)}
		</ContextBody>
	)
}
