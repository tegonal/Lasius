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
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { CalendarClock, HelpCircleIcon } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useHelpStore } from 'stores/helpStore'

export const BookingListEmptyNever: React.FC = () => {
  const { t } = useTranslation('common')
  const plausible = usePlausible<LasiusPlausibleEvents>()
  const { toggleHelp } = useHelpStore()

  const handleHelpClick = () => {
    plausible('uiAction', {
      props: {
        name: 'helpButton',
      },
    })
    toggleHelp()
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-4">
      <div className="text-base-content/50 flex flex-col items-center justify-center gap-2 text-sm">
        <LucideIcon icon={CalendarClock} size={24} />
        <div>{t('bookings.emptyNever', { defaultValue: 'No bookings yet' })}</div>
      </div>
      <div className="text-base-content/50 flex flex-col items-center justify-center gap-3 text-center text-sm">
        <div className="max-w-xs">
          {t('bookings.emptyNeverHelp', {
            defaultValue: 'Get started by creating your first booking. Need guidance?',
          })}
        </div>
        <Button
          onClick={handleHelpClick}
          variant="ghost"
          size="sm"
          fullWidth={false}
          className="gap-2">
          <LucideIcon icon={HelpCircleIcon} size={16} />
          {t('common.actions.help', { defaultValue: 'Help' })}
        </Button>
      </div>
    </div>
  )
}
