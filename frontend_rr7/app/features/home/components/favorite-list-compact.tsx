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

import { AnimateList } from '~/components/ui/animations/animate-list'
import { ContextMenuProvider } from '~/features/context-menu/hooks/use-context-menu'
import { stringHash } from '~/lib/utils/string-hash'
import { type ModelsBookingStub } from '~/services/api/lasius'

import { EmptyStateFavorites } from './empty-state-favorites'
import { FavoriteItem } from './favorite-item'

type Props = {
  favorites: ModelsBookingStub[]
  selectedOrgId: string
}

export const FavoriteListCompact = ({ favorites, selectedOrgId }: Props) => {
  const hasNoData = !favorites || favorites.length === 0

  return (
    <ContextMenuProvider>
      <div className="flex w-full flex-col px-3 select-none">
        {hasNoData ? (
          <EmptyStateFavorites />
        ) : (
          <AnimateList>
            {favorites.map((item) => (
              <FavoriteItem
                item={item}
                key={stringHash(item)}
                selectedOrgId={selectedOrgId}
              />
            ))}
          </AnimateList>
        )}
      </div>
    </ContextMenuProvider>
  )
}
