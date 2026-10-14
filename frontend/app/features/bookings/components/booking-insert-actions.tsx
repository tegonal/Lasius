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

import { ArrowDownToLine, ArrowUpDown, ArrowUpToLine, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useSelectedOrgId } from '~/features/bookings/hooks/use-home-loader-data'
import { getAdjustedBookingBody } from '~/features/bookings/lib/booking-adjust'
import { useDialogActions } from '~/hooks/use-dialog-actions'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { cn } from '~/lib/utils/cn'
import { type ModelsBooking } from '~/services/api/lasius'
import { useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type Properties = {
  currentItem: AugmentedBooking
  nextItem?: ModelsBooking
  onAddBetween: () => void
}

export const BookingInsertActions = ({ currentItem, nextItem, onAddBetween }: Properties) => {
  const { t } = useTranslation('common')
  const {
    collapse,
    dialogRef,
    handleMouseEnter,
    handleMouseLeave,
    handleToggle,
    isExpanded,
    showExpanded,
  } = useDialogActions()
  const selectedOrgId = useSelectedOrgId()

  const updateCurrentBooking = useUpdateUserBooking()
  const updateNextBooking = useUpdateUserBooking()

  const handleAdjustCurrentStart = () => {
    if (!nextItem?.end?.dateTime || !selectedOrgId) return

    updateCurrentBooking.submit({
      body: getAdjustedBookingBody(currentItem, { start: nextItem.end.dateTime }),
      bookingId: currentItem.id,
      orgId: selectedOrgId,
    })
  }

  const handleAdjustNextEnd = () => {
    if (!nextItem || !currentItem.start?.dateTime || !selectedOrgId) return

    updateNextBooking.submit({
      body: getAdjustedBookingBody(nextItem, { end: currentItem.start.dateTime }),
      bookingId: nextItem.id,
      orgId: selectedOrgId,
    })
    collapse()
  }

  const handleAddBetween = () => {
    onAddBetween()
    collapse()
  }

  const handleAdjustCurrentStartWithClose = () => {
    handleAdjustCurrentStart()
    collapse()
  }

  const actionButtons = (
    <>
      <Button
        aria-label={t(
          'bookings:actions.adjustLowerEnd',
          'Extend lower booking end to upper booking start',
        )}
        fullWidth={false}
        onClick={handleAdjustNextEnd}
        shape="circle"
        size="sm"
        title={t(
          'bookings:actions.adjustLowerEnd',
          'Extend lower booking end to upper booking start',
        )}
        type="button"
        variant="iconPrimaryHover">
        <LucideIcon icon={ArrowUpToLine} size={16} />
      </Button>

      <Button
        aria-label={t('bookings:actions.insert', 'Insert booking')}
        fullWidth={false}
        onClick={handleAddBetween}
        shape="circle"
        size="sm"
        title={t('bookings:actions.insert', 'Insert booking')}
        type="button"
        variant="iconPrimaryHover">
        <LucideIcon icon={Plus} size={16} />
      </Button>

      <Button
        aria-label={t(
          'bookings:actions.adjustUpperStart',
          'Move upper booking start to lower booking end',
        )}
        fullWidth={false}
        onClick={handleAdjustCurrentStartWithClose}
        shape="circle"
        size="sm"
        title={t(
          'bookings:actions.adjustUpperStart',
          'Move upper booking start to lower booking end',
        )}
        type="button"
        variant="iconPrimaryHover">
        <LucideIcon icon={ArrowDownToLine} size={16} />
      </Button>
    </>
  )

  return (
    <>
      {isExpanded && (
        <dialog
          className="absolute top-full left-1/2 m-0 -translate-x-1/2 -translate-y-1/2 transform bg-transparent p-0"
          ref={dialogRef}>
          <div className="bg-base-100 flex gap-1 rounded-full p-1">{actionButtons}</div>
        </dialog>
      )}

      {!isExpanded && (
        <div className="absolute inset-x-0 -bottom-3 z-10 flex items-center justify-center py-3 text-center">
          {/* The open control gets a fixed area. The expanded buttons are smaller than the icon, so an area that fits them loses the pointer. */}
          <div
            className={cn(
              'absolute flex items-center justify-center gap-1 rounded-full',
              showExpanded ? 'z-20 h-14 w-44' : 'z-10 p-3',
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}>
            {showExpanded ? (
              actionButtons
            ) : (
              <Button
                fullWidth={false}
                onClick={handleToggle}
                shape="circle"
                title={t('bookings:actions.insert', 'Insert booking')}
                type="button"
                variant="iconPrimaryHover">
                <LucideIcon icon={ArrowUpDown} size={18} />
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
