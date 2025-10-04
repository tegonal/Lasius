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
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { useUpdateUserBooking } from 'lib/api/lasius/user-bookings/user-bookings'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ArrowDownToLine, ArrowUpDown, ArrowUpToLine, Plus } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

type ItemType = ReturnType<typeof augmentBookingsList>[number]

type Props = {
  currentItem: ItemType
  nextItem?: ModelsBooking
  onAddBetween: () => void
}

export const BookingInsertActions: React.FC<Props> = ({ currentItem, nextItem, onAddBetween }) => {
  const { t } = useTranslation('common')
  const [isHovered, setIsHovered] = useState(false)
  const { selectedOrganisationId } = useOrganisation()

  const updateCurrentBooking = useUpdateUserBooking(selectedOrganisationId, currentItem.id)
  const updateNextBooking = useUpdateUserBooking(selectedOrganisationId, nextItem?.id || '')

  const handleAdjustCurrentStart = async () => {
    if (!nextItem?.end?.dateTime || !selectedOrganisationId) return

    await updateCurrentBooking.trigger({
      projectId: currentItem.projectReference.id,
      tags: currentItem.tags,
      start: formatISOLocale(new Date(nextItem.end.dateTime)),
      end: currentItem.end?.dateTime ? formatISOLocale(new Date(currentItem.end.dateTime)) : '',
    })
  }

  const handleAdjustNextEnd = async () => {
    if (!nextItem || !currentItem.start?.dateTime || !selectedOrganisationId) return

    await updateNextBooking.trigger({
      projectId: nextItem.projectReference.id,
      tags: nextItem.tags,
      start: formatISOLocale(new Date(nextItem.start.dateTime)),
      end: formatISOLocale(new Date(currentItem.start.dateTime)),
    })
  }

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center text-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div
        className={`bg-base-100 absolute flex gap-1 rounded-full p-1 transition-all duration-200 ${isHovered ? 'z-20' : 'z-10'}`}>
        {isHovered ? (
          <>
            <Button
              variant="icon"
              shape="circle"
              type="button"
              onClick={handleAdjustNextEnd}
              fullWidth={false}
              size="sm"
              title={t('bookings.actions.adjustLowerEnd', {
                defaultValue: 'Extend lower booking end to upper booking start',
              })}
              aria-label={t('bookings.actions.adjustLowerEnd', {
                defaultValue: 'Extend lower booking end to upper booking start',
              })}>
              <LucideIcon icon={ArrowUpToLine} size={16} />
            </Button>

            <Button
              variant="icon"
              shape="circle"
              type="button"
              onClick={onAddBetween}
              fullWidth={false}
              size="sm"
              title={t('bookings.actions.insert', {
                defaultValue: 'Insert booking',
              })}
              aria-label={t('bookings.actions.insert', {
                defaultValue: 'Insert booking',
              })}>
              <LucideIcon icon={Plus} size={16} />
            </Button>

            <Button
              variant="icon"
              shape="circle"
              type="button"
              onClick={handleAdjustCurrentStart}
              fullWidth={false}
              size="sm"
              title={t('bookings.actions.adjustUpperStart', {
                defaultValue: 'Move upper booking start to lower booking end',
              })}
              aria-label={t('bookings.actions.adjustUpperStart', {
                defaultValue: 'Move upper booking start to lower booking end',
              })}>
              <LucideIcon icon={ArrowDownToLine} size={16} />
            </Button>
          </>
        ) : (
          <Button
            variant="icon"
            shape="circle"
            type="button"
            title={t('bookings.actions.insert', { defaultValue: 'Insert booking' })}
            onClick={onAddBetween}
            fullWidth={false}>
            <LucideIcon icon={ArrowUpDown} size={18} />
          </Button>
        )}
      </div>
    </div>
  )
}
