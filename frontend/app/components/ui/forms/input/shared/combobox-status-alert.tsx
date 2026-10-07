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

import { cn } from '~/lib/utils/cn'

export type ComboboxStatusMessage = {
  text: string
  variant: 'error' | 'info' | 'warning'
}

const ALERT_VARIANT_CLASS: Record<ComboboxStatusMessage['variant'], string> = {
  error: 'alert-error',
  info: 'alert-info',
  warning: 'alert-warning',
}

interface ComboboxStatusAlertProperties {
  message: ComboboxStatusMessage | null | undefined
}

export const ComboboxStatusAlert = ({ message }: ComboboxStatusAlertProperties) => {
  if (!message) return null
  return (
    <div className={cn('alert mt-2', ALERT_VARIANT_CLASS[message.variant])}>{message.text}</div>
  )
}
