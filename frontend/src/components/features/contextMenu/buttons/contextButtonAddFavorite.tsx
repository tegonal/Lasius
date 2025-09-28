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

import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { ContextCompactButtonWrapper } from 'components/features/contextMenu/contextCompactButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { Icon } from 'components/ui/icons/Icon'
import { ModelsBooking } from 'lib/api/lasius'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useSelectedOrganisationId } from 'stores/organisationStore'

type Props = {
  item: ModelsBooking
  variant?: 'default' | 'compact'
}
export const ContextButtonAddFavorite: React.FC<Props> = ({ item, variant }) => {
  const { actionAddBookingToFavorites } = useContextMenu()
  const { t } = useTranslation('common')
  const selectedOrganisationId = useSelectedOrganisationId()
  const Wrapper = variant === 'compact' ? ContextCompactButtonWrapper : ContextButtonWrapper
  return (
    <Wrapper>
      <Button
        variant="contextIcon"
        title={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
        aria-label={t('favorites.actions.add', { defaultValue: 'Add as favorite' })}
        onClick={() => actionAddBookingToFavorites(selectedOrganisationId, item)}
        fullWidth={false}
        shape="circle">
        <Icon name="rating-star-add-social-medias-rewards-rating" size={24} />
      </Button>
    </Wrapper>
  )
}
