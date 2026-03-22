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

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { useToast } from '~/components/ui/feedback/use-toast'
import { ROUTES } from '~/config/routes.constants'
import { logger } from '~/lib/logger'
import { stringHash } from '~/lib/utils/string-hash'
import { ModelsConnectivityStatus } from '~/services/api/lasius/modelsConnectivityStatus'

import {
	isAuthenticationFailed,
	isCurrentUserTimeBookingEvent,
	isFavoriteAdded,
	isFavoriteRemoved,
	isIssueImporterSyncStatsChanged,
	isLatestTimeBooking,
	isUserTimeBookingHistoryEntryAdded,
	isUserTimeBookingHistoryEntryChanged,
	isUserTimeBookingHistoryEntryCleaned,
	isUserTimeBookingHistoryEntryRemoved,
	isWebSocketOutEvent,
} from './type-guards'
import { useLasiusWebsocket } from './use-lasius-websocket'

const IGNORED_EVENTS = [
	'HelloClient',
	'Pong',
	'CurrentOrganisationTimeBookings',
	'UserTimeBookingByProjectEntryAdded',
	'UserTimeBookingByProjectEntryRemoved',
	'UserTimeBookingByTagEntryRemoved',
	'UserTimeBookingByTagEntryAdded',
	'UserLoggedOutV2',
]

export const WebSocketEventHandler = () => {
	const { lastMessage } = useLasiusWebsocket()
	const revalidator = useRevalidator()
	const { addToast } = useToast()
	const { t } = useTranslation('common')
	const { t: tIntegrations } = useTranslation('integrations')
	const lastMessageHashRef = useRef<null | string>(null)

	// Use refs for callbacks so the effect closure always has the latest
	const revalidatorRef = useRef(revalidator)
	const addToastRef = useRef(addToast)
	const tRef = useRef(t)
	const tIntegrationsRef = useRef(tIntegrations)

	useEffect(() => {
		revalidatorRef.current = revalidator
	}, [revalidator])
	useEffect(() => {
		addToastRef.current = addToast
	}, [addToast])
	useEffect(() => {
		tRef.current = t
	}, [t])
	useEffect(() => {
		tIntegrationsRef.current = tIntegrations
	}, [tIntegrations])

	useEffect(() => {
		if (!lastMessage) return

		const hash = stringHash(lastMessage)
		if (hash === lastMessageHashRef.current) return
		lastMessageHashRef.current = hash

		if (!isWebSocketOutEvent(lastMessage)) return

		logger.info('[WebSocketEventHandler]', lastMessage)

		const toast = addToastRef.current
		const revalidate = () => void revalidatorRef.current.revalidate()
		const tr = tRef.current
		const trI = tIntegrationsRef.current

		if (isCurrentUserTimeBookingEvent(lastMessage)) {
			revalidate()
		} else if (isUserTimeBookingHistoryEntryAdded(lastMessage)) {
			revalidate()
			toast({
				message: tr('bookings.status.added', {
					defaultValue: 'Booking added',
				}),
				type: 'SUCCESS',
			})
		} else if (isUserTimeBookingHistoryEntryChanged(lastMessage)) {
			revalidate()
			toast({
				message: tr('bookings.status.updated', {
					defaultValue: 'Booking updated',
				}),
				type: 'SUCCESS',
			})
		} else if (isUserTimeBookingHistoryEntryRemoved(lastMessage)) {
			revalidate()
			toast({
				message: tr('bookings.status.removed', {
					defaultValue: 'Booking removed',
				}),
				type: 'SUCCESS',
			})
		} else if (isFavoriteAdded(lastMessage)) {
			revalidate()
			toast({
				message: tr('bookings.actions.addedToFavorites', {
					defaultValue: 'Booking added to favorites',
				}),
				type: 'SUCCESS',
			})
		} else if (isFavoriteRemoved(lastMessage)) {
			revalidate()
			toast({
				message: tr('favorites.status.removed', {
					defaultValue: 'Favorite removed',
				}),
				type: 'SUCCESS',
			})
		} else if (isLatestTimeBooking(lastMessage)) {
			toast({
				message: tr('bookings.status.started', {
					defaultValue: 'Booking started',
				}),
				type: 'SUCCESS',
			})
		} else if (isIssueImporterSyncStatsChanged(lastMessage)) {
			revalidate()
			if (
				lastMessage.syncStatus.connectivityStatus ===
				ModelsConnectivityStatus.degraded
			) {
				toast({
					action: {
						href: ROUTES.ORGANISATION.INTEGRATIONS,
						label: trI('issueImporters.actions.viewIntegrations', {
							defaultValue: 'View Integrations',
						}),
					},
					message: trI('issueImporters.status.connectivityDegraded', {
						configName: lastMessage.configName,
						defaultValue:
							'Issue importer connectivity degraded: {{configName}}',
					}),
					ttl: 120000,
					type: 'WARNING',
				})
			} else if (
				lastMessage.syncStatus.connectivityStatus ===
				ModelsConnectivityStatus.failed
			) {
				const errorMessage = lastMessage.syncStatus.currentIssue?.message || ''
				toast({
					action: {
						href: ROUTES.ORGANISATION.INTEGRATIONS,
						label: trI('issueImporters.actions.viewIntegrations', {
							defaultValue: 'View Integrations',
						}),
					},
					message: trI('issueImporters.status.connectivityFailed', {
						configName: lastMessage.configName,
						defaultValue: 'Issue importer connectivity failed: {{configName}}',
					}),
					ttl: 120000,
					type: 'ERROR',
				})
				if (errorMessage) {
					logger.error('[IssueImporterSyncStatsChanged]', errorMessage)
				}
			}
		} else if (isUserTimeBookingHistoryEntryCleaned(lastMessage)) {
			revalidate()
			toast({
				message: tr('bookings.status.historyCleared', {
					defaultValue: 'Booking history cleared',
				}),
				type: 'NOTIFICATION',
			})
		} else if (isAuthenticationFailed(lastMessage)) {
			logger.error('[AuthenticationFailed]', 'WebSocket authentication failed')
			toast({
				message: tr('auth.status.authenticationFailed', {
					defaultValue: 'Authentication failed. Please log in again.',
				}),
				ttl: 10000,
				type: 'ERROR',
			})
		} else {
			const messageType = lastMessage.type as string
			if (IGNORED_EVENTS.includes(messageType)) {
				logger.info('[WebSocketEventHandler][IgnoredEvent]', messageType)
			} else {
				logger.warn(
					'[WebSocketEventHandler][UnhandledEvent]',
					messageType,
					lastMessage,
				)
			}
		}
	}, [lastMessage])

	return null
}
