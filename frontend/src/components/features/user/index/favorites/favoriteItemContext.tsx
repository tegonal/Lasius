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

import { ContextButtonClose } from 'components/features/contextMenu/buttons/contextButtonClose'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextButtonStartBooking } from 'components/features/contextMenu/buttons/contextButtonStartBooking'
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { AnimatePresence } from 'framer-motion'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { ModelsBookingStub } from 'lib/api/lasius'
import {
  deleteFavoriteBooking,
  getGetFavoriteBookingListKey,
} from 'lib/api/lasius/user-favorites/user-favorites'
import { stringHash } from 'lib/utils/string/stringHash'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { useSWRConfig } from 'swr'

type Props = {
  item: ModelsBookingStub
}

export const FavoriteItemContext: React.FC<Props> = ({ item }) => {
  const { t } = useTranslation('common')
  const { mutate } = useSWRConfig()

  const itemHash = stringHash(item)
  const { selectedOrganisationId } = useOrganisation()
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()

  const deleteFavorite = async () => {
    const {
      projectReference: { id: projectId },
      tags,
    } = item
    await deleteFavoriteBooking(selectedOrganisationId, { projectId, tags })
    await mutate(getGetFavoriteBookingListKey(selectedOrganisationId))
    handleCloseAll()
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={itemHash} />
        <AnimatePresence>
          {currentOpenContextMenuId === itemHash && (
            <ContextAnimatePresence variant="compact">
              <ContextBar className="-mr-3">
                <ContextButtonStartBooking variant="compact" item={item} />
                <ContextButtonWrapper variant="compact">
                  <Button
                    variant="contextIcon"
                    title={t('favorites.actions.delete', { defaultValue: 'Delete favorite' })}
                    aria-label={t('favorites.actions.delete', { defaultValue: 'Delete favorite' })}
                    onClick={() => deleteFavorite()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Trash2} size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
    </>
  )
}
