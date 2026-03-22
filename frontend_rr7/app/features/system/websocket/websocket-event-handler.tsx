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

import { useEffect, useMemo, useRef } from 'react'
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
	processWebSocketEvent,
	type WebSocketEventHandler,
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

export function WebSocketEventHandler() {
	const { lastMessage } = useLasiusWebsocket()
	const revalidator = useRevalidator()
	const { addToast } = useToast()
	const { t } = useTranslation('common')
	const { t: tIntegrations } = useTranslation('integrations')
	const lastMessageHashRef = useRef<null | string>(null)

	const eventHandlers: WebSocketEventHandler<any>[] = useMemo(
		() => [
			{
				handler: () => {
					void revalidator.revalidate()
				},
				typeGuard: isCurrentUserTimeBookingEvent,
			},
			{
				handler: () => {
					void revalidator.revalidate()
					addToast({
						message: t('bookings.status.added', {
							defaultValue: 'Booking added',
						}),
						type: 'SUCCESS',
					})
				},
				typeGuard: isUserTimeBookingHistoryEntryAdded,
			},
			{
				handler: () => {
					void revalidator.revalidate()
					addToast({
						message: t('bookings.status.updated', {
							defaultValue: 'Booking updated',
						}),
						type: 'SUCCESS',
					})
				},
				typeGuard: isUserTimeBookingHistoryEntryChanged,
			},
			{
				handler: () => {
					void revalidator.revalidate()
					addToast({
						message: t('bookings.status.removed', {
							defaultValue: 'Booking removed',
						}),
						type: 'SUCCESS',
					})
				},
				typeGuard: isUserTimeBookingHistoryEntryRemoved,
			},
			{
				handler: () => {
					void revalidator.revalidate()
					addToast({
						message: t('bookings.actions.addedToFavorites', {
							defaultValue: 'Booking added to favorites',
						}),
						type: 'SUCCESS',
					})
				},
				typeGuard: isFavoriteAdded,
			},
			{
				handler: () => {
					void revalidator.revalidate()
					addToast({
						message: t('favorites.status.removed', {
							defaultValue: 'Favorite removed',
						}),
						type: 'SUCCESS',
					})
				},
				typeGuard: isFavoriteRemoved,
			},
			{
				handler: () => {
					addToast({
						message: t('bookings.status.started', {
							defaultValue: 'Booking started',
						}),
						type: 'SUCCESS',
					})
				},
				typeGuard: isLatestTimeBooking,
			},
			{
				handler: (event) => {
					void revalidator.revalidate()

					if (
						event.syncStatus.connectivityStatus ===
						ModelsConnectivityStatus.degraded
					) {
						addToast({
							action: {
								href: ROUTES.ORGANISATION.INTEGRATIONS,
								label: tIntegrations(
									'issueImporters.actions.viewIntegrations',
									{
										defaultValue: 'View Integrations',
									},
								),
							},
							message: tIntegrations(
								'issueImporters.status.connectivityDegraded',
								{
									configName: event.configName,
									defaultValue:
										'Issue importer connectivity degraded: {{configName}}',
								},
							),
							ttl: 120000,
							type: 'WARNING',
						})
					} else if (
						event.syncStatus.connectivityStatus ===
						ModelsConnectivityStatus.failed
					) {
						const errorMessage = event.syncStatus.currentIssue?.message || ''
						addToast({
							action: {
								href: ROUTES.ORGANISATION.INTEGRATIONS,
								label: tIntegrations(
									'issueImporters.actions.viewIntegrations',
									{
										defaultValue: 'View Integrations',
									},
								),
							},
							message: tIntegrations(
								'issueImporters.status.connectivityFailed',
								{
									configName: event.configName,
									defaultValue:
										'Issue importer connectivity failed: {{configName}}',
								},
							),
							ttl: 120000,
							type: 'ERROR',
						})
						if (errorMessage) {
							logger.error('[IssueImporterSyncStatsChanged]', errorMessage)
						}
					}
				},
				typeGuard: isIssueImporterSyncStatsChanged,
			},
			{
				handler: () => {
					void revalidator.revalidate()
					addToast({
						message: t('bookings.status.historyCleared', {
							defaultValue: 'Booking history cleared',
						}),
						type: 'NOTIFICATION',
					})
				},
				typeGuard: isUserTimeBookingHistoryEntryCleaned,
			},
			{
				handler: () => {
					logger.error(
						'[AuthenticationFailed]',
						'WebSocket authentication failed',
					)
					addToast({
						message: t('auth.status.authenticationFailed', {
							defaultValue: 'Authentication failed. Please log in again.',
						}),
						ttl: 10000,
						type: 'ERROR',
					})
				},
				typeGuard: isAuthenticationFailed,
			},
		],
		[revalidator, addToast, t, tIntegrations],
	)

	useEffect(() => {
		if (!lastMessage) return

		const hash = stringHash(lastMessage)
		if (hash === lastMessageHashRef.current) return

		logger.info('[WebSocketEventHandler]', lastMessage)

		const wasHandled = processWebSocketEvent(lastMessage, eventHandlers)

		if (
			!wasHandled &&
			typeof lastMessage === 'object' &&
			lastMessage !== null &&
			'type' in lastMessage
		) {
			const messageType = (lastMessage as { type: string }).type
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

		lastMessageHashRef.current = hash
	}, [lastMessage, eventHandlers])

	return null
}
