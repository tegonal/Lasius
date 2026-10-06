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

import { PlatformTag } from '~/features/tags/components/platform-tag'
import { SimpleTag } from '~/features/tags/components/simple-tag'
import {
  getTagSummary,
  getTagText,
  getTagVariant,
  openIssueLink,
  type TagWidth,
} from '~/features/tags/lib/tag-display'
import { getImporterTypeFromTag } from '~/lib/utils/tag-helpers'
import { type ModelsTag } from '~/services/api/lasius'

type TagProperties = {
  active?: boolean
  clickHandler?: (tag: ModelsTag) => void
  hideRemoveIcon?: boolean
  item: ModelsTag
  width?: TagWidth
}

export const Tag = ({
  active,
  clickHandler,
  hideRemoveIcon,
  item,
  width = 'md',
}: TagProperties) => {
  const isClickable = !!clickHandler
  const isRemovable = isClickable && !hideRemoveIcon
  const handleClick = () => (clickHandler ? clickHandler(item) : openIssueLink(item))

  const summary = getTagSummary(item)
  const importerType = getImporterTypeFromTag(item)

  if (importerType && summary) {
    return (
      <PlatformTag
        active={active}
        clickable={isClickable}
        id={item.id}
        importerType={importerType}
        onClick={handleClick}
        removable={isRemovable}
        summary={summary}
        width={width}
      />
    )
  }

  return (
    <SimpleTag
      active={active}
      clickable={isClickable}
      onClick={handleClick}
      removable={isRemovable}
      text={getTagText(item)}
      variant={getTagVariant(item)}
      width={width}
    />
  )
}

type TagListProperties = {
  clickHandler?: (tag: ModelsTag) => void
  hideRemoveIcon?: boolean
  items: ModelsTag[] | null | undefined
  width?: TagWidth
}

export const TagList = ({
  clickHandler,
  hideRemoveIcon = false,
  items,
  width,
}: TagListProperties) => {
  if (!items || items.length === 0) return null
  return (
    <div className="flex w-full min-w-0 flex-row flex-wrap gap-1">
      {items
        .filter((item) => !!item?.id?.trim())
        .map((item) => (
          <Tag
            clickHandler={clickHandler}
            hideRemoveIcon={hideRemoveIcon}
            item={item}
            key={item.id}
            width={width}
          />
        ))}
    </div>
  )
}
