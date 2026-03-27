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

import { FolderKanban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ROUTES } from '~/config/routes.constants'

export const SlideProjects = () => {
  const { t } = useTranslation('onboarding')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <LucideIcon className="text-primary" icon={FolderKanban} size={48} />
        </div>
        <h2 className="text-xl font-bold">
          {t('projects.title', 'Create or Join a Project')}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t(
            'projects.subtitle',
            'Projects help you organize your time. You need at least one to get started.',
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
              {t('projects.step1', 'Create Your Own')}
            </div>
            <p className="text-base-content/60">
              {t(
                'projects.step1Desc',
                'Go to My Projects and create a new project.',
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">
            2
          </div>
          <div>
            <div className="font-semibold">
              {t('projects.step2', 'Or Join an Existing One')}
            </div>
            <p className="text-base-content/60">
              {t(
                'projects.step2Desc',
                'Ask an administrator to add you to their project.',
              )}
            </p>
          </div>
        </div>
      </div>

      <Link to={ROUTES.USER.PROJECTS}>
        <Button fullWidth={false} size="sm" variant="primary">
          {t('projects.action', 'Go to My Projects')}
        </Button>
      </Link>
    </div>
  )
}
