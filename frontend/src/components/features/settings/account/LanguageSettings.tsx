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
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]

export const LanguageSettings: React.FC = () => {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')

  useEffect(() => {
    // Get current language from cookie or i18n
    const currentLocale = Cookies.get(LOCALE_COOKIE_NAME) || i18n.language || 'en'
    setSelectedLanguage(currentLocale)
  }, [i18n.language])

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
  }

  const handleSave = () => {
    // Set the cookie
    Cookies.set(LOCALE_COOKIE_NAME, selectedLanguage, {
      expires: LOCALE_COOKIE_MAX_AGE_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    // Reload the page to apply the new language
    router.reload()
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {t('account.languageSettings.title', { defaultValue: 'Language Preferences' })}
          </h2>
          <p className="text-base-content/70 mb-6 text-sm">
            {t('account.languageSettings.description', {
              defaultValue:
                'Choose your preferred language for the interface. This setting is stored locally in your browser.',
            })}
          </p>
          <FormBody>
            <FieldSet>
              <FormElement
                label={t('account.languageSettings.selectLanguage', {
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
            </FieldSet>
            <ButtonGroup>
              <Button variant="primary" onClick={handleSave}>
                {t('account.languageSettings.save', { defaultValue: 'Save Language Preference' })}
              </Button>
            </ButtonGroup>
          </FormBody>
        </CardBody>
      </Card>
    </div>
  )
}
