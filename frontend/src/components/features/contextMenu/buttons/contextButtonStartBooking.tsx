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
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBooking, ModelsBookingStub, ModelsCurrentUserTimeBooking } from 'lib/api/lasius'
import { Timer } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  item: ModelsBooking | ModelsCurrentUserTimeBooking | ModelsBookingStub
  variant?: 'default' | 'compact'
}
export const ContextButtonStartBooking: React.FC<Props> = ({ item, variant = 'default' }) => {
  const { actionStartBooking } = useContextMenu()
  const { t } = useTranslation('common')
  const { selectedOrganisationId } = useOrganisation()
  const Wrapper = variant === 'compact' ? ContextCompactButtonWrapper : ContextButtonWrapper
  return (
    <Wrapper>
      <Button
        variant="contextIcon"
        title={t('bookings.actions.start', { defaultValue: 'Start booking' })}
        aria-label={t('bookings.actions.start', { defaultValue: 'Start booking' })}
        onClick={() => actionStartBooking(selectedOrganisationId, item)}
        fullWidth={false}
        shape="circle">
        <LucideIcon icon={Timer} size={24} />
      </Button>
    </Wrapper>
  )
}
