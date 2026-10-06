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

import type React from 'react'

import { XIcon } from 'lucide-react'

import { Badge } from '~/components/ui/data-display/badge'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ImporterTypeIcon } from '~/features/issue-importers/importer-type-icon'
import { tagLabelVariants, type TagWidth } from '~/features/tags/lib/tag-display'
import { cn } from '~/lib/utils/cn'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type SegmentPosition = 'end' | 'middle' | 'start'

const SEGMENT_CLASSES: Record<SegmentPosition, string> = {
  end: '!rounded-r-badge min-w-0 rounded-l-none',
  middle: 'rounded-none px-1',
  start: '!rounded-l-badge rounded-r-none px-1',
}

// The icon and the key segments darken the secondary color, so the three badges read as one tag.
const SEGMENT_LIGHTNESS_OFFSET: Partial<Record<SegmentPosition, number>> = {
  middle: 0.15,
  start: 0.3,
}

type SegmentProperties = {
  active?: boolean
  children: React.ReactNode
  clickable: boolean
  onClick: () => void
  position: SegmentPosition
}

const Segment = ({ active, children, clickable, onClick, position }: SegmentProperties) => {
  const offset = SEGMENT_LIGHTNESS_OFFSET[position]
  return (
    <Badge
      className={cn(
        'join-item group-hover:bg-neutral group-hover:text-neutral-content',
        SEGMENT_CLASSES[position],
        active && 'bg-neutral text-neutral-content',
      )}
      clickable={clickable}
      onClick={onClick}
      style={
        active || offset === undefined
          ? undefined
          : { background: `oklch(from var(--color-secondary) calc(l - ${offset}) c h)` }
      }
      variant="tagWithSummary">
      {children}
    </Badge>
  )
}

type PlatformTagProperties = {
  active?: boolean
  clickable: boolean
  id: string
  importerType: ImporterType
  onClick: () => void
  removable: boolean
  summary: string
  width?: TagWidth
}

export const PlatformTag = ({
  active,
  clickable,
  id,
  importerType,
  onClick,
  removable,
  summary,
  width,
}: PlatformTagProperties) => {
  const segment = { active, clickable, onClick }

  return (
    <div
      className={cn(tagLabelVariants({ width }), 'join group inline-flex')}
      title={`${id}: ${summary}`}>
      <Segment {...segment} position="start">
        <ImporterTypeIcon className="h-4 w-4" type={importerType} />
      </Segment>
      <Segment {...segment} position="middle">
        {id}
      </Segment>
      <Segment {...segment} position="end">
        <span
          className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
          title={summary}>
          {summary}
        </span>
        {removable && <LucideIcon icon={XIcon} size={16} strokeWidth={2} />}
      </Segment>
    </div>
  )
}
