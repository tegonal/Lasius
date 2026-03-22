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

import { ArrowLeft, Clock, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { TagList } from '~/components/ui/data-display/tag-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import {
	IconTabs,
	type IconTabsItem,
} from '~/components/ui/navigation/icon-tabs'
import { stringHash } from '~/lib/utils/string-hash'
import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'
import { type ModelsBookingStub } from '~/services/api/lasius/modelsBookingStub'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'

type PresetSelection = {
	projectId: string
	projectName: string
	tags: ModelsTag[]
}

type Props = {
	favorites: ModelsBookingStub[]
	onBack: () => void
	onSelect: (preset: PresetSelection) => void
	orgBookings: ModelsBooking[]
	recentBookings: ModelsBooking[]
}

const EmptyState = () => {
	const { t } = useTranslation()
	return (
		<div className="text-base-content/50 flex items-center justify-center p-8 text-sm">
			{t('bookings.presets.empty', { defaultValue: 'No bookings found' })}
		</div>
	)
}

const PresetButton = ({
	ariaLabel,
	children,
	onClick,
}: {
	ariaLabel: string
	children: React.ReactNode
	onClick: () => void
}) => (
	<button
		aria-label={ariaLabel}
		className="hover:bg-base-200 flex w-full cursor-pointer items-start gap-2 rounded-lg p-3 text-left transition-colors"
		onClick={onClick}
		type="button"
	>
		{children}
	</button>
)

const BookingPresetItem = ({
	item,
}: {
	item: { projectReference: { id: string; key: string }; tags: ModelsTag[] }
}) => (
	<div className="flex-1 space-y-1">
		<div className="text-sm font-medium">
			{item.projectReference.key || item.projectReference.id}
		</div>
		{item.tags.length > 0 && <TagList items={item.tags} />}
	</div>
)

const AvatarInitials = ({
	firstName,
	lastName,
}: {
	firstName: string
	lastName: string
}) => {
	const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
	return (
		<div className="bg-primary text-primary-content flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
			{initials}
		</div>
	)
}

const AnimatedList = ({ children }: { children: React.ReactNode }) => (
	<div className="flex flex-col">{children}</div>
)

const AnimatedItem = ({
	children,
	index,
}: {
	children: React.ReactNode
	index: number
}) => (
	<div
		className="animate-in fade-in"
		style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
	>
		{children}
	</div>
)

const RecentBookingsList = ({
	items,
	onSelect,
}: {
	items: ModelsBooking[]
	onSelect: (preset: PresetSelection) => void
}) => {
	const { t } = useTranslation()

	if (!items.length) return <EmptyState />

	// Deduplicate by project + tags
	const seen = new Set<string>()
	const unique: ModelsBooking[] = []
	for (const booking of items) {
		const key = `${booking.projectReference.id}-${booking.tags
			.map((tag) => tag.id)
			.sort()
			.join(',')}`
		if (!seen.has(key)) {
			seen.add(key)
			unique.push(booking)
			if (unique.length >= 20) break
		}
	}

	return (
		<AnimatedList>
			{unique.map((item, index) => (
				<AnimatedItem index={index} key={stringHash(item)}>
					<PresetButton
						ariaLabel={t('bookings.presets.selectRecent', {
							defaultValue:
								'Select recent booking: {{projectName}}{{tags}}',
							projectName:
								item.projectReference.key ||
								item.projectReference.id,
							tags:
								item.tags.length > 0
									? ` with ${item.tags.length} tags`
									: '',
						})}
						onClick={() =>
							onSelect({
								projectId: item.projectReference.id,
								projectName:
									item.projectReference.key ||
									item.projectReference.id,
								tags: item.tags,
							})
						}
					>
						<BookingPresetItem item={item} />
					</PresetButton>
				</AnimatedItem>
			))}
		</AnimatedList>
	)
}

const FavoritesList = ({
	items,
	onSelect,
}: {
	items: ModelsBookingStub[]
	onSelect: (preset: PresetSelection) => void
}) => {
	const { t } = useTranslation()

	if (!items.length) return <EmptyState />

	return (
		<AnimatedList>
			{items.map((item, index) => (
				<AnimatedItem index={index} key={stringHash(item)}>
					<PresetButton
						ariaLabel={t('bookings.presets.selectFavorite', {
							defaultValue:
								'Select favorite: {{projectName}}{{tags}}',
							projectName:
								item.projectReference.key ||
								item.projectReference.id,
							tags:
								item.tags.length > 0
									? ` with ${item.tags.length} tags`
									: '',
						})}
						onClick={() =>
							onSelect({
								projectId: item.projectReference.id,
								projectName:
									item.projectReference.key ||
									item.projectReference.id,
								tags: item.tags,
							})
						}
					>
						<BookingPresetItem item={item} />
					</PresetButton>
				</AnimatedItem>
			))}
		</AnimatedList>
	)
}

const TeamBookingsList = ({
	items,
	onSelect,
}: {
	items: ModelsBooking[]
	onSelect: (preset: PresetSelection) => void
}) => {
	const { t } = useTranslation()

	if (!items.length) return <EmptyState />

	// Deduplicate by project + tags
	const seen = new Set<string>()
	const unique: ModelsBooking[] = []
	for (const booking of items) {
		const key = `${booking.projectReference.id}-${booking.tags
			.map((tag) => tag.id)
			.sort()
			.join(',')}`
		if (!seen.has(key)) {
			seen.add(key)
			unique.push(booking)
			if (unique.length >= 20) break
		}
	}

	return (
		<AnimatedList>
			{unique.map((item, index) => (
				<AnimatedItem index={index} key={stringHash(item)}>
					<PresetButton
						ariaLabel={t('bookings.presets.selectTeam', {
							defaultValue:
								'Select team booking: {{projectName}}{{tags}}',
							projectName:
								item.projectReference.key ||
								item.projectReference.id,
							tags:
								item.tags.length > 0
									? ` with ${item.tags.length} tags`
									: '',
						})}
						onClick={() =>
							onSelect({
								projectId: item.projectReference.id,
								projectName:
									item.projectReference.key ||
									item.projectReference.id,
								tags: item.tags,
							})
						}
					>
						<AvatarInitials
							firstName={
								item.userReference?.key?.split(' ')[0] ?? '?'
							}
							lastName={
								item.userReference?.key?.split(' ')[1] ?? ''
							}
						/>
						<BookingPresetItem item={item} />
					</PresetButton>
				</AnimatedItem>
			))}
		</AnimatedList>
	)
}

export const BookingPresetSelector = ({
	favorites,
	onBack,
	onSelect,
	orgBookings,
	recentBookings,
}: Props) => {
	const { t } = useTranslation()
	const [selectedTab, setSelectedTab] = useState(0)

	const tabs: IconTabsItem[] = [
		{
			component: (
				<RecentBookingsList items={recentBookings} onSelect={onSelect} />
			),
			icon: Clock,
			id: 'recent',
			name: t('bookings.presets.recent', {
				defaultValue: 'Recent bookings',
			}),
		},
		{
			component: (
				<FavoritesList items={favorites} onSelect={onSelect} />
			),
			icon: Star,
			id: 'favorites',
			name: t('bookings.presets.favorites', {
				defaultValue: 'Favorites',
			}),
		},
		{
			component: (
				<TeamBookingsList items={orgBookings} onSelect={onSelect} />
			),
			icon: Users,
			id: 'team',
			name: t('bookings.presets.team', {
				defaultValue: 'Team bookings',
			}),
		},
	]

	return (
		<div className="flex h-full flex-col">
			<div className="border-base-content/10 border-b px-4 py-3">
				<Button
					className="w-full gap-2"
					onClick={onBack}
					size="sm"
					variant="neutral"
				>
					<LucideIcon icon={ArrowLeft} size={16} />
					{t('common.back', { defaultValue: 'Back' })}
				</Button>
				<h6 className="mt-3 text-center text-base font-semibold">
					{t('bookings.presets.title', {
						defaultValue: 'Choose a preset',
					})}
				</h6>
			</div>
			<div className="flex-1 overflow-hidden">
				<IconTabs
					onSelect={setSelectedTab}
					selected={selectedTab}
					tabs={tabs}
				/>
			</div>
		</div>
	)
}
