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

import { Clock, FileText, Folder, Tags, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export const SlideOverview = () => {
  const { t } = useTranslation('onboarding')

  const buildingBlocks = [
    {
      description: t(
        'overview.organisationsDesc',
        'Collaborate with your team members',
      ),
      icon: Users,
      title: t('overview.organisations', 'Organizations'),
    },
    {
      description: t(
        'overview.projectsDesc',
        'Organize work into trackable projects',
      ),
      icon: Folder,
      title: t('overview.projects', 'Projects'),
    },
    {
      description: t(
        'overview.tagsDesc',
        'Categorize your bookings for detailed reports',
      ),
      icon: Tags,
      title: t('overview.tags', 'Tags & Tag Groups'),
    },
    {
      description: t(
        'overview.workingHoursDesc',
        'Track your planned work hours per week',
      ),
      icon: Clock,
      title: t('overview.workingHours', 'Working Hours'),
    },
    {
      description: t(
        'overview.exportsDesc',
        'Find your reports in the Lists section',
      ),
      icon: FileText,
      title: t('overview.exports', 'Exports & Lists'),
    },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {t('overview.title', 'Welcome to Lasius')}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t(
            'overview.subtitle',
            'Here are the basic building blocks you should know about',
          )}
        </p>
      </div>

      <div className="bg-base-100 w-full max-w-md space-y-3 rounded-lg p-6">
        {buildingBlocks.map((block) => (
          <div className="flex items-start gap-3" key={block.title}>
            <div className="bg-primary/10 text-primary mt-0.5 shrink-0 rounded p-2">
              <LucideIcon icon={block.icon} size={18} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{block.title}</div>
              <p className="text-base-content/60">{block.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-base-content/60 text-center text-sm">
        {t('overview.help', "Click 'Next' to see what you need to set up")}
      </p>
    </div>
  )
}
