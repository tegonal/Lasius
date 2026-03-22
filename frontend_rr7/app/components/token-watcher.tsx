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

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { href, useNavigate, useRevalidator } from 'react-router'

import { logger } from '~/lib/logger'

const POLL_INTERVAL_MS = 30_000
const EXPIRY_WARNING_MS = 2 * 60 * 1000 // 2 minutes

interface SessionStatus {
	authenticated: boolean
	expiresAt: null | number
}

/**
 * Client-only component that polls /api/session-status and warns
 * the user before their session expires. Loader-based auto-refresh
 * handles most cases transparently; this is a safety net for idle tabs.
 */
export const TokenWatcher = () => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const revalidator = useRevalidator()
	const [showWarning, setShowWarning] = useState(false)
	const dialogRef = useRef<HTMLDialogElement>(null)

	const poll = useCallback(async () => {
		try {
			const res = await fetch('/api/session-status')

			if (!res.ok) {
				logger.warn('[TokenWatcher] Session status request failed', res.status)
				return
			}

			const status: SessionStatus = await res.json()

			if (!status.authenticated) {
				logger.info('[TokenWatcher] Session gone, redirecting to login')
				void navigate(href('/login'), { replace: true })
				return
			}

			if (status.expiresAt) {
				const remaining = status.expiresAt - Date.now()

				if (remaining <= EXPIRY_WARNING_MS) {
					setShowWarning(true)
				}
			}
		} catch (error) {
			logger.warn('[TokenWatcher] Failed to check session status', error)
		}
	}, [navigate])

	useEffect(() => {
		// Initial check
		void poll()

		const id = setInterval(() => void poll(), POLL_INTERVAL_MS)
		return () => clearInterval(id)
	}, [poll])

	// Sync dialog open/close with state
	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		if (showWarning && !dialog.open) {
			dialog.showModal()
		} else if (!showWarning && dialog.open) {
			dialog.close()
		}
	}, [showWarning])

	const handleExtendSession = useCallback(() => {
		setShowWarning(false)
		// Revalidate all loaders — this triggers getSessionTokens() which auto-refreshes
		void revalidator.revalidate()
	}, [revalidator])

	const handleLogout = useCallback(() => {
		setShowWarning(false)
		void navigate(href('/logout'))
	}, [navigate])

	return (
		<dialog
			className="modal"
			data-testid="session-timeout-dialog"
			onClose={() => setShowWarning(false)}
			ref={dialogRef}
		>
			<div className="modal-box">
				<h3 className="text-lg font-bold">
					{t('common:SessionTimeout.title', 'Session Expiring')}
				</h3>
				<p className="py-4">
					{t(
						'common:SessionTimeout.message',
						'Your session will expire soon. Would you like to extend it?',
					)}
				</p>
				<div className="modal-action">
					<button
						className="btn btn-outline"
						data-testid="session-timeout-logout-btn"
						onClick={handleLogout}
						type="button"
					>
						{t('common:SessionTimeout.logout', 'Logout')}
					</button>
					<button
						className="btn btn-primary"
						data-testid="session-timeout-extend-btn"
						onClick={handleExtendSession}
						type="button"
					>
						{t('common:SessionTimeout.extend', 'Extend Session')}
					</button>
				</div>
			</div>
			<form className="modal-backdrop" method="dialog">
				<button type="submit">close</button>
			</form>
		</dialog>
	)
}
