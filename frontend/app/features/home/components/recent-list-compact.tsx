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

import { History } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateList } from '~/components/ui/animations/animate-list'
import { EmptyState } from '~/components/ui/data-display/empty-state'
import { BookingName } from '~/features/bookings/components/booking-name'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { TagList } from '~/features/tags/components/tag-list'
import { stringHash } from '~/lib/utils/string-hash'
import { type ModelsBooking } from '~/services/api/lasius'

import { RecentItemContext } from './recent-item-context'

type Properties = {
  recentBookings: ModelsBooking[]
  selectedOrgId: string
}

export const RecentListCompact = ({ recentBookings, selectedOrgId }: Properties) => {
  const { t } = useTranslation('home')

  return (
    <ContextMenuProvider>
      <div className="flex w-full flex-col px-3 select-none">
        {recentBookings.length === 0 ? (
          <EmptyState icon={History} label={t('recent.empty', 'No bookings in the last 7 days')} />
        ) : (
          <AnimateList>
            {recentBookings.map((item) => (
              <div
                className="border-base-content/20 flex flex-row items-center justify-between gap-2 border-b px-2 py-2"
                data-testid="recent-item"
                key={stringHash(item)}>
                <div className="flex flex-col">
                  <BookingName item={item} />
                  <TagList items={item.tags} width="sm" />
                </div>
                <div className="flex-shrink-0">
                  <RecentItemContext item={item} selectedOrgId={selectedOrgId} />
                </div>
              </div>
            ))}
          </AnimateList>
        )}
      </div>
    </ContextMenuProvider>
  )
}
