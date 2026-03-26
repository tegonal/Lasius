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

import { getFormProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo } from 'react'
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
import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES } from '~/i18n-config'
import { validateFormData } from '~/lib/conform-helpers'
import { type SchemaTranslationFn, untyped } from '~/lib/i18n-types'
import {
  type ThemeMode,
  useAppSettingsActions,
  useOnboardingDismissed,
  useTheme,
} from '~/stores/app-settings-store'

const LANGUAGE_OPTIONS: SelectOption[] = LOCALES.map((locale) => ({
  label: LOCALE_LABELS[locale],
  value: locale,
}))

const themeModeToDataTheme: Record<string, string> = {
  dark: 'dark',
  light: 'light',
}

const createAppSettingsSchema = (t: SchemaTranslationFn) =>
  z.object({
    language: z.string().min(
      1,
      t('validation.languageRequired', {
        defaultValue: 'Language is required',
      }),
    ),
    showOnboarding: z.string().optional(),
    theme: z.enum(['light', 'dark', 'system'], {
      message: t('validation.themeRequired', {
        defaultValue: 'Theme is required',
      }),
    }),
  })

export const AppSettingsForm = () => {
  const { i18n, t } = useTranslation('settings')
  const theme = useTheme()
  const onboardingDismissed = useOnboardingDismissed()
  const { dismissOnboarding, resetOnboarding, setTheme } =
    useAppSettingsActions()
  const localeFetcher = useFetcher()
  const themeFetcher = useFetcher()

  const schema = useMemo(() => createAppSettingsSchema(untyped(t)), [t])

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

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      language: i18n.language || DEFAULT_LOCALE,
      showOnboarding: onboardingDismissed ? '' : 'on',
      theme: theme as string,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const languageControl = useInputControl(fields.language)
  const themeControl = useInputControl(fields.theme)
  const onboardingControl = useInputControl(fields.showOnboarding)

  const handleLanguageChange = (value: string) => {
    languageControl.change(value)
  }

  const handleThemeChange = (value: string) => {
    themeControl.change(value)
  }

  const handleOnboardingToggle = (enabled: boolean) => {
    onboardingControl.change(enabled ? 'on' : '')
    if (enabled) {
      resetOnboarding()
    } else {
      dismissOnboarding()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = validateFormData(e.currentTarget, schema)
    if (result.status !== 'success') return

    const data = result.value
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
    setTheme(data.theme as ThemeMode)

    // Update theme cookie via server action (for SSR)
    if (data.theme === 'system') {
      if (globalThis.window !== undefined && globalThis.matchMedia) {
        const prefersDark = globalThis.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        document.documentElement.dataset.theme = systemTheme
        void themeFetcher.submit(
          { theme: systemTheme },
          { action: '/api/theme', method: 'post' },
        )
      }
    } else {
      const dataTheme = themeModeToDataTheme[data.theme] || 'light'
      document.documentElement.dataset.theme = dataTheme
      void themeFetcher.submit(
        { theme: data.theme },
        { action: '/api/theme', method: 'post' },
      )
    }

    // Reload if language changed (to load new translation files)
    if (languageChanged) {
      globalThis.location.reload()
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <form {...getFormProps(form)} onSubmit={handleSubmit}>
            <FormBody>
              <FieldSet>
                <FormElement
                  htmlFor={fields.language.id}
                  label={t('app.language', 'Interface Language')}
                >
                  <input
                    name={fields.language.name}
                    type="hidden"
                    value={languageControl.value ?? DEFAULT_LOCALE}
                  />
                  <Select
                    id={fields.language.id}
                    onChange={handleLanguageChange}
                    options={LANGUAGE_OPTIONS}
                    value={languageControl.value ?? DEFAULT_LOCALE}
                  />
                </FormElement>
                <FormElement
                  htmlFor={fields.theme.id}
                  label={t('app.theme', 'Theme')}
                >
                  <input
                    name={fields.theme.name}
                    type="hidden"
                    value={themeControl.value ?? 'system'}
                  />
                  <Select
                    id={fields.theme.id}
                    onChange={handleThemeChange}
                    options={THEMES}
                    value={themeControl.value ?? 'system'}
                  />
                </FormElement>
                <FormElement>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      checked={onboardingControl.value === 'on'}
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
