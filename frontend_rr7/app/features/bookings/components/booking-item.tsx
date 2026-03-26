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

import { PlusCircleIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { TagList } from '~/components/ui/data-display/tag-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Modal } from '~/components/ui/overlays/modal/modal'
import { useSelectedOrgId } from '~/features/bookings/hooks/use-home-loader-data'
import { type AugmentedBooking } from '~/lib/api/functions/augment-bookings-list'
import { cn } from '~/lib/utils/cn'
import { type ModelsBooking } from '~/services/api/lasius'

import { BookingAddUpdateForm } from './booking-add-update-form'
import { BookingDuration } from './booking-duration'
import { BookingFromTo } from './booking-from-to'
import { BookingInsertActions } from './booking-insert-actions'
import { BookingItemContext } from './booking-item-context'
import { BookingName } from './booking-name'
import { BookingOverlapActions } from './booking-overlap-actions'

type Props = {
  item: AugmentedBooking
  nextItem?: ModelsBooking
}

export const BookingItem = ({ item, nextItem }: Props) => {
  const { t } = useTranslation('common')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAddBetweenOpen, setIsAddBetweenOpen] = useState(false)
  const selectedOrgId = useSelectedOrgId()

  const handleEditClose = () => setIsEditOpen(false)
  const handleAddClose = () => setIsAddOpen(false)
  const handleAddBetweenClose = () => setIsAddBetweenOpen(false)

  return (
    <div
      className={cn(
        'relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 py-3 md:gap-4 md:px-4',
        item.overlapsWithNext
          ? 'border-warning border-b-4 border-dotted'
          : 'border-base-content/20 border-b',
        item.isMostRecent && 'border-base-content/20 border-t',
      )}
      data-testid="booking-item"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        <BookingName item={item} />
        <TagList items={item.tags} />
      </div>
      <div className="flex h-full flex-row items-center justify-start gap-3 md:gap-4">
        <div className="hidden h-full flex-row items-center justify-start gap-2 md:flex md:gap-4">
          <BookingFromTo item={item} />
          <BookingDuration item={item} />
        </div>
        <div className="flex h-full flex-col items-end justify-center gap-2 md:hidden">
          <BookingFromTo item={item} orientation="horizontal" />
          <BookingDuration item={item} />
        </div>
        <BookingItemContext item={item} />
      </div>
      {item.overlapsWithNext && (
        <BookingOverlapActions
          currentItem={item}
          onEdit={() => setIsEditOpen(true)}
          overlappingItem={item.overlapsWithNext}
        />
      )}
      {item.isMostRecent && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center text-center">
          <div className="bg-base-100 absolute rounded-full p-1">
            <Button
              data-testid="booking-add-btn"
              fullWidth={false}
              onClick={() => setIsAddOpen(true)}
              shape="circle"
              title={t('bookings:actions.add', 'Add booking')}
              type="button"
              variant="iconPrimaryHover"
            >
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
      <Modal onClose={handleEditClose} open={isEditOpen}>
        <BookingAddUpdateForm
          itemUpdate={item}
          mode="update"
          onClose={handleEditClose}
          selectedOrgId={selectedOrgId}
        />
      </Modal>
      <Modal onClose={handleAddClose} open={isAddOpen}>
        <BookingAddUpdateForm
          itemReference={item}
          mode="add"
          onClose={handleAddClose}
          selectedOrgId={selectedOrgId}
        />
      </Modal>
      <Modal onClose={handleAddBetweenClose} open={isAddBetweenOpen}>
        <BookingAddUpdateForm
          itemReference={item}
          mode="addBetween"
          onClose={handleAddBetweenClose}
          selectedOrgId={selectedOrgId}
        />
      </Modal>
    </div>
  )
}
