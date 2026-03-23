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
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useSelectedOrgId } from '~/features/bookings/hooks/use-home-loader-data'
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
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const hoverTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const selectedOrgId = useSelectedOrgId()

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
      setIsExpanded(false)
    }, 300)
  }, [])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const updateCurrentBooking = useUpdateUserBooking()
  const updateNextBooking = useUpdateUserBooking()

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

    // Use a slight delay to avoid closing immediately after opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

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
    setIsExpanded(false)
  }

  const handleAddBetween = () => {
    onAddBetween()
    setIsExpanded(false)
  }

  const handleAdjustCurrentStartWithClose = () => {
    handleAdjustCurrentStart()
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
              aria-label={t('bookings.actions.adjustLowerEnd', {
                defaultValue: 'Extend lower booking end to upper booking start',
              })}
              fullWidth={false}
              onClick={handleAdjustNextEnd}
              shape="circle"
              size="sm"
              title={t('bookings.actions.adjustLowerEnd', {
                defaultValue: 'Extend lower booking end to upper booking start',
              })}
              type="button"
              variant="iconPrimaryHover"
            >
              <LucideIcon icon={ArrowUpToLine} size={16} />
            </Button>

            <Button
              aria-label={t('bookings.actions.insert', {
                defaultValue: 'Insert booking',
              })}
              fullWidth={false}
              onClick={handleAddBetween}
              shape="circle"
              size="sm"
              title={t('bookings.actions.insert', {
                defaultValue: 'Insert booking',
              })}
              type="button"
              variant="iconPrimaryHover"
            >
              <LucideIcon icon={Plus} size={16} />
            </Button>

            <Button
              aria-label={t('bookings.actions.adjustUpperStart', {
                defaultValue: 'Move upper booking start to lower booking end',
              })}
              fullWidth={false}
              onClick={handleAdjustCurrentStartWithClose}
              shape="circle"
              size="sm"
              title={t('bookings.actions.adjustUpperStart', {
                defaultValue: 'Move upper booking start to lower booking end',
              })}
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
                  aria-label={t('bookings.actions.adjustLowerEnd', {
                    defaultValue:
                      'Extend lower booking end to upper booking start',
                  })}
                  fullWidth={false}
                  onClick={handleAdjustNextEnd}
                  shape="circle"
                  size="sm"
                  title={t('bookings.actions.adjustLowerEnd', {
                    defaultValue:
                      'Extend lower booking end to upper booking start',
                  })}
                  type="button"
                  variant="iconPrimaryHover"
                >
                  <LucideIcon icon={ArrowUpToLine} size={16} />
                </Button>

                <Button
                  aria-label={t('bookings.actions.insert', {
                    defaultValue: 'Insert booking',
                  })}
                  fullWidth={false}
                  onClick={handleAddBetween}
                  shape="circle"
                  size="sm"
                  title={t('bookings.actions.insert', {
                    defaultValue: 'Insert booking',
                  })}
                  type="button"
                  variant="iconPrimaryHover"
                >
                  <LucideIcon icon={Plus} size={16} />
                </Button>

                <Button
                  aria-label={t('bookings.actions.adjustUpperStart', {
                    defaultValue:
                      'Move upper booking start to lower booking end',
                  })}
                  fullWidth={false}
                  onClick={handleAdjustCurrentStartWithClose}
                  shape="circle"
                  size="sm"
                  title={t('bookings.actions.adjustUpperStart', {
                    defaultValue:
                      'Move upper booking start to lower booking end',
                  })}
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
                title={t('bookings.actions.insert', {
                  defaultValue: 'Insert booking',
                })}
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
