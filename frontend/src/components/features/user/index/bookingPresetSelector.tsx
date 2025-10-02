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

import { Button } from 'components/primitives/buttons/Button'
import { Heading } from 'components/primitives/typography/Heading'
import { AnimateList } from 'components/ui/animations/motion/animateList'
import { DataFetchValidates } from 'components/ui/data-display/fetchState/dataFetchValidates'
import { EmptyStatePresets } from 'components/ui/data-display/fetchState/emptyStatePresets'
import { TagList } from 'components/ui/data-display/TagList'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { IconTabs, IconTabsItem } from 'components/ui/navigation/IconTabs'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { formatDateTimeToURLParam } from 'lib/api/apiDateHandling'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { useGetOrganisationBookingList } from 'lib/api/lasius/organisation-bookings/organisation-bookings'
import { useGetUserBookingListByOrganisation } from 'lib/api/lasius/user-bookings/user-bookings'
import { useGetFavoriteBookingList } from 'lib/api/lasius/user-favorites/user-favorites'
import { stringHash } from 'lib/utils/string/stringHash'
import { ArrowLeft, Clock, Star, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { ModelsTags } from 'types/common'

type PresetType = {
  projectId: string
  projectName: string
  tags: ModelsTags[]
}

type Props = {
  onBack: () => void
  onSelect: (preset: PresetType) => void
}

// Component for recent bookings list
const RecentBookingsList: React.FC<{ onSelect: (preset: PresetType) => void }> = ({ onSelect }) => {
  const { selectedOrganisationId } = useOrganisation()

  // Get bookings from the last 7 days - memoize dates to prevent infinite requests
  const dateRange = useMemo(() => {
    const now = new Date()
    const weekAgo = subDays(now, 7)
    return {
      from: formatDateTimeToURLParam(startOfDay(weekAgo)),
      to: formatDateTimeToURLParam(endOfDay(now)),
    }
  }, []) // Empty dependency array - calculate once on mount

  const { data, isValidating } = useGetUserBookingListByOrganisation(
    selectedOrganisationId,
    dateRange,
  )

  // Get unique bookings (by project + tags combination)
  const uniqueBookings = useMemo(() => {
    if (!data || !data.length) return []

    const seen = new Set<string>()
    const unique: ModelsBooking[] = []

    for (const booking of data) {
      const key = `${booking.projectReference.id}-${booking.tags
        .map((t) => t.id)
        .sort()
        .join(',')}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(booking)
        if (unique.length >= 20) break
      }
    }

    return unique
  }, [data])

  if (isValidating) return <DataFetchValidates isValidating={isValidating} />
  if (!uniqueBookings.length) return <EmptyStatePresets />

  return (
    <AnimateList>
      {uniqueBookings.map((item) => (
        <button
          key={stringHash(item)}
          className="hover:bg-base-200 flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-colors"
          onClick={() =>
            onSelect({
              projectId: item.projectReference.id,
              projectName: item.projectReference.key || item.projectReference.id,
              tags: item.tags,
            })
          }>
          <LucideIcon icon={Clock} size={16} className="text-base-content/60 mt-1" />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium">
              {item.projectReference.key || item.projectReference.id}
            </div>
            {item.tags.length > 0 && <TagList items={item.tags} />}
          </div>
        </button>
      ))}
    </AnimateList>
  )
}

// Component for favorites list
const FavoritesList: React.FC<{ onSelect: (preset: PresetType) => void }> = ({ onSelect }) => {
  const { selectedOrganisationId } = useOrganisation()
  const { data, isValidating } = useGetFavoriteBookingList(selectedOrganisationId)

  if (isValidating) return <DataFetchValidates isValidating={isValidating} />
  if (!data?.favorites.length) return <EmptyStatePresets />

  return (
    <AnimateList>
      {data.favorites.map((item: any) => (
        <button
          key={stringHash(item)}
          className="hover:bg-base-200 flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-colors"
          onClick={() =>
            onSelect({
              projectId: item.projectReference.id,
              projectName: item.projectReference.key || item.projectReference.id,
              tags: item.tags,
            })
          }>
          <LucideIcon icon={Star} size={16} className="text-warning mt-1" />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium">
              {item.projectReference.key || item.projectReference.id}
            </div>
            {item.tags.length > 0 && <TagList items={item.tags} />}
          </div>
        </button>
      ))}
    </AnimateList>
  )
}

// Component for team bookings list
const TeamBookingsList: React.FC<{ onSelect: (preset: PresetType) => void }> = ({ onSelect }) => {
  const { selectedOrganisationId } = useOrganisation()

  // Get team bookings from the last 7 days - memoize dates to prevent infinite requests
  const dateRange = useMemo(() => {
    const now = new Date()
    const weekAgo = subDays(now, 7)
    return {
      from: formatDateTimeToURLParam(startOfDay(weekAgo)),
      to: formatDateTimeToURLParam(endOfDay(now)),
    }
  }, []) // Empty dependency array - calculate once on mount

  const { data, isValidating } = useGetOrganisationBookingList(selectedOrganisationId, dateRange)

  // Get unique bookings from team members
  const uniqueBookings = useMemo(() => {
    if (!data || !data.length) return []

    const seen = new Set<string>()
    const unique: ModelsBooking[] = []

    for (const booking of data) {
      const key = `${booking.projectReference.id}-${booking.tags
        .map((t) => t.id)
        .sort()
        .join(',')}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(booking)
        if (unique.length >= 20) break
      }
    }

    return unique
  }, [data])

  if (isValidating) return <DataFetchValidates isValidating={isValidating} />
  if (!uniqueBookings.length) return <EmptyStatePresets />

  return (
    <AnimateList>
      {uniqueBookings.map((item) => (
        <button
          key={stringHash(item)}
          className="hover:bg-base-200 flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-colors"
          onClick={() =>
            onSelect({
              projectId: item.projectReference.id,
              projectName: item.projectReference.key || item.projectReference.id,
              tags: item.tags,
            })
          }>
          <LucideIcon icon={Users} size={16} className="text-base-content/60 mt-1" />
          <div className="flex-1 space-y-1">
            <div className="text-sm font-medium">
              {item.projectReference.key || item.projectReference.id}
            </div>
            <div className="text-base-content/60 text-xs">
              {item.userReference.key || item.userReference.id}
            </div>
            {item.tags.length > 0 && <TagList items={item.tags} />}
          </div>
        </button>
      ))}
    </AnimateList>
  )
}

export const BookingPresetSelector: React.FC<Props> = ({ onBack, onSelect }) => {
  const { t } = useTranslation('common')

  const tabs: IconTabsItem[] = [
    {
      id: 'recent',
      name: t('bookings.presets.recent', { defaultValue: 'Recent bookings' }),
      component: <RecentBookingsList onSelect={onSelect} />,
      icon: Clock,
    },
    {
      id: 'favorites',
      name: t('bookings.presets.favorites', { defaultValue: 'Favorites' }),
      component: <FavoritesList onSelect={onSelect} />,
      icon: Star,
    },
    {
      id: 'team',
      name: t('bookings.presets.team', { defaultValue: 'Team bookings' }),
      component: <TeamBookingsList onSelect={onSelect} />,
      icon: Users,
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="border-base-content/10 border-b px-4 py-3">
        <Button variant="neutral" size="sm" onClick={onBack} className="w-full gap-2">
          <LucideIcon icon={ArrowLeft} size={16} />
          {t('common.back', { defaultValue: 'Back' })}
        </Button>
        <Heading variant="h6" className="mt-3 text-center">
          {t('bookings.presets.title', { defaultValue: 'Choose a preset' })}
        </Heading>
      </div>
      <div className="flex-1 overflow-hidden">
        <IconTabs tabs={tabs} />
      </div>
    </div>
  )
}
