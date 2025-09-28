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

import { BookingAddUpdateForm } from 'components/features/user/index/bookingAddUpdateForm'
import { BookingDuration } from 'components/features/user/index/bookingDuration'
import { BookingFromTo } from 'components/features/user/index/bookingFromTo'
import { BookingFromToMobile } from 'components/features/user/index/bookingFromToMobile'
import { BookingName } from 'components/features/user/index/bookingName'
import { BookingItemContext } from 'components/features/user/index/list/bookingItemContext'
import { Button } from 'components/primitives/buttons/Button'
import { TagList } from 'components/ui/data-display/TagList'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { cn } from 'lib/utils/cn'
import { useTranslation } from 'next-i18next'
import React from 'react'

type ItemType = ReturnType<typeof augmentBookingsList>[number]

type Props = {
  item: ItemType
}

export const BookingItem: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation()
  const editModal = useModal(`EditModal-${item.id}`)
  const addModal = useModal(`AddModal-${item.id}`)
  const addBetweenModal = useModal(`AddBetweenModal-${item.id}`)

  return (
    <div
      className={cn(
        'relative flex flex-row items-center justify-between gap-2 px-2 py-3 md:px-4',
        item.overlapsWithNext
          ? 'border-warning border-b-4 border-dotted'
          : 'border-base-content/20 border-b',
        item.isMostRecent && 'border-base-content/20 border-t',
      )}>
      <div className="flex flex-col gap-1">
        <BookingName item={item} />
        <TagList items={item.tags} />
      </div>
      <div className="flex h-full flex-shrink-0 flex-row items-center justify-start gap-3 md:gap-4">
        <div className="hidden h-full flex-row items-center justify-start gap-2 md:flex md:gap-4">
          <BookingFromTo item={item} />
          <BookingDuration item={item} />
        </div>
        <div className="flex h-full flex-col items-end justify-center gap-2 md:hidden">
          <BookingFromToMobile item={item} />
          <BookingDuration item={item} />
        </div>
        <BookingItemContext item={item} />
      </div>
      {item.overlapsWithNext && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center text-center">
          <div className="bg-base-100 text-warning absolute rounded-full p-1">
            <ToolTip
              toolTipContent={t('bookings.overlapsWarning', {
                defaultValue:
                  'These two bookings overlap. Click to edit the top one and adjust the time.',
              })}
              width="lg">
              <Button
                variant="icon"
                shape="circle"
                type="button"
                onClick={editModal.openModal}
                fullWidth={false}>
                <Icon name="alert-triangle" size={18} />
              </Button>
            </ToolTip>
          </div>
        </div>
      )}
      {item.isMostRecent && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center text-center">
          <div className="bg-base-100 absolute rounded-full p-1">
            <Button
              variant="icon"
              shape="circle"
              type="button"
              title={t('bookings.actions.add', { defaultValue: 'Add booking' })}
              onClick={addModal.openModal}
              fullWidth={false}>
              <Icon name="add-circle" size={18} />
            </Button>
          </div>
        </div>
      )}
      {item.allowInsert && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center text-center">
          <div className="bg-base-100 absolute rounded-full p-1">
            <ToolTip
              toolTipContent={t('bookings.gapInfo', {
                defaultValue:
                  'There is a gap between these two bookings. Click to add a booking in between.',
              })}
              width="lg">
              <Button
                variant="icon"
                shape="circle"
                type="button"
                title={t('bookings.actions.insert', { defaultValue: 'Insert booking' })}
                onClick={addBetweenModal.openModal}
                fullWidth={false}>
                <Icon name="expand-vertical-4" size={18} />
              </Button>
            </ToolTip>
          </div>
        </div>
      )}
      <ModalResponsive modalId={editModal.modalId}>
        <BookingAddUpdateForm
          mode="update"
          itemUpdate={item}
          onSave={editModal.closeModal}
          onCancel={editModal.closeModal}
        />
      </ModalResponsive>
      <ModalResponsive modalId={addModal.modalId}>
        <BookingAddUpdateForm
          mode="add"
          itemReference={item}
          onSave={addModal.closeModal}
          onCancel={addModal.closeModal}
        />
      </ModalResponsive>
      <ModalResponsive modalId={addBetweenModal.modalId}>
        <BookingAddUpdateForm
          mode="addBetween"
          itemReference={item}
          onSave={addBetweenModal.closeModal}
          onCancel={addBetweenModal.closeModal}
        />
      </ModalResponsive>
    </div>
  )
}
