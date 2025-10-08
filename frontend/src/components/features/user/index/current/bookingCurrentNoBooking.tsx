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

import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Clock } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { ROUTES } from 'projectConfig/routes'
import React from 'react'

export const BookingCurrentNoBooking: React.FC = () => {
  const { t } = useTranslation('common')
  const { pathname = '', push } = useRouter()

  if (pathname !== ROUTES.USER.INDEX && pathname !== '/') {
    return (
      <div
        onClick={() => push('/')}
        className="flex h-full w-full cursor-pointer flex-row items-center justify-center gap-3 hover:opacity-80">
        <div>
          <LucideIcon icon={Clock} size={24} />
        </div>
        <div>
          {t('bookings.status.currentlyNotBooking', { defaultValue: 'Currently not booking' })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-row items-center justify-center gap-3">
      <div>
        <LucideIcon icon={Clock} size={24} />
      </div>
      <div>
        {t('bookings.status.currentlyNotBooking', { defaultValue: 'Currently not booking' })}
      </div>
    </div>
  )
}
