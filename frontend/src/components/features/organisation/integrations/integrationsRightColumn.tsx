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

export const IntegrationsRightColumn: React.FC = () => {
  const { t } = useTranslation('integrations')

  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('integrations.title', { defaultValue: 'Integrations' })}
      </Heading>
      <Text variant="infoText">
        {t('integrations.description', {
          defaultValue:
            'Connect Lasius with external issue tracking systems like GitHub, GitLab, Jira, and Plane. Imported issues become available as tags when booking time in mapped projects, allowing you to track time directly on your issues.',
        })}
      </Text>
      <Text variant="infoText">
        {t('integrations.configureDescription', {
          defaultValue:
            'Use the Add Configuration button to set up a new integration. After creating a configuration, map your external projects to Lasius projects to enable issue imports.',
        })}
      </Text>
    </div>
  )
}
