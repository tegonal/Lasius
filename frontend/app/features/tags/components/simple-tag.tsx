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

import { XIcon } from 'lucide-react'

import { Badge } from '~/components/ui/data-display/badge'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import {
  type TagBadgeVariant,
  tagLabelVariants,
  type TagWidth,
} from '~/features/tags/lib/tag-display'

type SimpleTagProperties = {
  active?: boolean
  clickable: boolean
  onClick: () => void
  removable: boolean
  text: string
  variant: TagBadgeVariant
  width?: TagWidth
}

export const SimpleTag = ({
  active,
  clickable,
  onClick,
  removable,
  text,
  variant,
  width,
}: SimpleTagProperties) => (
  <Badge
    className={active ? 'bg-neutral text-neutral-content' : undefined}
    clickable={clickable}
    onClick={onClick}
    variant={variant}>
    <span className={tagLabelVariants({ width })} title={text}>
      {text}
    </span>
    {removable && <LucideIcon icon={XIcon} size={16} strokeWidth={2} />}
  </Badge>
)
