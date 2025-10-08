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

export const WorkingHoursRightColumn: React.FC = () => {
  const { t } = useTranslation('common')
  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('workingHours.title', { defaultValue: 'Working hours' })}
      </Heading>
      <Text variant="infoText">
        {t('workingHours.description', {
          defaultValue:
            'The amount of time you expect to book per day, by organisation, during a typical working week. This data is used to calculate your daily and weekly progress.',
        })}
      </Text>
    </div>
  )
}
