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

import { type LucideIcon } from 'lucide-react'

type Preset = { icon: LucideIcon; label: string }

/**
 * Which parts the date picker shows, and where the preset button goes. With a time input, the
 * preset follows the time. Without one, a compact preset follows the date.
 */
export const getDatePickerLayout = ({
  presetDate,
  presetIcon,
  presetLabel,
  withDate,
  withTime,
}: {
  presetDate?: string
  presetIcon?: LucideIcon
  presetLabel?: string
  withDate: boolean
  withTime: boolean
}) => {
  const preset: null | Preset =
    presetDate && presetLabel && presetIcon ? { icon: presetIcon, label: presetLabel } : null
  return {
    datePreset: withTime ? null : preset,
    showDate: withDate,
    showSpacer: withDate && withTime,
    showTime: withTime,
    timePreset: preset,
  }
}
