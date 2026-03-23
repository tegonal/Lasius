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

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { DataList } from '~/components/ui/data-display/data-list/data-list'
import { DataListField } from '~/components/ui/data-display/data-list/data-list-field'
import { DataListHeaderItem } from '~/components/ui/data-display/data-list/data-list-header-item'
import { DataListRow } from '~/components/ui/data-display/data-list/data-list-row'
import { TagList } from '~/components/ui/data-display/tag-list'
import { sortExtendedBookingsByDate } from '~/lib/api/functions/sort-bookings-by-date'
import { type ModelsBooking, type ModelsTag } from '~/services/api/lasius'
import { type ExtendedHistoryBooking } from '~/types/booking'

import { BookingHistoryItemContext } from './booking-history-item-context'
import { EmptyStateBookingHistory } from './empty-state-booking-history'

type Props = {
  allowDelete?: boolean
  allowEdit?: boolean
  items: ExtendedHistoryBooking[]
  showUserColumn?: boolean
}

export const BookingHistoryTable = ({
  allowDelete = false,
  allowEdit = false,
  items,
  showUserColumn = false,
}: Props) => {
  const { t } = useTranslation('common')
  const formContext = useFormContext()

  const tagClickHandler = (tag: ModelsTag) => {
    if (tag) {
      const tags = formContext.getValues('tags')
      formContext.setValue('tags', [...tags, tag])
    }
  }

  const projectClickHandler = (booking: ModelsBooking) => {
    const {
      projectReference: { id },
    } = booking
    if (id) {
      formContext.setValue('projectId', id)
    }
  }

  const userIdClickHandler = (booking: ModelsBooking) => {
    const {
      userReference: { id },
    } = booking
    if (id) {
      formContext.setValue('userId', id)
    }
  }

  const sortedList = useMemo(() => sortExtendedBookingsByDate(items), [items])

  if (sortedList.length < 1) return <EmptyStateBookingHistory />

  return (
    <DataList>
      <DataListRow>
        {showUserColumn && (
          <DataListHeaderItem>{t('user', 'User')}</DataListHeaderItem>
        )}
        <DataListHeaderItem>
          {t('projects:project', 'Project')}
        </DataListHeaderItem>
        <DataListHeaderItem>
          {t('tag-manager:title', 'Tags')}
        </DataListHeaderItem>
        <DataListHeaderItem>{t('date', 'Date')}</DataListHeaderItem>
        <DataListHeaderItem>
          {t('bookings:duration', 'Duration')}
        </DataListHeaderItem>
        <DataListHeaderItem />
      </DataListRow>
      {sortedList.map((booking) => (
        <DataListRow key={booking.id}>
          {showUserColumn && (
            <DataListField className="whitespace-nowrap">
              <button
                aria-label={t(
                  'bookings:actions.filterByUser',
                  'Filter by user {{userKey}}',
                  {
                    userKey: booking.userReference.key,
                  },
                )}
                className="hover:text-accent font-inherit cursor-pointer border-none bg-transparent p-0 text-inherit"
                data-value={booking.userReference.key}
                onClick={() => userIdClickHandler(booking)}
                type="button"
              >
                {booking.userReference.key}
              </button>
            </DataListField>
          )}
          <DataListField>
            <button
              aria-label={t(
                'bookings:actions.filterByProject',
                'Filter by project {{projectKey}}',
                {
                  projectKey: booking.projectReference.key,
                },
              )}
              className="hover:text-accent font-inherit cursor-pointer border-none bg-transparent p-0 text-inherit"
              data-value={booking.projectReference.key}
              onClick={() => projectClickHandler(booking)}
              type="button"
            >
              {booking.projectReference.key}
            </button>
          </DataListField>
          <DataListField className="max-w-md">
            <TagList
              clickHandler={tagClickHandler}
              hideRemoveIcon
              items={booking.tags}
              width="sm"
            />
          </DataListField>
          <DataListField className="whitespace-nowrap">
            <span className="text-sm">{booking.fromTo}</span>{' '}
            <span className="text-sm">{booking.date}</span>
          </DataListField>
          <DataListField className="whitespace-nowrap">
            {booking.durationString}
          </DataListField>
          <DataListField>
            <BookingHistoryItemContext
              allowDelete={allowDelete}
              allowEdit={allowEdit}
              item={booking}
            />
          </DataListField>
        </DataListRow>
      ))}
    </DataList>
  )
}
