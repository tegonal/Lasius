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

import { type ModelsTag } from '~/services/api/lasius'

export const tagLabelVariants = cva('block overflow-hidden text-ellipsis whitespace-nowrap', {
  defaultVariants: { width: 'md' },
  variants: {
    width: {
      lg: 'max-w-[50ch]',
      md: 'max-w-[35ch]',
      sm: 'max-w-[23ch]',
      xs: 'max-w-[18ch]',
    },
  },
})

export type TagBadgeVariant = 'tagSimpleTag' | 'tagTagGroup' | 'tagWithSummary'

export type TagWidth = VariantProps<typeof tagLabelVariants>['width']

export const getTagVariant = (tag: ModelsTag): TagBadgeVariant => {
  if (tag.type === 'SimpleTag') return 'tagSimpleTag'
  if (tag.type === 'TagGroup') return 'tagTagGroup'
  return 'summary' in tag ? 'tagWithSummary' : 'tagSimpleTag'
}

export const getTagSummary = (tag: ModelsTag): string =>
  'summary' in tag && tag.summary ? tag.summary : ''

export const getTagText = (tag: ModelsTag): string => {
  const summary = getTagSummary(tag)
  return summary ? `${tag.id}: ${summary}` : tag.id
}

// The issue tracker supplies the link. Only an absolute http or https URL opens, and without a
// window.opener reference to this tab.
export const getIssueLink = (tag: ModelsTag): null | string => {
  if (!('issueLink' in tag) || !tag.issueLink) return null
  try {
    const url = new URL(tag.issueLink)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export const openIssueLink = (tag: ModelsTag): void => {
  const link = getIssueLink(tag)
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer')
  }
}
