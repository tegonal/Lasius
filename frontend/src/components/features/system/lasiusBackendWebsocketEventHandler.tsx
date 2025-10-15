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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import { useLasiusWebsocket } from 'lib/api/hooks/useLasiusWebsocket'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useSwrMutateMany } from 'lib/api/hooks/useSwrMutateMany'
import { getGetConfigsKey } from 'lib/api/lasius/issue-importers/issue-importers'
import { ModelsConnectivityStatus } from 'lib/api/lasius/modelsConnectivityStatus'
import {
  getGetUserBookingCurrentKey,
  getGetUserBookingCurrentListByOrganisationKey,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { getGetFavoriteBookingListKey } from 'lib/api/lasius/user-favorites/user-favorites'
import { logger } from 'lib/logger'
import { stringHash } from 'lib/utils/string/stringHash'
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
  WebSocketEventHandler,
} from 'lib/utils/websocket/typeGuards'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { CONNECTION_STATUS } from 'projectConfig/constants'
import { ROUTES } from 'projectConfig/routes.constants'
import React, { useEffect, useMemo } from 'react'
import { useSWRConfig } from 'swr'

export const LasiusBackendWebsocketEventHandler: React.FC = () => {
  const { mutate } = useSWRConfig()
  const { lastMessage, connectionStatus, sendJsonMessage } = useLasiusWebsocket()
  const mutateMany = useSwrMutateMany()
  const [lastMessageHash, setLastMessageHash] = React.useState<string | null>(null)
  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()
  const { t } = useTranslation('common')
  const { t: tIntegrations } = useTranslation('integrations')
  const session = useSession()

  // Define event handlers with full type safety
  const eventHandlers: WebSocketEventHandler<any>[] = useMemo(
    () => [
      // CurrentUserTimeBookingEvent
      {
        typeGuard: isCurrentUserTimeBookingEvent,
        handler: () => {
          mutate(getGetUserBookingCurrentKey())
          mutate(getGetUserBookingCurrentListByOrganisationKey(selectedOrganisationId))
        },
      },
      // UserTimeBookingHistoryEntryAdded
      {
        typeGuard: isUserTimeBookingHistoryEntryAdded,
        handler: () => {
          mutateMany(/.*\/user-bookings\/.*/)
          addToast({
            message: t('bookings.status.added', { defaultValue: 'Booking added' }),
            type: 'SUCCESS',
          })
        },
      },
      // UserTimeBookingHistoryEntryChanged
      {
        typeGuard: isUserTimeBookingHistoryEntryChanged,
        handler: () => {
          mutateMany(/.*\/user-bookings\/.*/)
          addToast({
            message: t('bookings.status.updated', { defaultValue: 'Booking updated' }),
            type: 'SUCCESS',
          })
        },
      },
      // UserTimeBookingHistoryEntryRemoved
      {
        typeGuard: isUserTimeBookingHistoryEntryRemoved,
        handler: () => {
          mutateMany(/.*\/user-bookings\/.*/)
          addToast({
            message: t('bookings.status.removed', { defaultValue: 'Booking removed' }),
            type: 'SUCCESS',
          })
        },
      },
      // FavoriteAdded
      {
        typeGuard: isFavoriteAdded,
        handler: () => {
          mutate(getGetFavoriteBookingListKey(selectedOrganisationId))
          addToast({
            message: t('bookings.actions.addedToFavorites', {
              defaultValue: 'Booking added to favorites',
            }),
            type: 'SUCCESS',
          })
        },
      },
      // FavoriteRemoved
      {
        typeGuard: isFavoriteRemoved,
        handler: () => {
          mutate(getGetFavoriteBookingListKey(selectedOrganisationId))
          addToast({
            message: t('favorites.status.removed', { defaultValue: 'Favorite removed' }),
            type: 'SUCCESS',
          })
        },
      },
      // LatestTimeBooking
      {
        typeGuard: isLatestTimeBooking,
        handler: () => {
          addToast({
            message: t('bookings.status.started', { defaultValue: 'Booking started' }),
            type: 'SUCCESS',
          })
        },
      },
      // IssueImporterSyncStatsChanged
      {
        typeGuard: isIssueImporterSyncStatsChanged,
        handler: (event) => {
          // Handle cache invalidation
          mutate(getGetConfigsKey(selectedOrganisationId))

          // Handle toast notifications based on connectivity status
          if (event.syncStatus.connectivityStatus === ModelsConnectivityStatus.degraded) {
            addToast({
              message: tIntegrations('issueImporters.status.connectivityDegraded', {
                defaultValue: 'Issue importer connectivity degraded: {{configName}}',
                configName: event.configName,
              }),
              type: 'WARNING',
              ttl: 120000,
              action: {
                label: tIntegrations('issueImporters.actions.viewIntegrations', {
                  defaultValue: 'View Integrations',
                }),
                href: ROUTES.ORGANISATION.INTEGRATIONS,
              },
            })
          } else if (event.syncStatus.connectivityStatus === ModelsConnectivityStatus.failed) {
            const errorMessage = event.syncStatus.currentIssue?.message || ''
            addToast({
              message: tIntegrations('issueImporters.status.connectivityFailed', {
                defaultValue: 'Issue importer connectivity failed: {{configName}}',
                configName: event.configName,
              }),
              type: 'ERROR',
              ttl: 120000,
              action: {
                label: tIntegrations('issueImporters.actions.viewIntegrations', {
                  defaultValue: 'View Integrations',
                }),
                href: ROUTES.ORGANISATION.INTEGRATIONS,
              },
            })
            if (errorMessage) {
              logger.error('[IssueImporterSyncStatsChanged]', errorMessage)
            }
          }
        },
      },
      // UserTimeBookingHistoryEntryCleaned
      {
        typeGuard: isUserTimeBookingHistoryEntryCleaned,
        handler: () => {
          mutateMany(/.*\/user-bookings\/.*/)
          addToast({
            message: t('bookings.status.historyCleared', {
              defaultValue: 'Booking history cleared',
            }),
            type: 'NOTIFICATION',
          })
        },
      },
      // AuthenticationFailed
      {
        typeGuard: isAuthenticationFailed,
        handler: () => {
          logger.error('[AuthenticationFailed]', 'WebSocket authentication failed')
          addToast({
            message: t('auth.status.authenticationFailed', {
              defaultValue: 'Authentication failed. Please log in again.',
            }),
            type: 'ERROR',
            ttl: 10000,
          })
        },
      },
    ],
    [mutate, mutateMany, selectedOrganisationId, addToast, t, tIntegrations],
  )

  // Send HelloServer authentication when WebSocket connects
  useEffect(() => {
    const sendClientAuthentication = () => {
      logger.info('[WebsocketEventHandler] Sending HelloServer authentication', {
        client: 'lasius-nextjs-frontend',
        hasToken: !!session.data?.access_token,
        hasIssuer: !!session.data?.access_token_issuer,
      })
      sendJsonMessage(
        {
          type: 'HelloServer',
          client: 'lasius-nextjs-frontend',
          token: session.data?.access_token,
          tokenIssuer: session.data?.access_token_issuer,
        },
        false,
      )
    }

    if (connectionStatus === CONNECTION_STATUS.CONNECTED && session.data?.access_token) {
      sendClientAuthentication()
    } else if (connectionStatus === CONNECTION_STATUS.CONNECTED && !session.data?.access_token) {
      logger.warn('[WebsocketEventHandler] WebSocket connected but no access token available yet')
    }
  }, [
    connectionStatus,
    session.data?.access_token,
    session.data?.access_token_issuer,
    sendJsonMessage,
  ])

  const newMessage = stringHash(lastMessage) !== lastMessageHash

  useEffect(() => {
    if (lastMessage && stringHash(lastMessage) !== lastMessageHash) {
      logger.info('[AppWebsocketEventHandler]', lastMessage)

      // Process event through type-safe handler registry
      const wasHandled = processWebSocketEvent(lastMessage, eventHandlers)

      // Log unhandled events
      if (!wasHandled && lastMessage && typeof lastMessage === 'object' && 'type' in lastMessage) {
        const messageType = lastMessage.type as string
        // Explicitly handled but intentionally ignored events
        const ignoredEvents = [
          'HelloClient',
          'Pong',
          'CurrentOrganisationTimeBookings',
          'UserTimeBookingByProjectEntryAdded',
          'UserTimeBookingByProjectEntryRemoved',
          'UserTimeBookingByTagEntryRemoved',
          'UserTimeBookingByTagEntryAdded',
          'UserLoggedOutV2',
        ]

        if (ignoredEvents.includes(messageType)) {
          logger.info('[AppWebsocketEventHandler][IgnoredEvent]', messageType)
        } else {
          logger.warn('[AppWebsocketEventHandler][UnhandledEvent]', messageType, lastMessage)
        }
      }

      setLastMessageHash(stringHash(lastMessage))
    }
  }, [newMessage, lastMessageHash, lastMessage, eventHandlers])

  return <></>
}
