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
import { Clock } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { ROUTES } from 'projectConfig/routes.constants'
import React from 'react'

export const OnboardingSlideWorkingHours: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <LucideIcon icon={Clock} size={48} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold">
          {t('onboarding.workingHours.title', { defaultValue: 'Set Working Hours' })}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t('onboarding.workingHours.subtitle', {
            defaultValue: 'Tell Lasius how many hours per week you plan to work.',
          })}
        </p>
      </div>

      <div className="bg-base-100 max-w-md space-y-4 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
            1
          </div>
          <div>
            <div className="font-semibold">
              {t('onboarding.workingHours.step1', { defaultValue: 'Go to Working Hours' })}
            </div>
            <p className="text-base-content/60">
              {t('onboarding.workingHours.step1Desc', {
                defaultValue: 'Click the button below to set your hours.',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold">
            2
          </div>
          <div>
            <div className="font-semibold">
              {t('onboarding.workingHours.step2', { defaultValue: 'Enter Your Weekly Hours' })}
            </div>
            <p className="text-base-content/60">
              {t('onboarding.workingHours.step2Desc', {
                defaultValue:
                  'Set how many hours you work each day. Lasius will show your progress.',
              })}
            </p>
          </div>
        </div>
      </div>

      <Link href={ROUTES.SETTINGS.WORKING_HOURS}>
        <Button variant="primary" size="sm" fullWidth={false}>
          {t('onboarding.workingHours.action', {
            defaultValue: 'Set Working Hours',
          })}
        </Button>
      </Link>
    </div>
  )
}
