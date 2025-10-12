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

import { useEffect, useId, useState } from 'react'
import { useTabViews, useUIActions } from 'stores/uiStore'

/**
 * Custom hook to synchronize tab state with the UI store
 * Handles initialization and syncing of active tab index
 */
export const useTabSync = (initialTab: number = 0) => {
  const tabViews = useTabViews()
  const { setTabActive } = useUIActions()
  const tabId = useId()
  const [selected, setSelected] = useState(initialTab)

  useEffect(() => {
    // Always set the initial tab on mount, even if it exists in store
    // This ensures defaultIndex is respected on each page visit
    setTabActive(tabId, initialTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tabView = tabViews.find((tab) => tab.id === tabId)
    if (tabView) {
      setSelected(tabView.activeIndex)
    }
  }, [tabViews, tabId])

  const handleTabClick = (index: number) => {
    setTabActive(tabId, index)
  }

  return {
    selected,
    tabId,
    handleTabClick,
    setSelected,
  }
}
