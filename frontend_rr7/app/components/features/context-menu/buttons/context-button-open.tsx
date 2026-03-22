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

import { EllipsisVertical } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

import { useContextMenu } from '../hooks/use-context-menu'

export const ContextButtonOpen = ({ hash }: { hash: string }) => {
	const { handleCloseAll, handleOpenContextMenu } = useContextMenu()
	const { t } = useTranslation('common')

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') handleCloseAll()
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [handleCloseAll])

	return (
		<Button
			aria-label={t('contextMenu.actions.open', {
				defaultValue: 'Open context menu',
			})}
			fullWidth={false}
			onClick={() => handleOpenContextMenu(hash)}
			shape="circle"
			title={t('contextMenu.actions.open', {
				defaultValue: 'Open context menu',
			})}
			variant="icon"
		>
			<LucideIcon icon={EllipsisVertical} />
		</Button>
	)
}
