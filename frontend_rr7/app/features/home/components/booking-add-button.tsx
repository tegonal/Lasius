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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Modal } from '~/components/ui/overlays/modal'
import { BookingAddUpdateForm } from '~/features/bookings/components/booking-add-update-form'

type Props = {
  selectedOrgId: string
}

export const BookingAddButton = ({ selectedOrgId }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')

  const handleClose = () => setIsOpen(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary">
        {t('bookings.actions.create', {
          defaultValue: 'Create a booking',
        })}
      </Button>
      <Modal onClose={handleClose} open={isOpen}>
        <BookingAddUpdateForm
          mode="add"
          onClose={handleClose}
          selectedOrgId={selectedOrgId}
        />
      </Modal>
    </>
  )
}
