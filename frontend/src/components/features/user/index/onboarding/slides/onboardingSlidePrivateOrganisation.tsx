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
import { UserCircle } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const OnboardingSlidePrivateOrganisation: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <LucideIcon icon={UserCircle} size={48} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold">
          {t('onboarding.privateOrganisation.title', {
            defaultValue: 'Your Private Organization',
          })}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t('onboarding.privateOrganisation.subtitle', {
            defaultValue: 'You already have a private organization for personal use.',
          })}
        </p>
      </div>

      <div className="bg-base-100 w-full max-w-md space-y-4 rounded-lg p-6">
        <div className="text-center">
          <p className="text-base-content/80">
            {t('onboarding.privateOrganisation.explanation', {
              defaultValue:
                "Your private organization is perfect for tracking personal projects and anything you don't need to share with others. Only you can see the projects and time tracked here.",
            })}
          </p>
        </div>

        <div className="bg-info/10 text-info-content rounded-lg p-4">
          <div className="font-semibold">
            {t('onboarding.privateOrganisation.tip', { defaultValue: '💡 Good to Know' })}
          </div>
          <p className="text-info-content/80 mt-1">
            {t('onboarding.privateOrganisation.tipDesc', {
              defaultValue:
                'If you want to work with team members, you can create or join additional organizations.',
            })}
          </p>
        </div>
      </div>

      <p className="text-base-content/60 text-center text-sm">
        {t('onboarding.privateOrganisation.help', {
          defaultValue: "Click 'Next' to continue",
        })}
      </p>
    </div>
  )
}
