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

import { UserCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export const SlidePrivateOrg = () => {
  const { t } = useTranslation('onboarding')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <LucideIcon className="text-primary" icon={UserCircle} size={48} />
        </div>
        <h2 className="text-xl font-bold">
          {t('privateOrganisation.title', 'Your Private Organization')}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t(
            'privateOrganisation.subtitle',
            'You already have a private organization for personal use.',
          )}
        </p>
      </div>

      <div className="bg-base-100 w-full max-w-md space-y-4 rounded-lg p-6">
        <div className="text-center">
          <p className="text-base-content/80">
            {t(
              'privateOrganisation.explanation',
              "Your private organization is perfect for tracking personal projects and anything you don't need to share with others. Only you can see the projects and time tracked here.",
            )}
          </p>
        </div>

        <div className="bg-info/10 text-info-content rounded-lg p-4">
          <div className="font-semibold">
            {t('privateOrganisation.tip', 'Good to Know')}
          </div>
          <p className="text-info-content/80 mt-1">
            {t(
              'privateOrganisation.tipDesc',
              'If you want to work with team members, you can create or join additional organizations.',
            )}
          </p>
        </div>
      </div>

      <p className="text-base-content/60 text-center text-sm">
        {t('privateOrganisation.help', "Click 'Next' to continue")}
      </p>
    </div>
  )
}
