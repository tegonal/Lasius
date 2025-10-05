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
import { useOnboardingStatus } from 'lib/hooks/useOnboardingStatus'
import { CheckCircle2, Circle, Clock, Folder, Timer, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const OnboardingSlideChecklist: React.FC = () => {
  const { t } = useTranslation('common')
  const { hasMultipleOrganisations, hasProjects, hasWorkingHours, hasEverBooked } =
    useOnboardingStatus()

  const checklistItems = [
    {
      id: 'organisation',
      icon: Users,
      label: t('onboarding.checklist.organisation', {
        defaultValue: 'Create or join an organization',
      }),
      completed: hasMultipleOrganisations,
    },
    {
      id: 'project',
      icon: Folder,
      label: t('onboarding.checklist.project', { defaultValue: 'Create or join a project' }),
      completed: hasProjects,
    },
    {
      id: 'workingHours',
      icon: Clock,
      label: t('onboarding.checklist.workingHours', {
        defaultValue: 'Set working hours for this organization',
      }),
      completed: hasWorkingHours,
    },
    {
      id: 'booking',
      icon: Timer,
      label: t('onboarding.checklist.booking', { defaultValue: 'Start tracking time' }),
      completed: hasEverBooked,
    },
  ]

  const completedCount = checklistItems.filter((item) => item.completed).length
  const totalCount = checklistItems.length

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {t('onboarding.checklist.title', { defaultValue: "Let's Get You Started" })}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t('onboarding.checklist.subtitle', {
            defaultValue: 'Follow these simple steps to start tracking time',
          })}
        </p>
      </div>

      <div className="bg-base-100 w-full max-w-md rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">
            {t('onboarding.checklist.progress', { defaultValue: 'Your Progress' })}
          </div>
          <div className="text-primary text-sm font-bold">
            {completedCount} / {totalCount}
          </div>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                item.completed ? 'bg-success/10' : 'bg-base-200'
              }`}>
              <div className="flex-shrink-0">
                <LucideIcon
                  icon={item.completed ? CheckCircle2 : Circle}
                  size={20}
                  className={item.completed ? 'text-success' : 'text-base-content/30'}
                />
              </div>
              <div className="flex flex-1 items-start gap-2">
                <div className="bg-primary/10 text-primary mt-0.5 rounded p-1">
                  <LucideIcon icon={item.icon} size={16} />
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm ${item.completed ? 'text-success line-through' : 'font-medium'}`}>
                    {item.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-base-content/60 text-center text-sm">
        {t('onboarding.checklist.help', {
          defaultValue: "Click 'Next' to learn about each step",
        })}
      </p>
    </div>
  )
}
