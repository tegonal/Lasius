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

import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { Select, SelectOption } from 'components/ui/forms/input/Select'
import Cookies from 'js-cookie'
import { LOCALE_COOKIE_MAX_AGE_DAYS, LOCALE_COOKIE_NAME } from 'lib/config/locales'
import { useColorMode } from 'lib/hooks/useColorMode'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]

type ThemeMode = 'light' | 'dark' | 'system'

const themeModeToDataTheme: Record<string, string> = {
  light: 'light',
  dark: 'dark',
}

export const AppSettingsForm: React.FC = () => {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [, setMode] = useColorMode()
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>('system')

  const THEMES: SelectOption[] = [
    { value: 'light', label: t('common.themes.light') },
    { value: 'dark', label: t('common.themes.dark') },
    { value: 'system', label: t('common.themes.system') },
  ]

  useEffect(() => {
    const currentLocale = Cookies.get(LOCALE_COOKIE_NAME) || i18n.language || 'en'
    setSelectedLanguage(currentLocale)

    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setSelectedTheme(savedTheme as ThemeMode)
    } else {
      setSelectedTheme('system')
    }
  }, [i18n.language])

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
  }

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value as ThemeMode)
  }

  const handleSave = () => {
    Cookies.set(LOCALE_COOKIE_NAME, selectedLanguage, {
      expires: LOCALE_COOKIE_MAX_AGE_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    if (selectedTheme === 'system') {
      localStorage.removeItem('theme')

      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme = prefersDark ? 'dark' : 'light'
        setMode(systemTheme)
        document.documentElement.setAttribute('data-theme', systemTheme)
      }
    } else {
      localStorage.setItem('theme', selectedTheme)
      setMode(selectedTheme)
      const dataTheme = themeModeToDataTheme[selectedTheme] || 'light'
      document.documentElement.setAttribute('data-theme', dataTheme)
    }

    router.reload()
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <FormBody>
            <FieldSet>
              <FormElement
                label={t('settings.app.language', {
                  defaultValue: 'Interface Language',
                })}
                htmlFor="language-select">
                <Select
                  id="language-select"
                  value={selectedLanguage}
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
                  value={selectedTheme}
                  onChange={handleThemeChange}
                  options={THEMES}
                />
              </FormElement>
            </FieldSet>
            <ButtonGroup>
              <Button variant="primary" onClick={handleSave}>
                {t('settings.app.save', { defaultValue: 'Save Settings' })}
              </Button>
            </ButtonGroup>
          </FormBody>
        </CardBody>
      </Card>
    </div>
  )
}
