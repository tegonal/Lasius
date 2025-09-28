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
import {
  getGetUserBookingCurrentKey,
  getGetUserBookingCurrentListByOrganisationKey,
} from 'lib/api/lasius/user-bookings/user-bookings'
import { getGetFavoriteBookingListKey } from 'lib/api/lasius/user-favorites/user-favorites'
import { logger } from 'lib/logger'
import { stringHash } from 'lib/utils/string/stringHash'
import { useTranslation } from 'next-i18next'
import { WEBSOCKET_EVENT } from 'projectConfig/constants'
import React, { useEffect } from 'react'
import { useSWRConfig } from 'swr'

export const LasiusBackendWebsocketEventHandler: React.FC = () => {
  const { mutate } = useSWRConfig()
  const { lastMessage } = useLasiusWebsocket()
  const mutateMany = useSwrMutateMany()
  const [lastMessageHash, setLastMessageHash] = React.useState<string | null>(null)
  const { selectedOrganisationId } = useOrganisation()
  const { addToast } = useToast()
  const { t } = useTranslation('common')

  const newMessage = stringHash(lastMessage) !== lastMessageHash

  useEffect(() => {
    if (lastMessage && stringHash(lastMessage) !== lastMessageHash) {
      logger.info('[AppWebsocketEventHandler]', lastMessage)
      const { type, data } = lastMessage

      //  Mutate data, grouped, to save requests

      switch (true) {
        case type === WEBSOCKET_EVENT.CurrentUserTimeBookingEvent:
          mutate(getGetUserBookingCurrentKey())
          mutate(getGetUserBookingCurrentListByOrganisationKey(selectedOrganisationId))
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingHistoryEntryRemoved:
        case type === WEBSOCKET_EVENT.UserTimeBookingHistoryEntryAdded:
        case type === WEBSOCKET_EVENT.UserTimeBookingHistoryEntryChanged:
          mutateMany(/.*\/user-bookings\/.*/)
          // this.booking.loadBookingsCache();
          // this.userBookingHistory.load();
          break

        case type === WEBSOCKET_EVENT.HelloClient:
          logger.info('[AppWebsocketEventHandler][HelloClient!]')
          break

        case type === WEBSOCKET_EVENT.FavoriteAdded:
        case type === WEBSOCKET_EVENT.FavoriteRemoved:
          mutate(getGetFavoriteBookingListKey(selectedOrganisationId))
          break

        case type === WEBSOCKET_EVENT.LatestTimeBooking:
        case type === WEBSOCKET_EVENT.CurrentOrganisationTimeBookings:
          //
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingByProjectEntryAdded:
        case type === WEBSOCKET_EVENT.UserTimeBookingByProjectEntryRemoved:
        case type === WEBSOCKET_EVENT.UserTimeBookingByTagEntryRemoved:
        case type === WEBSOCKET_EVENT.UserTimeBookingByTagEntryAdded:
          //  Unhandled events - these clog up the ws connection on simple updates
          break

        case type === WEBSOCKET_EVENT.Pong:
          // ignore
          break

        default:
          logger.warn('[AppWebsocketEventHandler][UnhandledEvent]', type, { data })
      }

      //  Fire toasts on specific events

      switch (true) {
        case type === WEBSOCKET_EVENT.CurrentUserTimeBookingEvent:
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingHistoryEntryRemoved:
          addToast({
            message: t('bookings.status.removed', { defaultValue: 'Booking removed' }),
            type: 'SUCCESS',
          })
          break

        case type === WEBSOCKET_EVENT.UserLoggedOutV2:
          logger.info('[AppWebsocketEventHandler][UserLoggedOutV2]')
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingHistoryEntryAdded:
          addToast({
            message: t('bookings.status.added', { defaultValue: 'Booking added' }),
            type: 'SUCCESS',
          })
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingHistoryEntryChanged:
          addToast({
            message: t('bookings.status.updated', { defaultValue: 'Booking updated' }),
            type: 'SUCCESS',
          })

          break

        case type === WEBSOCKET_EVENT.HelloClient:
          break

        case type === WEBSOCKET_EVENT.FavoriteAdded:
          addToast({
            message: t('bookings.actions.addedToFavorites', {
              defaultValue: 'Booking added to favorites',
            }),
            type: 'SUCCESS',
          })
          break

        case type === WEBSOCKET_EVENT.FavoriteRemoved:
          addToast({
            message: t('favorites.status.removed', { defaultValue: 'Favorite removed' }),
            type: 'SUCCESS',
          })
          break

        case type === WEBSOCKET_EVENT.LatestTimeBooking:
          addToast({
            message: t('bookings.status.started', { defaultValue: 'Booking started' }),
            type: 'SUCCESS',
          })
          break

        case type === WEBSOCKET_EVENT.CurrentOrganisationTimeBookings:
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingByProjectEntryAdded:
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingByProjectEntryRemoved:
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingByTagEntryRemoved:
          break

        case type === WEBSOCKET_EVENT.UserTimeBookingByTagEntryAdded:
          //  Unhandled events
          break
        default:
          break
      }

      setLastMessageHash(stringHash(lastMessage))
    }
  }, [
    newMessage,
    lastMessageHash,
    lastMessage,
    mutate,
    selectedOrganisationId,
    mutateMany,
    addToast,
    t,
  ])

  return <></>
}
