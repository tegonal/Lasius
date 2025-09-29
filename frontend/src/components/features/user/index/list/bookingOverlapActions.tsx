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
import { Icon } from 'components/ui/icons/Icon'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking } from 'lib/api/lasius'
import { useUpdateUserBooking } from 'lib/api/lasius/user-bookings/user-bookings'
import { formatISOLocale } from 'lib/utils/date/dates'
import { ArrowDownToLine, ArrowUpToLine, Edit2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

type ItemType = ReturnType<typeof augmentBookingsList>[number]

type Props = {
  currentItem: ItemType
  overlappingItem: ModelsBooking
  onEdit: () => void
}

export const BookingOverlapActions: React.FC<Props> = ({
  currentItem,
  overlappingItem,
  onEdit,
}) => {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const { selectedOrganisationId } = useOrganisation()

  // Create hook instances for updating each booking
  const updateCurrentBooking = useUpdateUserBooking(selectedOrganisationId, currentItem.id)
  const updateOverlappingBooking = useUpdateUserBooking(selectedOrganisationId, overlappingItem.id)

  // Adjust the current booking to start where the overlapping booking ends
  const handleAdjustCurrentToOverlappingEnd = async () => {
    if (!overlappingItem.end?.dateTime || !selectedOrganisationId) return

    await updateCurrentBooking.trigger({
      projectId: currentItem.projectReference.id,
      tags: currentItem.tags,
      start: formatISOLocale(new Date(overlappingItem.end.dateTime)),
      end: currentItem.end?.dateTime ? formatISOLocale(new Date(currentItem.end.dateTime)) : '',
    })
  }

  // Adjust the overlapping booking to end where the current booking starts
  const handleAdjustOverlappingToCurrentStart = async () => {
    if (!currentItem.start?.dateTime || !selectedOrganisationId) return

    await updateOverlappingBooking.trigger({
      projectId: overlappingItem.projectReference.id,
      tags: overlappingItem.tags,
      start: formatISOLocale(new Date(overlappingItem.start.dateTime)),
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
              onClick={handleAdjustOverlappingToCurrentStart}
              fullWidth={false}
              size="sm"
              title={t('bookings.actions.adjustOverlappingEnd', {
                defaultValue: 'Adjust overlapping booking to end at current booking start',
              })}
              aria-label={t('bookings.actions.adjustOverlappingEnd', {
                defaultValue: 'Adjust overlapping booking to end at current booking start',
              })}>
              <LucideIcon icon={ArrowUpToLine} size={16} className="text-warning" />
            </Button>

            <Button
              variant="icon"
              shape="circle"
              type="button"
              onClick={onEdit}
              fullWidth={false}
              size="sm"
              title={t('bookings.actions.editOverlapping', {
                defaultValue: 'Edit booking to resolve overlap',
              })}
              aria-label={t('bookings.actions.editOverlapping', {
                defaultValue: 'Edit booking to resolve overlap',
              })}>
              <LucideIcon icon={Edit2} size={16} className="text-warning" />
            </Button>

            <Button
              variant="icon"
              shape="circle"
              type="button"
              onClick={handleAdjustCurrentToOverlappingEnd}
              fullWidth={false}
              size="sm"
              title={t('bookings.actions.adjustCurrentStart', {
                defaultValue: 'Adjust current booking to start at overlapping booking end',
              })}
              aria-label={t('bookings.actions.adjustCurrentStart', {
                defaultValue: 'Adjust current booking to start at overlapping booking end',
              })}>
              <LucideIcon icon={ArrowDownToLine} size={16} className="text-warning" />
            </Button>
          </>
        ) : (
          <Button
            variant="icon"
            shape="circle"
            type="button"
            title={t('bookings.overlapsWarning', {
              defaultValue: 'These two bookings overlap. Hover to see adjustment options.',
            })}
            onClick={onEdit}
            fullWidth={false}>
            <Icon name="alert-triangle" size={18} />
          </Button>
        )}
      </div>
    </div>
  )
}
