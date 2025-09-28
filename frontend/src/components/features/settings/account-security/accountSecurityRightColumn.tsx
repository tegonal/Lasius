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

import { Heading } from 'components/primitives/typography/Heading'
import { Text } from 'components/primitives/typography/Text'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const AccountSecurityRightColumn: React.FC = () => {
  const { t } = useTranslation('common')
  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('account.accountSecurity', { defaultValue: 'Account Security' })}
      </Heading>
      <Text variant="infoText">
        {t('account.security.description', {
          defaultValue:
            'Update your password to keep your account secure. Make sure to use a strong password with at least 8 characters, including uppercase letters and numbers.',
        })}
      </Text>
      <div className="mt-6">
        <Text variant="infoText" className="text-sm">
          <strong>
            {t('account.security.passwordRequirements', { defaultValue: 'Password requirements:' })}
          </strong>
        </Text>
        <ul className="text-base-content/70 mt-2 space-y-1 text-sm">
          <li>
            •{' '}
            {t('account.security.requirements.minLength', {
              defaultValue: 'At least 8 characters long',
            })}
          </li>
          <li>
            •{' '}
            {t('account.security.requirements.uppercase', {
              defaultValue: 'Contains at least one uppercase letter',
            })}
          </li>
          <li>
            •{' '}
            {t('account.security.requirements.number', {
              defaultValue: 'Contains at least one number',
            })}
          </li>
        </ul>
      </div>
    </div>
  )
}
