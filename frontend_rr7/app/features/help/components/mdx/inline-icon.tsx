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

import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Copy,
  EllipsisVertical,
  Eye,
  type LucideIcon as LucideIconType,
  PlayCircle,
  Plus,
  Square,
  Star,
  Trash2,
  Users,
} from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

/**
 * Explicit map of icons available in MDX help content.
 * Only these icons are bundled — keeps lucide-react tree-shakeable.
 * When adding a new <Icon name="..." /> in MDX, add the import + map entry here.
 */
const iconMap: Record<string, LucideIconType> = {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Copy,
  EllipsisVertical,
  Eye,
  PlayCircle,
  Plus,
  Square,
  Star,
  Trash2,
  Users,
}

interface InlineIconProps {
  name: string
  size?: number
}

export const InlineIcon = ({ name, size = 18 }: InlineIconProps) => {
  const IconComponent = iconMap[name]

  if (!IconComponent) {
    return <span>{name}</span>
  }

  return (
    <span className="inline-flex align-middle">
      <LucideIcon icon={IconComponent} size={size} />
    </span>
  )
}
