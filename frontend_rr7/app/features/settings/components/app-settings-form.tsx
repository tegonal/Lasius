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
import { type TFunction } from 'i18next'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useFetcher } from 'react-router'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Label } from '~/components/primitives/typography/label'
import { Card, CardBody } from '~/components/ui/cards/card'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { Select, type SelectOption } from '~/components/ui/forms/input/select'
import { ToggleSwitch } from '~/components/ui/forms/input/toggle-switch'
import { DEFAULT_LOCALE, LOCALES } from '~/i18n-config'
import {
  type ThemeMode,
  useAppSettingsActions,
  useOnboardingDismissed,
  useTheme,
} from '~/stores/app-settings-store'

const LOCALE_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
}

const LANGUAGE_OPTIONS: SelectOption[] = LOCALES.map((locale) => ({
  label: LOCALE_LABELS[locale] || locale,
  value: locale,
}))

const themeModeToDataTheme: Record<string, string> = {
  dark: 'dark',
  light: 'light',
}

const createAppSettingsSchema = (t: TFunction) =>
  z.object({
    language: z.string().min(
      1,
      t('validation.languageRequired', {
        defaultValue: 'Language is required',
      }),
    ),
    showOnboarding: z.boolean(),
    theme: z.enum(['light', 'dark', 'system'], {
      message: t('validation.themeRequired', {
        defaultValue: 'Theme is required',
      }),
    }),
  })

type FormData = z.infer<ReturnType<typeof createAppSettingsSchema>>

export const AppSettingsForm = () => {
  const { i18n, t } = useTranslation('settings')
  const theme = useTheme()
  const onboardingDismissed = useOnboardingDismissed()
  const { dismissOnboarding, resetOnboarding, setTheme } =
    useAppSettingsActions()
  const localeFetcher = useFetcher()
  const themeFetcher = useFetcher()

  const schema = useMemo(() => createAppSettingsSchema(t), [t])

  const hookForm = useForm<FormData>({
    defaultValues: {
      language: DEFAULT_LOCALE,
      showOnboarding: !onboardingDismissed,
      theme: 'system' as ThemeMode,
    },
    resolver: zodResolver(schema),
  })

  const THEMES: SelectOption[] = [
    {
      label: t('themes.light', { defaultValue: 'Light' }),
      value: 'light',
    },
    {
      label: t('themes.dark', { defaultValue: 'Dark' }),
      value: 'dark',
    },
    {
      label: t('themes.system', { defaultValue: 'System' }),
      value: 'system',
    },
  ]

  useEffect(() => {
    hookForm.setValue('language', i18n.language || DEFAULT_LOCALE)
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
    } else {
      dismissOnboarding()
    }
  }

  const onSubmit = (data: FormData) => {
    const currentLocale = i18n.language || DEFAULT_LOCALE
    const languageChanged = data.language !== currentLocale

    // Update locale cookie via server action
    if (languageChanged) {
      void localeFetcher.submit(
        { locale: data.language },
        { action: '/api/locale', method: 'post' },
      )
    }

    // Save theme to store
    setTheme(data.theme)

    // Update theme cookie via server action (for SSR)
    if (data.theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', systemTheme)
        void themeFetcher.submit(
          { theme: systemTheme },
          { action: '/api/theme', method: 'post' },
        )
      }
    } else {
      const dataTheme = themeModeToDataTheme[data.theme] || 'light'
      document.documentElement.setAttribute('data-theme', dataTheme)
      void themeFetcher.submit(
        { theme: data.theme },
        { action: '/api/theme', method: 'post' },
      )
    }

    // Reload if language changed (to load new translation files)
    if (languageChanged) {
      window.location.reload()
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
                  htmlFor="language-select"
                  label={t('app.language', 'Interface Language')}
                >
                  <Select
                    id="language-select"
                    onChange={handleLanguageChange}
                    options={LANGUAGE_OPTIONS}
                    value={hookForm.watch('language')}
                  />
                </FormElement>
                <FormElement
                  htmlFor="theme-select"
                  label={t('app.theme', 'Theme')}
                >
                  <Select
                    id="theme-select"
                    onChange={handleThemeChange}
                    options={THEMES}
                    value={hookForm.watch('theme')}
                  />
                </FormElement>
                <FormElement>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      checked={hookForm.watch('showOnboarding')}
                      id="onboarding-toggle"
                      onChange={handleOnboardingToggle}
                    />
                    <Label
                      className="cursor-pointer"
                      htmlFor="onboarding-toggle"
                    >
                      {t('app.showOnboarding', 'Show Onboarding Tutorial')}
                    </Label>
                  </div>
                </FormElement>
              </FieldSet>
              <ButtonGroup>
                <Button type="submit" variant="primary">
                  {t('app.save', 'Save Settings')}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
