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
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { AnimatePresence } from 'framer-motion'
import { ModelsCurrentUserTimeBooking } from 'lib/api/lasius'
import { stringHash } from 'lib/utils/string/stringHash'
import React from 'react'

type Props = {
  item: ModelsCurrentUserTimeBooking
}

export const OrganisationItemContext: React.FC<Props> = ({ item }) => {
  const itemHash = stringHash(item)
  const { currentOpenContextMenuId } = useContextMenu()

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={itemHash} />
        <AnimatePresence>
          {currentOpenContextMenuId === itemHash && (
            <ContextAnimatePresence variant="compact">
              <ContextBar className="-mr-3">
                <ContextButtonStartBooking variant="compact" item={item} />
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
