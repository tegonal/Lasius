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

import { Logo } from 'components/ui/icons/Logo'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { BarChart3, Clock, Globe, Shield, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const LoginInfoPanel: React.FC = () => {
  const { t } = useTranslation('common')

  const features = [
    { icon: Clock, text: t('features.trackTime', { defaultValue: 'Track time effortlessly' }) },
    {
      icon: Users,
      text: t('features.organizeTeams', { defaultValue: 'Organize by teams & projects' }),
    },
    {
      icon: BarChart3,
      text: t('features.insightfulReports', { defaultValue: 'Insightful reports & analytics' }),
    },
    {
      icon: Globe,
      text: t('features.openSource', { defaultValue: 'Open source & self-hosted' }),
    },
  ]

  return (
    <>
      <Logo className="text-secondary-content mb-16 h-16 w-auto" />
      <h1 className="mb-4 text-4xl font-bold">
        {t('auth.welcomeToLasius', { defaultValue: 'Welcome to Lasius' })}
      </h1>
      <p className="mb-8 text-xl opacity-90">
        {t('auth.tagline', { defaultValue: 'Open source time tracking for teams' })}
      </p>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex animate-[fadeInUp_0.6s_ease-out_forwards] items-center gap-3 opacity-0"
            style={{ animationDelay: `${index * 100}ms` }}>
            <div className="bg-secondary-content/10 rounded-lg p-2 backdrop-blur-sm">
              <LucideIcon icon={feature.icon} size={20} />
            </div>
            <span className="text-lg">{feature.text}</span>
          </div>
        ))}
      </div>

      <div className="border-secondary-content/20 mt-12 border-t pt-8">
        <div className="flex items-center gap-2 text-sm opacity-80">
          <LucideIcon icon={Shield} size={16} />
          <span>{t('auth.secureAndPrivate', { defaultValue: 'Secure & private' })}</span>
        </div>
      </div>
    </>
  )
}

export const InternalLoginInfoPanel: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <>
      <Logo className="text-secondary-content mb-16 h-16 w-auto" />
      <h1 className="mb-4 text-4xl font-bold">
        {t('auth.welcomeBack', { defaultValue: 'Welcome back' })}
      </h1>
      <p className="mb-8 text-xl opacity-90">
        {t('auth.signInToContinue', { defaultValue: 'Sign in to continue tracking your time' })}
      </p>
    </>
  )
}

export const RegisterInfoPanel: React.FC = () => {
  const { t } = useTranslation('common')

  const benefits = [
    {
      icon: Globe,
      text: t('features.freeAndOpenSource', { defaultValue: 'Free and open source' }),
    },
    {
      icon: Clock,
      text: t('features.startTrackingMinutes', {
        defaultValue: 'Start tracking time in minutes',
      }),
    },
    {
      icon: Users,
      text: t('features.inviteTeamMembers', { defaultValue: 'Invite your team members' }),
    },
  ]

  return (
    <>
      <Logo className="text-secondary-content mb-16 h-16 w-auto" />
      <h1 className="mb-4 text-4xl font-bold">
        {t('auth.joinLasius', { defaultValue: 'Join Lasius' })}
      </h1>
      <p className="mb-8 text-xl opacity-90">
        {t('auth.getStartedFree', {
          defaultValue: 'Get started with open source time tracking',
        })}
      </p>

      <div className="space-y-4">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="flex animate-[fadeInUp_0.6s_ease-out_forwards] items-center gap-3 opacity-0"
            style={{ animationDelay: `${index * 100}ms` }}>
            <div className="bg-secondary-content/10 rounded-lg p-2 backdrop-blur-sm">
              <LucideIcon icon={benefit.icon} size={20} />
            </div>
            <span className="text-lg">{benefit.text}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export const LoadingInfoPanel: React.FC = () => {
  const { t } = useTranslation('common')

  return (
    <>
      <Logo className="text-secondary-content mb-16 h-16 w-auto" />
      <h1 className="mb-4 text-4xl font-bold">
        {t('auth.connectingSecurely', { defaultValue: 'Connecting you securely' })}
      </h1>
      <div className="loading loading-dots loading-lg"></div>
    </>
  )
}
