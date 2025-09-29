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

export const AccountRightColumn: React.FC = () => {
  const { t } = useTranslation('common')
  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('account.settings.title', { defaultValue: 'Account Settings' })}
      </Heading>
      <Text variant="infoText">
        {t('account.settings.description', {
          defaultValue:
            'Manage your personal information and account details. Your email address can only be changed if you are using the internal authentication provider.',
        })}
      </Text>
      <div className="mt-6">
        <Text variant="infoText" className="text-sm">
          <strong>{t('account.settings.information', { defaultValue: 'Information:' })}</strong>
        </Text>
        <ul className="text-base-content/70 mt-2 space-y-1 text-sm">
          <li>
            •{' '}
            {t('account.settings.info.roleAdmin', {
              defaultValue: 'Your role is determined by your organization administrator',
            })}
          </li>
          <li>
            •{' '}
            {t('account.settings.info.emailVerification', {
              defaultValue: 'Email changes may require verification',
            })}
          </li>
          <li>
            •{' '}
            {t('account.settings.info.autoSave', {
              defaultValue: 'All changes are saved immediately',
            })}
          </li>
        </ul>
      </div>
    </div>
  )
}
