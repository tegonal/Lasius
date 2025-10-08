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

import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Star } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const EmptyStateFavorites: React.FC = () => {
  const { t } = useTranslation('common')
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-8">
      <div className="text-base-content/50 flex flex-col items-center justify-center gap-2 text-sm">
        <LucideIcon icon={Star} size={32} />
        <div className="text-center">
          {t('favorites.empty', { defaultValue: 'No favorites yet' })}
        </div>
      </div>
    </div>
  )
}
