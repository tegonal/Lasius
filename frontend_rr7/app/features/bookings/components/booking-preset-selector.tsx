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

import { subDays } from 'date-fns'
import { ArrowLeft, Clock, Star, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { AvatarUser } from '~/components/ui/data-display/avatar/avatar-user'
import { TagList } from '~/components/ui/data-display/tag-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import {
  IconTabs,
  type IconTabsItem,
} from '~/components/ui/navigation/icon-tabs'
import { formatISOLocale } from '~/lib/utils/dates'
import { stringHash } from '~/lib/utils/string-hash'
import { useGetOrganisationBookingList } from '~/services/api/lasius-hooks/organisation-bookings/organisation-bookings'
import { useGetUserBookingListByOrganisation } from '~/services/api/lasius-hooks/user-bookings/user-bookings'
import { useGetFavoriteBookingList } from '~/services/api/lasius-hooks/user-favorites/user-favorites'
import { type ModelsBooking } from '~/services/api/lasius/modelsBooking'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'

type PresetSelection = {
  projectId: string
  projectName: string
  tags: ModelsTag[]
}

type Props = {
  onBack: () => void
  onSelect: (preset: PresetSelection) => void
  selectedOrgId: string
}

const EmptyState = () => {
  const { t } = useTranslation()
  return (
    <div className="text-base-content/50 flex items-center justify-center p-8 text-sm">
      {t('bookings:presets.empty', 'No bookings found')}
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

const deduplicateBookings = (items: ModelsBooking[], limit = 20) => {
  const seen = new Set<string>()
  const unique: ModelsBooking[] = []
  for (const booking of items) {
    const key = `${booking.projectReference.id}-${booking.tags
      .map((tag) => tag.id)
      .toSorted((a, b) => a.localeCompare(b))
      .join(',')}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(booking)
      if (unique.length >= limit) break
    }
  }
  return unique
}

const RecentBookingsList = ({
  onSelect,
  selectedOrgId,
}: {
  onSelect: (preset: PresetSelection) => void
  selectedOrgId: string
}) => {
  const { t } = useTranslation()
  const recentApi = useGetUserBookingListByOrganisation()
  const submitRef = useRef(recentApi.submit)
  submitRef.current = recentApi.submit

  useEffect(() => {
    if (selectedOrgId) {
      const now = new Date()
      submitRef.current({
        orgId: selectedOrgId,
        params: {
          from: formatISOLocale(subDays(now, 7)),
          to: formatISOLocale(now),
        },
      })
    }
  }, [selectedOrgId])

  const items = recentApi.data ?? []
  const unique = deduplicateBookings(items)

  if (unique.length === 0) return <EmptyState />

  return (
    <AnimatedList>
      {unique.map((item, index) => (
        <AnimatedItem index={index} key={stringHash(item)}>
          <PresetButton
            ariaLabel={t(
              'bookings:presets.selectRecent',
              'Select recent booking: {{projectName}}{{tags}}',
              {
                projectName:
                  item.projectReference.key || item.projectReference.id,
                tags:
                  item.tags.length > 0 ? ` with ${item.tags.length} tags` : '',
              },
            )}
            onClick={() =>
              onSelect({
                projectId: item.projectReference.id,
                projectName:
                  item.projectReference.key || item.projectReference.id,
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
  onSelect,
  selectedOrgId,
}: {
  onSelect: (preset: PresetSelection) => void
  selectedOrgId: string
}) => {
  const { t } = useTranslation()
  const favoritesApi = useGetFavoriteBookingList()
  const submitRef = useRef(favoritesApi.submit)
  submitRef.current = favoritesApi.submit

  useEffect(() => {
    if (selectedOrgId) {
      submitRef.current({ orgId: selectedOrgId })
    }
  }, [selectedOrgId])

  const items = favoritesApi.data?.favorites ?? []

  if (items.length === 0) return <EmptyState />

  return (
    <AnimatedList>
      {items.map((item, index) => (
        <AnimatedItem index={index} key={stringHash(item)}>
          <PresetButton
            ariaLabel={t(
              'bookings:presets.selectFavorite',
              'Select favorite: {{projectName}}{{tags}}',
              {
                projectName:
                  item.projectReference.key || item.projectReference.id,
                tags:
                  item.tags.length > 0 ? ` with ${item.tags.length} tags` : '',
              },
            )}
            onClick={() =>
              onSelect({
                projectId: item.projectReference.id,
                projectName:
                  item.projectReference.key || item.projectReference.id,
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
  onSelect,
  selectedOrgId,
}: {
  onSelect: (preset: PresetSelection) => void
  selectedOrgId: string
}) => {
  const { t } = useTranslation()
  const orgBookingsApi = useGetOrganisationBookingList()
  const submitRef = useRef(orgBookingsApi.submit)
  submitRef.current = orgBookingsApi.submit

  useEffect(() => {
    if (selectedOrgId) {
      const now = new Date()
      submitRef.current({
        orgId: selectedOrgId,
        params: {
          from: formatISOLocale(subDays(now, 7)),
          to: formatISOLocale(now),
        },
      })
    }
  }, [selectedOrgId])

  const items = orgBookingsApi.data ?? []
  const unique = deduplicateBookings(items)

  if (unique.length === 0) return <EmptyState />

  return (
    <AnimatedList>
      {unique.map((item, index) => (
        <AnimatedItem index={index} key={stringHash(item)}>
          <PresetButton
            ariaLabel={t(
              'bookings:presets.selectTeam',
              'Select team booking: {{projectName}}{{tags}}',
              {
                projectName:
                  item.projectReference.key || item.projectReference.id,
                tags:
                  item.tags.length > 0 ? ` with ${item.tags.length} tags` : '',
              },
            )}
            onClick={() =>
              onSelect({
                projectId: item.projectReference.id,
                projectName:
                  item.projectReference.key || item.projectReference.id,
                tags: item.tags,
              })
            }
          >
            <AvatarUser
              firstName={item.userReference?.key?.split(' ')[0] ?? '?'}
              lastName={item.userReference?.key?.split(' ')[1] ?? ''}
              size={32}
            />
            <BookingPresetItem item={item} />
          </PresetButton>
        </AnimatedItem>
      ))}
    </AnimatedList>
  )
}

export const BookingPresetSelector = ({
  onBack,
  onSelect,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState(0)

  const tabs: IconTabsItem[] = [
    {
      component: (
        <RecentBookingsList onSelect={onSelect} selectedOrgId={selectedOrgId} />
      ),
      icon: Clock,
      id: 'recent',
      name: t('bookings:presets.recent', 'Recent bookings'),
    },
    {
      component: (
        <FavoritesList onSelect={onSelect} selectedOrgId={selectedOrgId} />
      ),
      icon: Star,
      id: 'favorites',
      name: t('bookings:presets.favorites', 'Favorites'),
    },
    {
      component: (
        <TeamBookingsList onSelect={onSelect} selectedOrgId={selectedOrgId} />
      ),
      icon: Users,
      id: 'team',
      name: t('bookings:presets.team', 'Team bookings'),
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
          {t('back', 'Back')}
        </Button>
        <h6 className="mt-3 text-center text-base font-semibold">
          {t('bookings:presets.title', 'Choose a preset')}
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
