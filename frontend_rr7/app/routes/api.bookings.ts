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

import { addDays, endOfDay, isSameDay, startOfDay } from 'date-fns'
import { data } from 'react-router'

import { formatISOLocale } from '~/lib/utils/dates'
import {
	addUserBookingByOrganisation,
	deleteUserBooking,
	getUserBookingCurrent,
	startUserBookingCurrent,
	stopUserBookingCurrent,
	updateUserBooking,
	updateUserBookingCurrent,
} from '~/services/api/lasius/user-bookings/user-bookings'
import { addFavoriteBooking } from '~/services/api/lasius/user-favorites/user-favorites'
import {
	authHeadersWithCsrf,
	mergeAuthHeaders,
	requireUser,
} from '~/services/auth/auth-helpers.server'

/**
 * POST /api/bookings
 *
 * Dispatches booking mutations based on `intent` form field.
 * All intents require `orgId`. Additional fields vary by intent.
 *
 * Intents:
 *   - add:              orgId, projectId, tags (JSON), start, end
 *   - delete:           orgId, bookingId
 *   - start:            orgId, projectId, tags (JSON), start
 *   - stop:             orgId, bookingId, end, projectId, tags (JSON), start
 *   - update:           orgId, bookingId, projectId, tags (JSON), start, end?
 *   - updateCurrent:    orgId, bookingId, newStart
 *   - addFavorite:      orgId, projectId, tags (JSON)
 *   - stopAndStart:     orgId, projectId, tags (JSON), start
 */
export async function action({ request }: { request: Request }) {
	const auth = await requireUser(request)
	const headers = await authHeadersWithCsrf(auth.session)
	const formData = await request.formData()

	const intent = formData.get('intent') as string
	const orgId = formData.get('orgId') as string

	if (!intent || !orgId) {
		return data(
			{ error: 'Missing intent or orgId' },
			{ headers: mergeAuthHeaders(auth), status: 400 },
		)
	}

	switch (intent) {
		case 'add': {
			const projectId = formData.get('projectId') as string
			const tags = JSON.parse((formData.get('tags') as string) || '[]')
			const start = formData.get('start') as string
			const end = formData.get('end') as string
			await addUserBookingByOrganisation(
				orgId,
				{ end, projectId, start, tags },
				{ headers },
			)
			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		case 'addFavorite': {
			const projectId = formData.get('projectId') as string
			const tags = JSON.parse((formData.get('tags') as string) || '[]')
			await addFavoriteBooking(orgId, { projectId, tags }, { headers })
			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		case 'delete': {
			const bookingId = formData.get('bookingId') as string
			await deleteUserBooking(orgId, bookingId, { headers })
			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		case 'stop': {
			const bookingId = formData.get('bookingId') as string
			const end = formData.get('end') as string
			const projectId = formData.get('projectId') as string
			const tags = JSON.parse((formData.get('tags') as string) || '[]')
			const start = formData.get('start') as string

			const startDate = new Date(start)
			const endDate = new Date(end)
			const spansMidnight = !isSameDay(startDate, endDate)

			if (!spansMidnight) {
				await stopUserBookingCurrent(orgId, bookingId, { end }, { headers })
			} else {
				// Midnight-spanning: stop at 23:59:59 of start day, then add next-day booking
				const endOfStartDay = endOfDay(startDate)
				const startOfNextDay = startOfDay(addDays(startDate, 1))

				await stopUserBookingCurrent(
					orgId,
					bookingId,
					{ end: formatISOLocale(endOfStartDay) },
					{ headers },
				)

				await addUserBookingByOrganisation(
					orgId,
					{
						end: formatISOLocale(endDate),
						projectId,
						start: formatISOLocale(startOfNextDay),
						tags,
					},
					{ headers },
				)
			}

			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		case 'stopAndStart': {
			const projectId = formData.get('projectId') as string
			const tags = JSON.parse((formData.get('tags') as string) || '[]')
			const start = formData.get('start') as string

			const currentRes = await getUserBookingCurrent({ headers })
			const current = currentRes.data
			if (current?.booking?.id) {
				await stopUserBookingCurrent(
					orgId,
					current.booking.id,
					{ end: start },
					{ headers },
				)
			}

			await startUserBookingCurrent(
				orgId,
				{ projectId, start, tags },
				{ headers },
			)
			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		case 'update': {
			const bookingId = formData.get('bookingId') as string
			const projectId = formData.get('projectId') as string
			const tags = JSON.parse((formData.get('tags') as string) || '[]')
			const start = formData.get('start') as null | string
			const end = formData.get('end') as null | string
			await updateUserBooking(
				orgId,
				bookingId,
				{
					end: end || undefined,
					projectId,
					start: start || undefined,
					tags,
				},
				{ headers },
			)
			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		case 'updateCurrent': {
			const bookingId = formData.get('bookingId') as string
			const newStart = formData.get('newStart') as string
			await updateUserBookingCurrent(
				orgId,
				bookingId,
				{ newStart },
				{ headers },
			)
			return data({ ok: true }, { headers: mergeAuthHeaders(auth) })
		}

		default:
			return data(
				{ error: `Unknown intent: ${intent}` },
				{ headers: mergeAuthHeaders(auth), status: 400 },
			)
	}
}
