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
import { clearLoaderCache } from '~/lib/utils/loader-cache'
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

const IGNORED_EVENTS = new Set([
  'CurrentOrganisationTimeBookings',
  'HelloClient',
  'Pong',
  'UserLoggedOutV2',
  'UserTimeBookingByProjectEntryAdded',
  'UserTimeBookingByProjectEntryRemoved',
  'UserTimeBookingByTagEntryAdded',
  'UserTimeBookingByTagEntryRemoved',
])

export const WebSocketEventHandler = () => {
  const { lastMessage } = useLasiusWebsocket()
  const revalidator = useRevalidator()
  const { addToast } = useToast()
  const { t: translate } = useTranslation('common')
  const lastMessageHashReference = useRef<null | string>(null)

  // Use refs for callbacks so the effect closure always has the latest
  const revalidatorReference = useRef(revalidator)
  const latestAddToastReference = useRef(addToast)
  const tReference = useRef(translate)

  useEffect(() => {
    revalidatorReference.current = revalidator
  }, [revalidator])
  useEffect(() => {
    latestAddToastReference.current = addToast
  }, [addToast])
  useEffect(() => {
    tReference.current = translate
  }, [translate])

  useEffect(() => {
    if (!lastMessage) return

    const hash = stringHash(lastMessage)
    if (hash === lastMessageHashReference.current) return
    lastMessageHashReference.current = hash

    if (!isWebSocketOutEvent(lastMessage)) return

    logger.info('[WebSocketEventHandler]', lastMessage)

    const toast = latestAddToastReference.current
    // The event reports a change from another tab or device, so a cached loader result is stale.
    const revalidate = () => {
      clearLoaderCache()
      void revalidatorReference.current.revalidate()
    }
    // i18next-cli extracts only calls named t(). Integration keys name their namespace.
    const t = tReference.current

    if (isCurrentUserTimeBookingEvent(lastMessage)) {
      revalidate()
    } else if (isUserTimeBookingHistoryEntryAdded(lastMessage)) {
      revalidate()
      toast({
        message: t('bookings.status.added', {
          defaultValue: 'Booking added',
        }),
        type: 'SUCCESS',
      })
    } else if (isUserTimeBookingHistoryEntryChanged(lastMessage)) {
      revalidate()
      toast({
        message: t('bookings.status.updated', {
          defaultValue: 'Booking updated',
        }),
        type: 'SUCCESS',
      })
    } else if (isUserTimeBookingHistoryEntryRemoved(lastMessage)) {
      revalidate()
      toast({
        message: t('bookings.status.removed', {
          defaultValue: 'Booking removed',
        }),
        type: 'SUCCESS',
      })
    } else if (isFavoriteAdded(lastMessage)) {
      revalidate()
      toast({
        message: t('bookings.actions.addedToFavorites', {
          defaultValue: 'Booking added to favorites',
        }),
        type: 'SUCCESS',
      })
    } else if (isFavoriteRemoved(lastMessage)) {
      revalidate()
      toast({
        message: t('favorites.status.removed', {
          defaultValue: 'Favorite removed',
        }),
        type: 'SUCCESS',
      })
    } else if (isLatestTimeBooking(lastMessage)) {
      toast({
        message: t('bookings.status.started', {
          defaultValue: 'Booking started',
        }),
        type: 'SUCCESS',
      })
    } else if (isIssueImporterSyncStatsChanged(lastMessage)) {
      revalidate()
      if (lastMessage.syncStatus.connectivityStatus === ModelsConnectivityStatus.degraded) {
        toast({
          action: {
            href: ROUTES.ORGANISATION.INTEGRATIONS,
            label: t('integrations:issueImporters.actions.viewIntegrations', {
              defaultValue: 'View Integrations',
            }),
          },
          message: t('integrations:issueImporters.status.connectivityDegraded', {
            configName: lastMessage.configName,
            defaultValue: 'Issue importer connectivity degraded: {{configName}}',
          }),
          ttl: 120_000,
          type: 'WARNING',
        })
      } else if (lastMessage.syncStatus.connectivityStatus === ModelsConnectivityStatus.failed) {
        const errorMessage = lastMessage.syncStatus.currentIssue?.message || ''
        toast({
          action: {
            href: ROUTES.ORGANISATION.INTEGRATIONS,
            label: t('integrations:issueImporters.actions.viewIntegrations', {
              defaultValue: 'View Integrations',
            }),
          },
          message: t('integrations:issueImporters.status.connectivityFailed', {
            configName: lastMessage.configName,
            defaultValue: 'Issue importer connectivity failed: {{configName}}',
          }),
          ttl: 120_000,
          type: 'ERROR',
        })
        if (errorMessage) {
          logger.error('[IssueImporterSyncStatsChanged]', errorMessage)
        }
      }
    } else if (isUserTimeBookingHistoryEntryCleaned(lastMessage)) {
      revalidate()
      toast({
        message: t('bookings.status.historyCleared', {
          defaultValue: 'Booking history cleared',
        }),
        type: 'NOTIFICATION',
      })
    } else if (isAuthenticationFailed(lastMessage)) {
      logger.error('[AuthenticationFailed]', 'WebSocket authentication failed')
      toast({
        message: t('auth.status.authenticationFailed', {
          defaultValue: 'Authentication failed. Please log in again.',
        }),
        ttl: 10_000,
        type: 'ERROR',
      })
    } else {
      const messageType = lastMessage.type as string
      if (IGNORED_EVENTS.has(messageType)) {
        logger.info('[WebSocketEventHandler][IgnoredEvent]', messageType)
      } else {
        logger.warn('[WebSocketEventHandler][UnhandledEvent]', messageType, lastMessage)
      }
    }
  }, [lastMessage])

  return null
}
