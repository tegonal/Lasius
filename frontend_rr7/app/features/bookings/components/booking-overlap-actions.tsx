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

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Edit2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useSelectedOrgId } from '~/features/bookings/hooks/use-home-loader-data'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { formatISOLocale } from '~/lib/utils/dates'
import { type ModelsBooking } from '~/services/api/lasius'
import { useUpdateUserBooking } from '~/services/api/lasius-hooks/user-bookings/user-bookings'

type Props = {
  currentItem: AugmentedBooking
  onEdit: () => void
  overlappingItem: ModelsBooking
}

export const BookingOverlapActions = ({
  currentItem,
  onEdit,
  overlappingItem,
}: Props) => {
  const { t } = useTranslation('common')
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectedOrgId = useSelectedOrgId()

  const updateCurrentBooking = useUpdateUserBooking()
  const updateOverlappingBooking = useUpdateUserBooking()

  // Open/close dialog when isExpanded changes
  useEffect(() => {
    if (isExpanded && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.show()
    } else if (!isExpanded && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [isExpanded])

  // Handle dialog close event (triggered by ESC key)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      setIsExpanded(false)
      setIsHovered(false)
    }

    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
    }
  }, [])

  // Handle click outside to close
  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false)
        setIsHovered(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  const handleAdjustCurrentToOverlappingEnd = () => {
    if (!overlappingItem.end?.dateTime || !selectedOrgId) return

    updateCurrentBooking.submit({
      body: {
        end: currentItem.end?.dateTime
          ? formatISOLocale(new Date(currentItem.end.dateTime))
          : undefined,
        projectId: currentItem.projectReference?.id || '',
        start: formatISOLocale(new Date(overlappingItem.end.dateTime)),
        tags: currentItem.tags || [],
      },
      bookingId: currentItem.id,
      orgId: selectedOrgId,
    })
    setIsExpanded(false)
  }

  const handleAdjustOverlappingToCurrentStart = () => {
    if (!currentItem.start?.dateTime || !selectedOrgId) return

    updateOverlappingBooking.submit({
      body: {
        end: formatISOLocale(new Date(currentItem.start.dateTime)),
        projectId: overlappingItem.projectReference?.id || '',
        start: formatISOLocale(new Date(overlappingItem.start.dateTime)),
        tags: overlappingItem.tags || [],
      },
      bookingId: overlappingItem.id,
      orgId: selectedOrgId,
    })
    setIsExpanded(false)
  }

  const handleEdit = () => {
    onEdit()
    setIsExpanded(false)
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const showExpanded = isHovered || isExpanded

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
                'bookings:actions.adjustOverlappingEnd',
                'Adjust overlapping booking to end at current booking start',
              )}
              fullWidth={false}
              onClick={handleAdjustOverlappingToCurrentStart}
              shape="circle"
              size="sm"
              title={t(
                'bookings:actions.adjustOverlappingEnd',
                'Adjust overlapping booking to end at current booking start',
              )}
              type="button"
              variant="icon"
            >
              <LucideIcon
                className="text-warning"
                icon={ArrowUpToLine}
                size={16}
              />
            </Button>

            <Button
              aria-label={t(
                'bookings:actions.editOverlapping',
                'Edit booking to resolve overlap',
              )}
              fullWidth={false}
              onClick={handleEdit}
              shape="circle"
              size="sm"
              title={t(
                'bookings:actions.editOverlapping',
                'Edit booking to resolve overlap',
              )}
              type="button"
              variant="icon"
            >
              <LucideIcon className="text-warning" icon={Edit2} size={16} />
            </Button>

            <Button
              aria-label={t(
                'bookings:actions.adjustCurrentStart',
                'Adjust current booking to start at overlapping booking end',
              )}
              fullWidth={false}
              onClick={handleAdjustCurrentToOverlappingEnd}
              shape="circle"
              size="sm"
              title={t(
                'bookings:actions.adjustCurrentStart',
                'Adjust current booking to start at overlapping booking end',
              )}
              type="button"
              variant="icon"
            >
              <LucideIcon
                className="text-warning"
                icon={ArrowDownToLine}
                size={16}
              />
            </Button>
          </div>
        </dialog>
      )}

      {!isExpanded && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false)
            setIsExpanded(false)
          }}
        >
          <div
            className={`bg-base-100 absolute flex gap-1 rounded-full p-1 transition-all duration-200 ${showExpanded ? 'z-20' : 'z-10'}`}
          >
            {showExpanded ? (
              <>
                <Button
                  aria-label={t(
                    'bookings:actions.adjustOverlappingEnd',
                    'Adjust overlapping booking to end at current booking start',
                  )}
                  fullWidth={false}
                  onClick={handleAdjustOverlappingToCurrentStart}
                  shape="circle"
                  size="sm"
                  title={t(
                    'bookings:actions.adjustOverlappingEnd',
                    'Adjust overlapping booking to end at current booking start',
                  )}
                  type="button"
                  variant="icon"
                >
                  <LucideIcon
                    className="text-warning"
                    icon={ArrowUpToLine}
                    size={16}
                  />
                </Button>

                <Button
                  aria-label={t(
                    'bookings:actions.editOverlapping',
                    'Edit booking to resolve overlap',
                  )}
                  fullWidth={false}
                  onClick={handleEdit}
                  shape="circle"
                  size="sm"
                  title={t(
                    'bookings:actions.editOverlapping',
                    'Edit booking to resolve overlap',
                  )}
                  type="button"
                  variant="icon"
                >
                  <LucideIcon className="text-warning" icon={Edit2} size={16} />
                </Button>

                <Button
                  aria-label={t(
                    'bookings:actions.adjustCurrentStart',
                    'Adjust current booking to start at overlapping booking end',
                  )}
                  fullWidth={false}
                  onClick={handleAdjustCurrentToOverlappingEnd}
                  shape="circle"
                  size="sm"
                  title={t(
                    'bookings:actions.adjustCurrentStart',
                    'Adjust current booking to start at overlapping booking end',
                  )}
                  type="button"
                  variant="icon"
                >
                  <LucideIcon
                    className="text-warning"
                    icon={ArrowDownToLine}
                    size={16}
                  />
                </Button>
              </>
            ) : (
              <Button
                fullWidth={false}
                onClick={handleToggle}
                shape="circle"
                title={t(
                  'bookings:overlapsWarning',
                  'These two bookings overlap. Tap to see adjustment options.',
                )}
                type="button"
                variant="icon"
              >
                <LucideIcon icon={AlertTriangle} size={18} />
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
