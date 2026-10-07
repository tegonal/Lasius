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

import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type ModelsBooking } from '~/services/api/lasius'

import { ContextButtonAction } from './context-button-action'

type Properties = {
  'data-testid'?: string
  item: ModelsBooking
  onAddFavorite?: () => void
  variant?: 'compact' | 'default'
}

export const ContextButtonAddFavorite = ({
  'data-testid': testId,
  item: _item,
  onAddFavorite,
  variant = 'default',
}: Properties) => {
  const { t } = useTranslation('home')

  return (
    <ContextButtonAction
      data-testid={testId}
      icon={Star}
      label={t('favorites.actions.add', 'Add as favorite')}
      onClick={onAddFavorite}
      variant={variant}
    />
  )
}
