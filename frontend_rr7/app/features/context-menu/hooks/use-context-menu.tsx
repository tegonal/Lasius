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

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

type ContextMenuState = {
  currentOpenContextMenuId: null | string
  handleCloseAll: () => void
  handleOpenContextMenu: (hash: string) => void
}

const ContextMenuContext = createContext<ContextMenuState | null>(null)

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const [currentOpenContextMenuId, setCurrentOpenContextMenuId] = useState<
    null | string
  >(null)

  const handleOpenContextMenu = useCallback((hash: string) => {
    setCurrentOpenContextMenuId(hash)
  }, [])

  const handleCloseAll = useCallback(() => {
    setCurrentOpenContextMenuId(null)
  }, [])

  return (
    <ContextMenuContext.Provider
      value={{
        currentOpenContextMenuId,
        handleCloseAll,
        handleOpenContextMenu,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  )
}

export const useContextMenu = (): ContextMenuState => {
  const context = useContext(ContextMenuContext)
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return context
}
