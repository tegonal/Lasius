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
import { Calendar, Settings, UserCircle, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const OnboardingSlideNavigation: React.FC = () => {
  const { t } = useTranslation('common')

  const navigationItems = [
    {
      icon: UserCircle,
      title: t('navigation.yourTimeBookingView', { defaultValue: 'Your time booking view' }),
      description: t('onboarding.navigation.userDesc', {
        defaultValue:
          'Track your time, view your bookings, dashboard, projects, statistics and lists',
      }),
    },
    {
      icon: Users,
      title: t('navigation.currentOrganisation', { defaultValue: 'Current organisation' }),
      description: t('onboarding.navigation.organisationDesc', {
        defaultValue:
          'Manage your current organization, create new organizations and view organization-wide data',
      }),
    },
    {
      icon: Settings,
      title: t('account.changeUserProfileSettings', {
        defaultValue: 'Change user profile settings',
      }),
      description: t('onboarding.navigation.settingsDesc', {
        defaultValue: 'Configure app settings, account, security and working hours',
      }),
    },
  ]

  const uiElements = [
    {
      icon: Calendar,
      title: t('onboarding.navigation.weeklyCalendar', { defaultValue: 'Weekly Calendar' }),
      description: t('onboarding.navigation.weeklyCalendarDesc', {
        defaultValue: 'At the top of the page, switch between days to view your bookings',
      }),
    },
    {
      icon: Users,
      title: t('onboarding.navigation.orgSwitcher', { defaultValue: 'Organization Switcher' }),
      description: t('onboarding.navigation.orgSwitcherDesc', {
        defaultValue: 'In the top-right corner, switch between your organizations',
      }),
    },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">
          {t('onboarding.navigation.title', { defaultValue: 'Getting Around Lasius' })}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t('onboarding.navigation.subtitle', {
            defaultValue: 'Here are the main parts of Lasius you will use every day.',
          })}
        </p>
      </div>

      <div className="bg-base-100 max-w-md space-y-6 rounded-lg p-6">
        <div>
          <div className="mb-3 font-semibold">
            {t('onboarding.navigation.mainNavigation', { defaultValue: 'Main Navigation' })}
          </div>
          <div className="space-y-3">
            {navigationItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                  <LucideIcon icon={item.icon} size={20} />
                </div>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-base-content/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-base-300 border-t pt-4">
          <div className="mb-3 font-semibold">
            {t('onboarding.navigation.importantUI', { defaultValue: 'Important UI Elements' })}
          </div>
          <div className="space-y-3">
            {uiElements.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                  <LucideIcon icon={item.icon} size={20} />
                </div>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-base-content/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
