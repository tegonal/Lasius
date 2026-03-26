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
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useSelectedOrgId } from '~/features/bookings/hooks/use-home-loader-data'
import { useDialogActions } from '~/hooks/use-dialog-actions'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { cn } from '~/lib/utils/cn'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'
import { useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type Props = {
  currentItem: AugmentedBooking
  nextItem?: ModelsBooking
  onAddBetween: () => void
}

export const BookingInsertActions = ({
  currentItem,
  nextItem,
  onAddBetween,
}: Props) => {
  const { t } = useTranslation('common')
  const {
    collapse,
    dialogRef,
    handleToggle,
    isExpanded,
    setIsHovered,
    showExpanded,
  } = useDialogActions()
  const hoverTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const selectedOrgId = useSelectedOrgId()

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsHovered(true)
  }, [setIsHovered])

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      collapse()
    }, 300)
  }, [collapse])

  const updateCurrentBooking = useUpdateUserBooking()
  const updateNextBooking = useUpdateUserBooking()

  const handleAdjustCurrentStart = () => {
    if (!nextItem?.end?.dateTime || !selectedOrgId) return

    updateCurrentBooking.submit({
      body: {
        end: currentItem.end?.dateTime
          ? formatISOLocale(new Date(currentItem.end.dateTime))
          : undefined,
        projectId: currentItem.projectReference?.id || '',
        start: formatISOLocale(new Date(nextItem.end.dateTime)),
        tags: currentItem.tags || [],
      },
      bookingId: currentItem.id,
      orgId: selectedOrgId,
    })
  }

  const handleAdjustNextEnd = () => {
    if (!nextItem || !currentItem.start?.dateTime || !selectedOrgId) return

    updateNextBooking.submit({
      body: {
        end: formatISOLocale(new Date(currentItem.start.dateTime)),
        projectId: nextItem.projectReference?.id || '',
        start: formatISOLocale(new Date(nextItem.start.dateTime)),
        tags: nextItem.tags || [],
      },
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

  return (
    <>
      {isExpanded && (
        <dialog
          className="absolute top-full left-1/2 m-0 -translate-x-1/2 -translate-y-1/2 transform bg-transparent p-0"
          ref={dialogRef}
        >
          <div className="bg-base-100 flex gap-1 rounded-full p-1">
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
              variant="iconPrimaryHover"
            >
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
              variant="iconPrimaryHover"
            >
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
              variant="iconPrimaryHover"
            >
              <LucideIcon icon={ArrowDownToLine} size={16} />
            </Button>
          </div>
        </dialog>
      )}

      {!isExpanded && (
        <div className="absolute inset-x-0 -bottom-3 z-10 flex items-center justify-center py-3 text-center">
          <div
            className={cn(
              'absolute flex gap-1 rounded-full p-3 transition-all duration-200',
              showExpanded ? 'z-20' : 'z-10',
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {showExpanded ? (
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
                  variant="iconPrimaryHover"
                >
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
                  variant="iconPrimaryHover"
                >
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
                  variant="iconPrimaryHover"
                >
                  <LucideIcon icon={ArrowDownToLine} size={16} />
                </Button>
              </>
            ) : (
              <Button
                fullWidth={false}
                onClick={handleToggle}
                shape="circle"
                title={t('bookings:actions.insert', 'Insert booking')}
                type="button"
                variant="iconPrimaryHover"
              >
                <LucideIcon icon={ArrowUpDown} size={18} />
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
