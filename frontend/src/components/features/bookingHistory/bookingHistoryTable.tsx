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

import { BookingHistoryItemContext } from 'components/features/bookingHistory/bookingHistoryItemContext'
import { Text } from 'components/primitives/typography/Text'
import { DataList } from 'components/ui/data-display/dataList/dataList'
import { DataListField } from 'components/ui/data-display/dataList/dataListField'
import { DataListHeaderItem } from 'components/ui/data-display/dataList/dataListHeaderItem'
import { DataListRow } from 'components/ui/data-display/dataList/dataListRow'
import { EmptyStateBookingHistory } from 'components/ui/data-display/fetchState/emptyStateBookingHistory'
import { TagList } from 'components/ui/data-display/TagList'
import { sortExtendedBookingsByDate } from 'lib/api/functions/sortBookingsByDate'
import { ModelsBooking } from 'lib/api/lasius'
import { useTranslation } from 'next-i18next'
import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { ExtendedHistoryBooking } from 'types/booking'
import { ModelsTags } from 'types/common'

type Props = {
  items: ExtendedHistoryBooking[]
  allowEdit?: boolean
  allowDelete?: boolean
  showUserColumn?: boolean
}

export const BookingHistoryTable: React.FC<Props> = ({
  items,
  allowDelete,
  allowEdit,
  showUserColumn,
}) => {
  const { t } = useTranslation('common')
  const formContext = useFormContext()

  const tagClickHandler = (tag: ModelsTags) => {
    if (tag) {
      const tags = formContext.getValues('tags')
      formContext.setValue('tags', [...tags, tag])
    }
  }

  const projectIdClickHandler = (booking: ModelsBooking) => {
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
          <DataListHeaderItem>{t('common.user', { defaultValue: 'User' })}</DataListHeaderItem>
        )}
        <DataListHeaderItem>
          {t('projects.project', { defaultValue: 'Project' })}
        </DataListHeaderItem>
        <DataListHeaderItem>{t('tags.title', { defaultValue: 'Tags' })}</DataListHeaderItem>
        <DataListHeaderItem>{t('common.date', { defaultValue: 'Date' })}</DataListHeaderItem>
        <DataListHeaderItem>
          {t('bookings.duration', { defaultValue: 'Duration' })}
        </DataListHeaderItem>
        <DataListHeaderItem />
      </DataListRow>
      {sortedList.map((booking) => (
        <DataListRow key={booking.id}>
          {showUserColumn && (
            <DataListField className="whitespace-nowrap">
              <button
                type="button"
                className="hover:text-accent font-inherit cursor-pointer border-none bg-transparent p-0 text-inherit"
                data-value={booking.userReference.key}
                onClick={() => userIdClickHandler(booking)}
                aria-label={t('bookings.actions.filterByUser', {
                  defaultValue: 'Filter by user {{userKey}}',
                  userKey: booking.userReference.key,
                })}>
                {booking.userReference.key}
              </button>
            </DataListField>
          )}
          <DataListField>
            <button
              type="button"
              className="hover:text-accent font-inherit cursor-pointer border-none bg-transparent p-0 text-inherit"
              data-value={booking.projectReference.key}
              onClick={() => projectIdClickHandler(booking)}
              aria-label={t('bookings.actions.filterByProject', {
                defaultValue: 'Filter by project {{projectKey}}',
                projectKey: booking.projectReference.key,
              })}>
              {booking.projectReference.key}
            </button>
          </DataListField>
          <DataListField className="max-w-md">
            <TagList
              items={booking.tags}
              clickHandler={tagClickHandler}
              hideRemoveIcon
              width="sm"
            />
          </DataListField>
          <DataListField className="whitespace-nowrap">
            <Text variant="small">{booking.fromTo}</Text>{' '}
            <Text variant="small">{booking.date}</Text>
          </DataListField>
          <DataListField className="whitespace-nowrap">{booking.durationString}</DataListField>
          <DataListField>
            <BookingHistoryItemContext
              item={booking}
              allowDelete={allowDelete}
              allowEdit={allowEdit}
            />
          </DataListField>
        </DataListRow>
      ))}
    </DataList>
  )
}
