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

import { type LucideIcon as LucideIconType } from 'lucide-react'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export type DatePreset = {
  icon: LucideIconType
  label: string
}

type PresetButtonProperties = {
  compact?: boolean
  onClick: () => void
  preset: DatePreset
}

// The compact form sits next to the date input when the picker has no time input.
export const PresetButton = ({ compact, onClick, preset }: PresetButtonProperties) => (
  <Button
    aria-label={preset.label}
    className={compact ? 'p-0' : 'px-2'}
    fullWidth={false}
    join
    onClick={onClick}
    size={compact ? 'sm' : undefined}
    title={preset.label}
    type="button"
    variant={compact ? 'ghost' : 'neutral'}>
    <LucideIcon icon={preset.icon} size={20} />
  </Button>
)
