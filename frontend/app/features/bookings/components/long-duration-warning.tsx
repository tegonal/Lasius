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

import { HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export const LongDurationWarning = () => {
  const { t } = useTranslation('common')
  return (
    <div className="alert alert-warning mb-4" role="alert">
      <LucideIcon icon={HelpCircle} size={20} />
      <div className="flex flex-col gap-1">
        <div className="font-semibold">
          {t('bookings:warnings.longDuration', 'Long duration detected')}
        </div>
        <div className="text-sm">
          {t(
            'bookings:warnings.longDurationDescription',
            'This booking is longer than a typical 8-hour work day. Please verify that the start and end times are correct.',
          )}
        </div>
      </div>
    </div>
  )
}
