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

import { Toast } from '@base-ui/react/toast'
import { useCallback } from 'react'

import { type ToastData, type ToastType } from './toast-manager'

type AddToastOptions = {
	action?: {
		href: string
		label: string
	}
	description?: string
	message: string
	ttl?: number
	type: ToastType
}

export function useToast() {
	const manager = Toast.useToastManager<ToastData>()

	const addToast = useCallback(
		(options: AddToastOptions) => {
			manager.add({
				data: options.action ? { action: options.action } : undefined,
				description: options.description,
				timeout: options.ttl,
				title: options.message,
				type: options.type,
			})
		},
		[manager],
	)

	return { addToast }
}
