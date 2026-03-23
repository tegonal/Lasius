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

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type ModelsBooking } from '~/services/api/lasius'

import { ContextButtonWrapper } from '../context-button-wrapper'

type Props = {
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
}: Props) => {
  const { t } = useTranslation('common')

  return (
    <ContextButtonWrapper variant={variant}>
      <Button
        aria-label={t('favorites.actions.add', {
          defaultValue: 'Add as favorite',
        })}
        data-testid={testId}
        fullWidth={false}
        onClick={onAddFavorite}
        shape="circle"
        title={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
        variant="contextIcon"
      >
        <LucideIcon icon={Star} size={24} />
      </Button>
    </ContextButtonWrapper>
  )
}
