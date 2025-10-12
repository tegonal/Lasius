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

import { cva, type VariantProps } from 'class-variance-authority'
import { ImporterTypeIcon } from 'components/features/issue-importers/shared/ImporterTypeIcon'
import { Badge } from 'components/ui/data-display/Badge'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { cn } from 'lib/utils/cn'
import { getImporterTypeFromTag } from 'lib/utils/tagHelpers'
import { XIcon } from 'lucide-react'
import React from 'react'
import { ModelsTags } from 'types/common'

const tagLabelVariants = cva('block overflow-hidden text-ellipsis whitespace-nowrap', {
  variants: {
    width: {
      xs: 'max-w-[18ch]',
      sm: 'max-w-[23ch]',
      md: 'max-w-[35ch]',
      lg: 'max-w-[50ch]',
    },
  },
  defaultVariants: {
    width: 'md',
  },
})

type ItemLabelProps = {
  label: string
  summary: string
  width?: VariantProps<typeof tagLabelVariants>['width']
}

const ItemLabel: React.FC<ItemLabelProps> = ({ label, summary, width }) => {
  const fullText = summary ? `${label}: ${summary}` : label

  return (
    <span className={cn(tagLabelVariants({ width }))} title={fullText}>
      {fullText}
    </span>
  )
}

type PropsTagContainer = {
  item: ModelsTags
  clickHandler?: (tag: ModelsTags) => void
  hideRemoveIcon?: boolean
  active?: boolean
  width?: VariantProps<typeof tagLabelVariants>['width']
}

export const Tag: React.FC<PropsTagContainer> = ({
  active: _active,
  clickHandler,
  hideRemoveIcon,
  item,
  width = 'md',
}) => {
  const clickable = !!clickHandler
  const clickableAndRemovable = !!clickHandler && !hideRemoveIcon

  let tagVariant:
    | 'primary'
    | 'muted'
    | 'tag'
    | 'tagSimpleTag'
    | 'tagTagGroup'
    | 'tagWithSummary'
    | 'warning'
    | 'outline'
    | 'tooltip'

  switch (true) {
    case item.type === 'SimpleTag':
      tagVariant = 'tagSimpleTag'
      break
    case item.type === 'TagGroup':
      tagVariant = 'tagTagGroup'
      break
    case 'summary' in item:
      tagVariant = 'tagWithSummary'
      break
    default:
      tagVariant = 'tagSimpleTag'
      break
  }

  const summary = 'summary' in item && item.summary ? item.summary : ''
  const importerType = getImporterTypeFromTag(item)
  const isPlatformTag = !!importerType

  function clickTag(item: ModelsTags) {
    if (clickHandler) {
      clickHandler(item)
    } else if ('issueLink' in item) {
      window.open(item.issueLink, '_blank')
    }
  }

  const fullText = summary ? `${item.id}: ${summary}` : item.id

  // Platform tags: Use join with multiple Badge components
  if (isPlatformTag && summary) {
    return (
      <div className={cn(tagLabelVariants({ width }), 'join group inline-flex')} title={fullText}>
        {importerType && (
          <Badge
            variant="tagWithSummary"
            clickable={clickable}
            onClick={() => clickTag(item)}
            className="join-item !rounded-l-badge group-hover:bg-neutral group-hover:text-neutral-content rounded-r-none px-1"
            style={{ background: 'oklch(from var(--color-secondary) calc(l - 0.3) c h)' }}>
            <ImporterTypeIcon type={importerType} className="h-4 w-4" />
          </Badge>
        )}
        <Badge
          variant="tagWithSummary"
          clickable={clickable}
          onClick={() => clickTag(item)}
          className="join-item group-hover:bg-neutral group-hover:text-neutral-content rounded-none px-1"
          style={{ background: 'oklch(from var(--color-secondary) calc(l - 0.15) c h)' }}>
          {item.id}
        </Badge>
        <Badge
          variant="tagWithSummary"
          clickable={clickable}
          onClick={() => clickTag(item)}
          className="join-item !rounded-r-badge group-hover:bg-neutral group-hover:text-neutral-content min-w-0 rounded-l-none">
          <span
            className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
            title={summary}>
            {summary}
          </span>
          {clickableAndRemovable && <LucideIcon icon={XIcon} size={16} strokeWidth={2} />}
        </Badge>
      </div>
    )
  }

  // Simple tags: Single Badge
  return (
    <Badge variant={tagVariant} onClick={() => clickTag(item)} clickable={clickable}>
      <ItemLabel label={item.id} summary={summary} width={width} />
      {clickableAndRemovable && <LucideIcon icon={XIcon} size={16} strokeWidth={2} />}
    </Badge>
  )
}

type Props = {
  items: ModelsTags[] | null | undefined
  clickHandler?: (tag: ModelsTags) => void
  hideRemoveIcon?: boolean
  width?: VariantProps<typeof tagLabelVariants>['width']
}

export const TagList: React.FC<Props> = ({
  items,
  clickHandler,
  hideRemoveIcon = false,
  width,
}) => {
  if (!items || items.length < 1) return null
  return (
    <div className="flex w-full min-w-0 flex-row flex-wrap gap-1">
      {items
        .filter((item) => !!item?.id?.trim())
        .map((item) => (
          <Tag
            key={item.id}
            item={item}
            clickHandler={clickHandler}
            hideRemoveIcon={hideRemoveIcon}
            width={width}
          />
        ))}
    </div>
  )
}
