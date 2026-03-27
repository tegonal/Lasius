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

import { CalendarClock, Square, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export const SlideBooking = () => {
  const { t } = useTranslation('onboarding')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <LucideIcon className="text-primary" icon={CalendarClock} size={48} />
        </div>
        <h2 className="text-xl font-bold">
          {t('booking.title', 'Start Tracking Time')}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t(
            'booking.subtitle',
            "You're all set! Here's how to create your first booking.",
          )}
        </p>
      </div>

      <div className="bg-base-100 max-w-md space-y-4 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">
            1
          </div>
          <div>
            <div className="font-semibold">
              {t('booking.step1', 'Use the Booking Form')}
            </div>
            <p className="text-base-content/60">
              {t(
                'booking.step1Desc',
                'Find the booking form in the right column and select a project.',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">
            2
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold">
                {t('booking.step2', 'Or Use Context Menu')}
              </div>
              <LucideIcon
                className="text-base-content/50"
                icon={Timer}
                size={14}
              />
            </div>
            <p className="text-base-content/60">
              {t(
                'booking.step2Desc',
                'Right-click any booking, favorite, or team booking and choose the stopwatch icon.',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">
            3
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold">
                {t('booking.step3', 'Stop When Done')}
              </div>
              <LucideIcon className="text-error" icon={Square} size={14} />
            </div>
            <p className="text-base-content/60">
              {t(
                'booking.step3Desc',
                'When you finish working, stop the timer.',
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
