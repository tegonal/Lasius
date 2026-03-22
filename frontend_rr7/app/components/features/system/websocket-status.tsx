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

import { RadioTowerIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import {
	ConnectionStatus,
	useLasiusWebsocket,
} from '~/features/system/websocket/use-lasius-websocket'
import { useIsClient } from '~/lib/hooks/use-is-client'

const statusDotClass: Record<ConnectionStatus, string> = {
	[ConnectionStatus.CONNECTED]: 'bg-success',
	[ConnectionStatus.CONNECTING]: 'bg-warning',
	[ConnectionStatus.DISCONNECTED]: 'bg-error',
	[ConnectionStatus.ERROR]: 'bg-error',
}

export const WebsocketStatus = () => {
	const { t } = useTranslation('common')
	const isClient = useIsClient()
	const { connectionStatus } = useLasiusWebsocket()

	if (!isClient) return null

	const labels: Record<ConnectionStatus, string> = {
		[ConnectionStatus.CONNECTED]: t('websocket.status.connected', {
			defaultValue: 'WebSocket connected',
		}),
		[ConnectionStatus.CONNECTING]: t('websocket.status.connecting', {
			defaultValue: 'WebSocket connecting',
		}),
		[ConnectionStatus.DISCONNECTED]: t('websocket.status.error', {
			defaultValue: 'Unable to connect to WebSocket',
		}),
		[ConnectionStatus.ERROR]: t('websocket.status.error', {
			defaultValue: 'Unable to connect to WebSocket',
		}),
	}

	return (
		<div
			className="tooltip tooltip-top"
			data-testid="websocket-status"
			data-tip={labels[connectionStatus]}
		>
			<div className="relative inline-flex">
				<LucideIcon icon={RadioTowerIcon} size={14} />
				<span
					className={`absolute -top-1 -right-1 size-2 rounded-full ${statusDotClass[connectionStatus]}`}
				/>
			</div>
		</div>
	)
}
