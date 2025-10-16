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

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'components/primitives/buttons/Button'
import { Label } from 'components/primitives/typography/Label'
import { Card, CardBody } from 'components/ui/cards/Card'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { Select, SelectOption } from 'components/ui/forms/input/Select'
import { ToggleSwitch } from 'components/ui/forms/input/ToggleSwitch'
import Cookies from 'js-cookie'
import { LOCALE_COOKIE_MAX_AGE_DAYS, LOCALE_COOKIE_NAME } from 'lib/config/locales'
import { useColorMode } from 'lib/hooks/useColorMode'
import { usePlausible } from 'lib/telemetry/usePlausible'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  ThemeMode,
  useAppSettingsActions,
  useOnboardingDismissed,
  useTheme,
} from 'stores/appSettingsStore'
import { z } from 'zod'

import type { TFunction } from 'i18next'
import type { LasiusPlausibleEvents } from 'lib/telemetry/plausibleEvents'

const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
]

const themeModeToDataTheme: Record<string, string> = {
  light: 'light',
  dark: 'dark',
}

// Schema factory function with i18n support
const createAppSettingsSchema = (t: TFunction) =>
  z.object({
    language: z
      .string()
      .min(1, t('validation.languageRequired', { defaultValue: 'Language is required' })),
    theme: z.enum(['light', 'dark', 'system'], {
      message: t('validation.themeRequired', { defaultValue: 'Theme is required' }),
    }),
    showOnboarding: z.boolean(),
  })

type FormData = z.infer<ReturnType<typeof createAppSettingsSchema>>

export const AppSettingsForm: React.FC = () => {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [, setMode] = useColorMode()
  const theme = useTheme()
  const onboardingDismissed = useOnboardingDismissed()
  const { setTheme, dismissOnboarding, resetOnboarding } = useAppSettingsActions()
  const plausible = usePlausible<LasiusPlausibleEvents>()

  // Memoize schema to prevent recreation on every render
  const schema = useMemo(() => createAppSettingsSchema(t), [t])

  const hookForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      language: 'en',
      theme: 'system' as ThemeMode,
      showOnboarding: !onboardingDismissed,
    },
  })

  const THEMES: SelectOption[] = [
    { value: 'light', label: t('common.themes.light', { defaultValue: 'Light' }) },
    { value: 'dark', label: t('common.themes.dark', { defaultValue: 'Dark' }) },
    { value: 'system', label: t('common.themes.system', { defaultValue: 'System' }) },
  ]

  useEffect(() => {
    const currentLocale = Cookies.get(LOCALE_COOKIE_NAME) || i18n.language || 'en'
    hookForm.setValue('language', currentLocale)
    hookForm.setValue('theme', theme)
    hookForm.setValue('showOnboarding', !onboardingDismissed)
  }, [i18n.language, theme, onboardingDismissed, hookForm])

  const handleLanguageChange = (value: string) => {
    hookForm.setValue('language', value)
  }

  const handleThemeChange = (value: string) => {
    hookForm.setValue('theme', value as ThemeMode)
  }

  const handleOnboardingToggle = (enabled: boolean) => {
    hookForm.setValue('showOnboarding', enabled)
    if (enabled) {
      resetOnboarding()
      plausible('onboarding.tutorial.reset', {
        props: { source: 'settings' },
      })
    } else {
      dismissOnboarding()
    }
    plausible('settings.app.onboarding_toggle', {
      props: { enabled },
    })
  }

  const onSubmit = (data: FormData) => {
    const currentLocale = Cookies.get(LOCALE_COOKIE_NAME) || i18n.language || 'en'
    const languageChanged = data.language !== currentLocale

    // Track language change
    if (languageChanged) {
      plausible('settings.app.language_change', {
        props: { from: currentLocale, to: data.language },
      })
    }

    // Track theme change
    if (data.theme !== theme) {
      plausible('settings.app.theme_change', {
        props: { theme: data.theme },
      })
    }

    Cookies.set(LOCALE_COOKIE_NAME, data.language, {
      expires: LOCALE_COOKIE_MAX_AGE_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    // Save theme to store
    setTheme(data.theme)

    if (data.theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        setMode(systemTheme)
        document.documentElement.setAttribute('data-theme', systemTheme)
      }
    } else {
      setMode(data.theme)
      const dataTheme = themeModeToDataTheme[data.theme] || 'light'
      document.documentElement.setAttribute('data-theme', dataTheme)
    }

    // Only reload if language changed (to load new translation files)
    if (languageChanged) {
      router.reload()
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <form onSubmit={hookForm.handleSubmit(onSubmit)}>
            <FormBody>
              <FieldSet>
                <FormElement
                  label={t('settings.app.language', {
                    defaultValue: 'Interface Language',
                  })}
                  htmlFor="language-select">
                  <Select
                    id="language-select"
                    value={hookForm.watch('language')}
                    onChange={handleLanguageChange}
                    options={LANGUAGES}
                  />
                </FormElement>
                <FormElement
                  label={t('settings.app.theme', {
                    defaultValue: 'Theme',
                  })}
                  htmlFor="theme-select">
                  <Select
                    id="theme-select"
                    value={hookForm.watch('theme')}
                    onChange={handleThemeChange}
                    options={THEMES}
                  />
                </FormElement>
                <FormElement>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      id="onboarding-toggle"
                      checked={hookForm.watch('showOnboarding')}
                      onChange={handleOnboardingToggle}
                    />
                    <Label htmlFor="onboarding-toggle" className="cursor-pointer">
                      {t('settings.app.showOnboarding', {
                        defaultValue: 'Show Onboarding Tutorial',
                      })}
                    </Label>
                  </div>
                </FormElement>
              </FieldSet>
              <ButtonGroup>
                <Button type="submit" variant="primary">
                  {t('settings.app.save', { defaultValue: 'Save Settings' })}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
