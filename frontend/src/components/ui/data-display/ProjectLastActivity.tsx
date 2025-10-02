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

import { Text } from 'components/primitives/typography/Text'
import { format } from 'date-fns'
import { useProjectLastActivity } from 'lib/api/hooks/useProjectLastActivity'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  orgId: string
  projectId: string
}

/**
 * Async component that fetches and displays the last activity date for a project
 * Loads independently to avoid blocking the list rendering
 */
export const ProjectLastActivity: React.FC<Props> = ({ orgId, projectId }) => {
  const { t } = useTranslation('common')
  const { lastActivityDate, isLoading, error } = useProjectLastActivity(orgId, projectId)

  if (isLoading) {
    return <div className="skeleton h-4 w-20" />
  }

  if (error) {
    return <Text variant="small">-</Text>
  }

  if (!lastActivityDate) {
    return <Text variant="small">{t('projects.noActivity', { defaultValue: 'No activity' })}</Text>
  }

  return <Text variant="small">{format(new Date(lastActivityDate.dateTime), 'dd.MM.yyyy')}</Text>
}
