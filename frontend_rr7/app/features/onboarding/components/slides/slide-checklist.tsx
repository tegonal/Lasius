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

import { CheckCircle2, Circle, Clock, Folder, Timer, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useOnboardingStatus } from '~/features/onboarding/hooks/use-onboarding-status'

interface SlideChecklistProps {
  onNavigateToSlide?: (slideId: string) => void
}

export const SlideChecklist = ({ onNavigateToSlide }: SlideChecklistProps) => {
  const { t } = useTranslation('onboarding')
  const { hasMultipleOrganisations, hasProjects, hasWorkingHours } =
    useOnboardingStatus()

  const checklistItems = [
    {
      completed: hasMultipleOrganisations,
      icon: Users,
      id: 'organisation',
      label: t('checklist.organisation', 'Create or join an organization'),
    },
    {
      completed: hasProjects,
      icon: Folder,
      id: 'projects',
      label: t('checklist.project', 'Create or join a project'),
    },
    {
      completed: hasWorkingHours,
      icon: Clock,
      id: 'workingHours',
      label: t(
        'checklist.workingHours',
        'Set working hours for this organization',
      ),
    },
    {
      completed: false,
      icon: Timer,
      id: 'booking',
      label: t('checklist.booking', 'Start tracking time'),
    },
  ]

  const completedCount = checklistItems.filter((item) => item.completed).length
  const totalCount = checklistItems.length

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {t('checklist.title', "Let's Get You Started")}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t(
            'checklist.subtitle',
            'Follow these simple steps to start tracking time',
          )}
        </p>
      </div>

      <div className="bg-base-100 w-full max-w-md rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">
            {t('checklist.progress', 'Your Progress')}
          </div>
          <div className="text-primary text-sm font-bold">
            {completedCount} / {totalCount}
          </div>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item) => (
            <button
              className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-all ${
                item.completed ? 'bg-success/10' : 'bg-base-200'
              } ${onNavigateToSlide ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''}`}
              disabled={!onNavigateToSlide}
              key={item.id}
              onClick={() => onNavigateToSlide?.(item.id)}
              type="button"
            >
              <div className="shrink-0">
                <LucideIcon
                  className={
                    item.completed ? 'text-success' : 'text-base-content/30'
                  }
                  icon={item.completed ? CheckCircle2 : Circle}
                  size={20}
                />
              </div>
              <div className="flex flex-1 items-start gap-2">
                <div className="bg-primary/10 text-primary mt-0.5 rounded p-1">
                  <LucideIcon icon={item.icon} size={16} />
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm ${item.completed ? 'text-success line-through' : 'font-medium'}`}
                  >
                    {item.label}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-base-content/60 text-center text-sm">
        {t('checklist.help', 'Click on any item to learn more about it')}
      </p>
    </div>
  )
}
