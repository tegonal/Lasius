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

import { useStartBookingNow } from '~/features/bookings/hooks/use-start-booking-now'
import { bookingProjectAndTags } from '~/features/bookings/lib/booking-adjustments'
import { ContextButtonAddFavorite } from '~/features/context-menu/buttons/context-button-add-favorite'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextButtonStartBooking } from '~/features/context-menu/buttons/context-button-start-booking'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'
import { stringHash } from '~/lib/utils/string-hash'
import { type ModelsBooking } from '~/services/api/lasius'
import { useAddFavoriteBooking } from '~/services/api/lasius-hooks/user-favorites/user-favorites'

type Properties = {
  item: ModelsBooking
  selectedOrgId: string
}

export const RecentItemContext = ({ item, selectedOrgId }: Properties) => {
  const { submit: addFavoriteSubmit } = useAddFavoriteBooking()
  const startBookingNow = useStartBookingNow(selectedOrgId)

  const itemHash = stringHash(item)
  const { handleCloseAll } = useContextMenu()

  const addFavorite = () => {
    addFavoriteSubmit({ body: bookingProjectAndTags(item), orgId: selectedOrgId })
    handleCloseAll()
  }

  const handleStart = () => {
    startBookingNow(item)
    handleCloseAll()
  }

  return (
    <ContextBody hash={itemHash} variant="compact">
      <ContextButtonOpen data-testid="recent-ctx-open-btn" />
      <ContextAnimatePresence variant="compact">
        <ContextBar className="-mr-3">
          <ContextButtonStartBooking
            data-testid="recent-ctx-start-btn"
            item={item}
            onStart={handleStart}
            variant="compact"
          />
          <ContextButtonAddFavorite
            data-testid="recent-ctx-add-favorite-btn"
            item={item}
            onAddFavorite={addFavorite}
            variant="compact"
          />
          <ContextBarDivider />
          <ContextButtonClose variant="compact" />
        </ContextBar>
      </ContextAnimatePresence>
    </ContextBody>
  )
}
