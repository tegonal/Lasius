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
import { Heading } from 'components/primitives/typography/Heading'
import { FormElement } from 'components/ui/forms/FormElement'
import { exportBookingListToCsv } from 'lib/utils/data/csv'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { ExtendedHistoryBooking } from 'types/booking'

type Props = {
  bookings: ExtendedHistoryBooking[]
}
export const BookingHistoryExport: React.FC<Props> = ({ bookings }) => {
  const { t } = useTranslation('common')

  const exportCurrentList = () => {
    exportBookingListToCsv(bookings)
  }

  return (
    <div className="w-full">
      <Heading variant="section">{t('export.dataTitle', { defaultValue: 'Export data' })}</Heading>
      <FormElement>
        <Button
          type="button"
          disabled={bookings.length < 1}
          onClick={() => exportCurrentList()}
          variant="secondary">
          {t('export.actions.export', { defaultValue: 'Export' })}
        </Button>
      </FormElement>
    </div>
  )
}
