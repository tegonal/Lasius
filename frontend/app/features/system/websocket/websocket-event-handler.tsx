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
import { untyped } from '~/lib/i18n-types'
import { logger } from '~/lib/logger'
import { clearLoaderCache } from '~/lib/utils/loader-cache'

import { getNewOutEvent } from './type-guards'
import { useLasiusWebsocket } from './use-lasius-websocket'
import { getWebSocketEventReaction, type WebSocketEventReaction } from './websocket-event-reactions'

// The backend sends these event types, but the generated WebSocketOutEvent union does not list them.
const IGNORED_EVENTS = new Set([
  'UserLoggedOutV2',
  'UserTimeBookingByProjectEntryAdded',
  'UserTimeBookingByProjectEntryRemoved',
  'UserTimeBookingByTagEntryAdded',
  'UserTimeBookingByTagEntryRemoved',
])

// A message can hold booking data and the names of all organisation members, so production logs none.
const logDevelopmentInfo: (...arguments_: unknown[]) => void = import.meta.env.DEV
  ? (...arguments_) => logger.info(...arguments_)
  : () => {}

const logSkippedEvent = (messageType: string, isIgnored: boolean, message: unknown) => {
  if (isIgnored || IGNORED_EVENTS.has(messageType)) {
    logDevelopmentInfo('[WebSocketEventHandler][IgnoredEvent]', messageType)
    return
  }
  logger.warn('[WebSocketEventHandler][UnhandledEvent]', messageType, message)
}

const applyReaction = (
  reaction: WebSocketEventReaction,
  revalidate: () => Promise<void>,
  addToast: (toast: NonNullable<WebSocketEventReaction['toast']>) => void,
) => {
  if (reaction.errorLog) {
    logger.error(reaction.errorLog.tag, reaction.errorLog.message)
  }
  if (reaction.revalidate) {
    // The event reports a change from another tab or device, so a cached loader result is stale.
    clearLoaderCache()
    void revalidate()
  }
  if (reaction.toast) {
    addToast(reaction.toast)
  }
}

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
    const next = getNewOutEvent(lastMessage, lastMessageHashReference.current)
    if (!next) return
    lastMessageHashReference.current = next.hash
    const { event } = next

    logDevelopmentInfo('[WebSocketEventHandler]', event)

    const reaction = getWebSocketEventReaction(event, untyped(tReference.current))
    if (!reaction || reaction.ignored) {
      logSkippedEvent(event.type, reaction?.ignored === true, event)
      return
    }

    applyReaction(
      reaction,
      revalidatorReference.current.revalidate,
      latestAddToastReference.current,
    )
  }, [lastMessage])

  return null
}
