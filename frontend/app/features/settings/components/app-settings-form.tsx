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
import { API_ROUTES } from '~/config/constants'
import { useLocaleReload } from '~/features/settings/hooks/use-locale-reload'
import { resolveThemeCookieValue } from '~/features/settings/lib/resolve-theme'
import { DEFAULT_LOCALE, LOCALE_LABELS, LOCALES } from '~/i18n-config'
import { type SchemaTranslationFunction, untyped } from '~/lib/i18n-types'
import {
  useAppSettingsActions,
  useIsOnboardingDismissed,
  useTheme,
} from '~/stores/app-settings-store'

const LANGUAGE_OPTIONS: SelectOption[] = LOCALES.map((locale) => ({
  label: LOCALE_LABELS[locale],
  value: locale,
}))

const createAppSettingsSchema = (t: SchemaTranslationFunction) =>
  z.object({
    language: z.string().min(
      1,
      t('common:validation.languageRequired', {
        defaultValue: 'Language is required',
      }),
    ),
    showOnboarding: z.string().optional(),
    theme: z.enum(['light', 'dark', 'system'], {
      message: t('common:validation.themeRequired', {
        defaultValue: 'Theme is required',
      }),
    }),
  })

export const AppSettingsForm = () => {
  const { i18n, t } = useTranslation('settings')
  const theme = useTheme()
  const isOnboardingDismissed = useIsOnboardingDismissed()
  const { dismissOnboarding, resetOnboarding, setTheme } = useAppSettingsActions()
  // Reload after locale cookie has been set by the server
  const { localeFetcher, requestLocaleReload } = useLocaleReload()
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

  const [form, fields] = useForm<z.input<typeof schema>, z.output<typeof schema>>({
    constraint: getZodConstraint(schema),
    defaultValue: {
      language: i18n.language || DEFAULT_LOCALE,
      showOnboarding: isOnboardingDismissed ? '' : 'on',
      theme: theme,
    },
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') return

      const data = submission.value
      const currentLocale = i18n.language || DEFAULT_LOCALE
      const isLanguageChanged = data.language !== currentLocale

      // Update locale cookie via server action
      if (isLanguageChanged) {
        void localeFetcher.submit(
          { locale: data.language },
          { action: API_ROUTES.LOCALE, method: 'post' },
        )
      }

      // Save theme to store
      setTheme(data.theme)

      // Update theme cookie via server action (for SSR).
      // Without matchMedia, a 'system' choice sets no attribute and posts no cookie.
      const canMatchMedia = globalThis.window !== undefined && typeof matchMedia === 'function'
      if (data.theme !== 'system' || canMatchMedia) {
        const isPrefersDark = canMatchMedia && matchMedia('(prefers-color-scheme: dark)').matches
        const resolvedTheme = resolveThemeCookieValue(data.theme, isPrefersDark)
        document.documentElement.dataset.theme = resolvedTheme
        void themeFetcher.submit(
          { theme: resolvedTheme },
          { action: API_ROUTES.THEME, method: 'post' },
        )
      }

      // Reload after locale cookie is persisted (watched by useLocaleReload)
      if (isLanguageChanged) {
        requestLocaleReload()
      }
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
  const languageValue = languageControl.value ?? DEFAULT_LOCALE
  const themeValue = themeControl.value ?? 'system'

  const handleLanguageChange = (value: string) => {
    languageControl.change(value)
  }

  const handleThemeChange = (value: string) => {
    themeControl.change(value)
  }

  const handleOnboardingToggle = (isEnabled: boolean) => {
    onboardingControl.change(isEnabled ? 'on' : '')
    if (isEnabled) {
      resetOnboarding()
    } else {
      dismissOnboarding()
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <form {...getFormProps(form)}>
            <FormBody>
              <FieldSet>
                <FormElement
                  htmlFor={fields.language.id}
                  label={t('app.language', 'Interface Language')}>
                  <input name={fields.language.name} type="hidden" value={languageValue} />
                  <Select
                    id={fields.language.id}
                    onChange={handleLanguageChange}
                    options={LANGUAGE_OPTIONS}
                    value={languageValue}
                  />
                </FormElement>
                <FormElement htmlFor={fields.theme.id} label={t('app.theme', 'Theme')}>
                  <input name={fields.theme.name} type="hidden" value={themeValue} />
                  <Select
                    id={fields.theme.id}
                    onChange={handleThemeChange}
                    options={THEMES}
                    value={themeValue}
                  />
                </FormElement>
                <FormElement>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      checked={onboardingControl.value === 'on'}
                      id="onboarding-toggle"
                      onChange={handleOnboardingToggle}
                    />
                    <Label className="cursor-pointer" htmlFor="onboarding-toggle">
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
