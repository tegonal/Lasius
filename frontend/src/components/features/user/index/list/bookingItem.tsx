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
import { BookingInsertActions } from 'components/features/user/index/list/bookingInsertActions'
import { BookingItemContext } from 'components/features/user/index/list/bookingItemContext'
import { BookingOverlapActions } from 'components/features/user/index/list/bookingOverlapActions'
import { Button } from 'components/primitives/buttons/Button'
import { TagList } from 'components/ui/data-display/TagList'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { augmentBookingsList } from 'lib/api/functions/augmentBookingsList'
import { ModelsBooking } from 'lib/api/lasius'
import { cn } from 'lib/utils/cn'
import { PlusCircleIcon } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

type ItemType = ReturnType<typeof augmentBookingsList>[number]

type Props = {
  item: ItemType
  nextItem?: ModelsBooking
}

export const BookingItem: React.FC<Props> = ({ item, nextItem }) => {
  const { t } = useTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAddBetweenOpen, setIsAddBetweenOpen] = useState(false)

  const handleEditClose = () => setIsEditOpen(false)
  const handleAddClose = () => setIsAddOpen(false)
  const handleAddBetweenClose = () => setIsAddBetweenOpen(false)

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
        <BookingOverlapActions
          currentItem={item}
          overlappingItem={item.overlapsWithNext}
          onEdit={() => setIsEditOpen(true)}
        />
      )}
      {item.isMostRecent && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center text-center">
          <div className="bg-base-100 absolute rounded-full p-1">
            <Button
              variant="icon"
              shape="circle"
              type="button"
              title={t('bookings.actions.add', { defaultValue: 'Add booking' })}
              onClick={() => setIsAddOpen(true)}
              fullWidth={false}>
              <LucideIcon icon={PlusCircleIcon} size={21} />
            </Button>
          </div>
        </div>
      )}
      {item.allowInsert && (
        <BookingInsertActions
          currentItem={item}
          nextItem={nextItem}
          onAddBetween={() => setIsAddBetweenOpen(true)}
        />
      )}
      <Modal open={isEditOpen} onClose={handleEditClose}>
        <BookingAddUpdateForm
          mode="update"
          itemUpdate={item}
          onSave={handleEditClose}
          onCancel={handleEditClose}
        />
      </Modal>
      <Modal open={isAddOpen} onClose={handleAddClose}>
        <BookingAddUpdateForm
          mode="add"
          itemReference={item}
          onSave={handleAddClose}
          onCancel={handleAddClose}
        />
      </Modal>
      <Modal open={isAddBetweenOpen} onClose={handleAddBetweenClose}>
        <BookingAddUpdateForm
          mode="addBetween"
          itemReference={item}
          onSave={handleAddBetweenClose}
          onCancel={handleAddBetweenClose}
        />
      </Modal>
    </div>
  )
}
