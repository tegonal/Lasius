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

import { Calendar, Settings, UserCircle, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export const SlideNavigation = () => {
  const { t } = useTranslation('onboarding')

  const navigationItems = [
    {
      description: t(
        'navigation.userDesc',
        'Track your time, view your bookings, dashboard, projects, statistics and lists',
      ),
      icon: UserCircle,
      title: t('navigation:yourTimeBookingView', 'Your time booking view'),
    },
    {
      description: t(
        'navigation.organisationDesc',
        'Manage your current organization, create new organizations and view organization-wide data',
      ),
      icon: Users,
      title: t('navigation:currentOrganisation', 'Current organisation'),
    },
    {
      description: t(
        'navigation.settingsDesc',
        'Configure app settings, account, security and working hours',
      ),
      icon: Settings,
      title: t(
        'settings:changeUserProfileSettings',
        'Change user profile settings',
      ),
    },
  ]

  const uiElements = [
    {
      description: t(
        'navigation.weeklyCalendarDesc',
        'At the top of the page, switch between days to view your bookings',
      ),
      icon: Calendar,
      title: t('navigation.weeklyCalendar', 'Weekly Calendar'),
    },
    {
      description: t(
        'navigation.orgSwitcherDesc',
        'In the top-right corner, switch between your organizations',
      ),
      icon: Users,
      title: t('navigation.orgSwitcher', 'Organization Switcher'),
    },
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">
          {t('navigation.title', 'Getting Around Lasius')}
        </h2>
        <p className="text-base-content/70 mt-2">
          {t(
            'navigation.subtitle',
            'Here are the main parts of Lasius you will use every day.',
          )}
        </p>
      </div>

      <div className="bg-base-100 max-w-md space-y-6 rounded-lg p-6">
        <div>
          <div className="mb-3 font-semibold">
            {t('navigation.mainNavigation', 'Main Navigation')}
          </div>
          <div className="space-y-3">
            {navigationItems.map((item) => (
              <div className="flex items-start gap-3" key={item.title}>
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
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
            {t('navigation.importantUI', 'Important UI Elements')}
          </div>
          <div className="space-y-3">
            {uiElements.map((item) => (
              <div className="flex items-start gap-3" key={item.title}>
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
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
