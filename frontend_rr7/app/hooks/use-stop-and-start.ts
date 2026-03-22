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

import { useCallback, useEffect, useRef } from 'react'

import { type ModelsTag } from '~/services/api/lasius'
import {
	useStartUserBookingCurrent,
	useStopUserBookingCurrent,
} from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type StopAndStartPayload = {
	currentBookingId?: string
	orgId: string
	projectId: string
	start: string
	tags: ModelsTag[]
}

/**
 * Stops the currently running booking (if any) and starts a new one.
 * Chains useStopUserBookingCurrent → useStartUserBookingCurrent.
 */
export function useStopAndStart() {
	const stopApi = useStopUserBookingCurrent()
	const startApi = useStartUserBookingCurrent()
	const pendingStartRef = useRef<null | {
		orgId: string
		projectId: string
		start: string
		tags: ModelsTag[]
	}>(null)

	// When stop completes, fire start
	useEffect(() => {
		if (stopApi.state === 'idle' && pendingStartRef.current) {
			const { orgId, projectId, start, tags } = pendingStartRef.current
			pendingStartRef.current = null
			startApi.submit({
				body: { projectId, start, tags },
				orgId,
			})
		}
	}, [stopApi.state, startApi])

	const submit = useCallback(
		(payload: StopAndStartPayload) => {
			const { currentBookingId, orgId, projectId, start, tags } = payload

			if (currentBookingId) {
				// Stop first, then start on completion
				pendingStartRef.current = { orgId, projectId, start, tags }
				stopApi.submit({
					body: { end: start },
					bookingId: currentBookingId,
					orgId,
				})
			} else {
				// No current booking, start directly
				startApi.submit({
					body: { projectId, start, tags },
					orgId,
				})
			}
		},
		[stopApi, startApi],
	)

	const state =
		stopApi.state !== 'idle' ||
		startApi.state !== 'idle' ||
		pendingStartRef.current
			? 'submitting'
			: 'idle'

	return { state, submit }
}
