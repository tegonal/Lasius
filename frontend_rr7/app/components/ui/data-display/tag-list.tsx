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
import { XIcon } from 'lucide-react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ImporterTypeIcon } from '~/features/issue-importers/importer-type-icon'
import { cn } from '~/lib/utils/cn'
import { getImporterTypeFromTag } from '~/lib/utils/tag-helpers'
import { type ModelsTag } from '~/services/api/lasius'

import { Badge } from './badge'

const tagLabelVariants = cva(
	'block overflow-hidden text-ellipsis whitespace-nowrap',
	{
		defaultVariants: { width: 'md' },
		variants: {
			width: {
				lg: 'max-w-[50ch]',
				md: 'max-w-[35ch]',
				sm: 'max-w-[23ch]',
				xs: 'max-w-[18ch]',
			},
		},
	},
)

type TagWidth = VariantProps<typeof tagLabelVariants>['width']

const ItemLabel = ({
	label,
	summary,
	width,
}: {
	label: string
	summary: string
	width?: TagWidth
}) => {
	const fullText = summary ? `${label}: ${summary}` : label
	return (
		<span className={cn(tagLabelVariants({ width }))} title={fullText}>
			{fullText}
		</span>
	)
}

type TagProps = {
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
}: TagProps) => {
	const clickable = !!clickHandler
	const clickableAndRemovable = !!clickHandler && !hideRemoveIcon

	let tagVariant: 'tagSimpleTag' | 'tagTagGroup' | 'tagWithSummary'

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

	const summary = 'summary' in item && item.summary ? String(item.summary) : ''
	const importerType = getImporterTypeFromTag(item)
	const isPlatformTag = !!importerType

	function clickTag(tag: ModelsTag) {
		if (clickHandler) {
			clickHandler(tag)
		} else if ('issueLink' in tag) {
			window.open(String(tag.issueLink), '_blank')
		}
	}

	const fullText = summary ? `${item.id}: ${summary}` : item.id

	// Platform tags: Use join with multiple Badge components
	if (isPlatformTag && summary) {
		return (
			<div
				className={cn(tagLabelVariants({ width }), 'join group inline-flex')}
				title={fullText}
			>
				{importerType && (
					<Badge
						className={cn(
							'join-item !rounded-l-badge group-hover:bg-neutral group-hover:text-neutral-content rounded-r-none px-1',
							active && 'bg-neutral text-neutral-content',
						)}
						clickable={clickable}
						onClick={() => clickTag(item)}
						style={
							active
								? undefined
								: {
										background:
											'oklch(from var(--color-secondary) calc(l - 0.3) c h)',
									}
						}
						variant="tagWithSummary"
					>
						<ImporterTypeIcon className="h-4 w-4" type={importerType} />
					</Badge>
				)}
				<Badge
					className={cn(
						'join-item group-hover:bg-neutral group-hover:text-neutral-content rounded-none px-1',
						active && 'bg-neutral text-neutral-content',
					)}
					clickable={clickable}
					onClick={() => clickTag(item)}
					style={
						active
							? undefined
							: {
									background:
										'oklch(from var(--color-secondary) calc(l - 0.15) c h)',
								}
					}
					variant="tagWithSummary"
				>
					{item.id}
				</Badge>
				<Badge
					className={cn(
						'join-item !rounded-r-badge group-hover:bg-neutral group-hover:text-neutral-content min-w-0 rounded-l-none',
						active && 'bg-neutral text-neutral-content',
					)}
					clickable={clickable}
					onClick={() => clickTag(item)}
					variant="tagWithSummary"
				>
					<span
						className="block w-full overflow-hidden text-ellipsis whitespace-nowrap"
						title={summary}
					>
						{summary}
					</span>
					{clickableAndRemovable && (
						<LucideIcon icon={XIcon} size={16} strokeWidth={2} />
					)}
				</Badge>
			</div>
		)
	}

	// Simple tags: Single Badge
	return (
		<Badge
			className={active ? 'bg-neutral text-neutral-content' : undefined}
			clickable={clickable}
			onClick={() => clickTag(item)}
			variant={tagVariant}
		>
			<ItemLabel label={item.id} summary={summary} width={width} />
			{clickableAndRemovable && (
				<LucideIcon icon={XIcon} size={16} strokeWidth={2} />
			)}
		</Badge>
	)
}

type TagListProps = {
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
}: TagListProps) => {
	if (!items || items.length < 1) return null
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
