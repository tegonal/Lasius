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

import { Badge } from 'components/ui/data-display/Badge'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { XIcon } from 'lucide-react'
import React from 'react'
import { ModelsTags } from 'types/common'

type ItemLabelProps = {
  label: string
  summary: string
}
const ItemLabel: React.FC<ItemLabelProps> = ({ label, summary }) => {
  let processedLabel = label
  const cutoff = 18
  const labelWordCount = label.split(' ').length
  if (label.length > cutoff && labelWordCount > 2 && !summary) {
    processedLabel = `${label.substring(0, cutoff)}...`
    return (
      <ToolTip toolTipContent={label}>
        <>{processedLabel}</>
      </ToolTip>
    )
  }

  if (summary) {
    return (
      <ToolTip toolTipContent={summary}>
        <>{`${processedLabel}: ${summary.substring(0, cutoff)}...`}</>
      </ToolTip>
    )
  }

  return <>{`${processedLabel}`}</>
}

type PropsTagContainer = {
  item: ModelsTags
  clickHandler?: (tag: ModelsTags) => void
  hideRemoveIcon?: boolean
  active?: boolean
}

export const Tag: React.FC<PropsTagContainer> = ({
  active: _active,
  clickHandler,
  hideRemoveIcon,
  item,
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

  function clickTag(item: ModelsTags) {
    if (clickHandler) {
      clickHandler(item)
    } else if ('issueLink' in item) {
      window.open(item.issueLink, '_blank')
    }
  }

  return (
    <Badge variant={tagVariant} onClick={() => clickTag(item)} clickable={clickable}>
      <ItemLabel label={item.id} summary={summary} />
      {clickableAndRemovable && <LucideIcon icon={XIcon} size={16} strokeWidth={2} />}
    </Badge>
  )
}

type Props = {
  items: ModelsTags[] | null | undefined
  clickHandler?: (tag: ModelsTags) => void
  hideRemoveIcon?: boolean
}

export const TagList: React.FC<Props> = ({ items, clickHandler, hideRemoveIcon = false }) => {
  if (!items || items.length < 1) return null
  return (
    <div className="flex flex-wrap gap-1">
      {items
        .filter((item) => !!item?.id?.trim())
        .map((item) => (
          <Tag
            key={item.id}
            item={item}
            clickHandler={clickHandler}
            hideRemoveIcon={hideRemoveIcon}
          />
        ))}
    </div>
  )
}
