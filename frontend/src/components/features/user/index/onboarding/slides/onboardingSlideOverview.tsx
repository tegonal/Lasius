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
import { Clock, FileText, Folder, Tags, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const OnboardingSlideOverview: React.FC = () => {
  const { t } = useTranslation('common')

  const buildingBlocks = [
    {
      icon: Users,
      title: t('onboarding.overview.organisations', { defaultValue: 'Organizations' }),
      description: t('onboarding.overview.organisationsDesc', {
        defaultValue: 'Collaborate with your team members',
      }),
    },
    {
      icon: Folder,
      title: t('onboarding.overview.projects', { defaultValue: 'Projects' }),
      description: t('onboarding.overview.projectsDesc', {
        defaultValue: 'Organize work into trackable projects',
      }),
    },
    {
      icon: Tags,
      title: t('onboarding.overview.tags', { defaultValue: 'Tags & Tag Groups' }),
      description: t('onboarding.overview.tagsDesc', {
        defaultValue: 'Categorize your bookings for detailed reports',
      }),
    },
    {
      icon: Clock,
      title: t('onboarding.overview.workingHours', { defaultValue: 'Working Hours' }),
      description: t('onboarding.overview.workingHoursDesc', {
        defaultValue: 'Track your planned work hours per week',
      }),
    },
    {
      icon: FileText,
      title: t('onboarding.overview.exports', { defaultValue: 'Exports & Lists' }),
      description: t('onboarding.overview.exportsDesc', {
        defaultValue: 'Find your reports in the Lists section',
      }),
    },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {t('onboarding.overview.title', { defaultValue: 'Welcome to Lasius' })}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t('onboarding.overview.subtitle', {
            defaultValue: 'Here are the basic building blocks you should know about',
          })}
        </p>
      </div>

      <div className="bg-base-100 w-full max-w-md space-y-3 rounded-lg p-6">
        {buildingBlocks.map((block) => (
          <div key={block.title} className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary mt-0.5 flex-shrink-0 rounded p-2">
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
        {t('onboarding.overview.help', {
          defaultValue: "Click 'Next' to see what you need to set up",
        })}
      </p>
    </div>
  )
}
