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

import { useTranslation } from 'next-i18next'
import React from 'react'

import { ImporterTypeIcon } from './ImporterTypeIcon'
import { getImporterTypeLabel, type ImporterType } from './types'

type Props = {
  type: ImporterType
}

export const ImporterTypeBadge: React.FC<Props> = ({ type }) => {
  const { t } = useTranslation('integrations')

  return (
    <div className="badge badge-outline gap-2">
      <ImporterTypeIcon type={type} className="h-3 w-3" />
      {getImporterTypeLabel(type, t)}
    </div>
  )
}
