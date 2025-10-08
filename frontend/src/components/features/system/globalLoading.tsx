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

import { LasiusIcon } from 'components/ui/icons/LasiusIcon'
import { AnimatePresence, m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGlobalLoading } from 'stores/uiStore'

const SHOW_DELAY = 200 // ms - delay before showing spinner
const HIDE_DELAY = 300 // ms - delay before hiding spinner

export const GlobalLoading = () => {
  const isLoading = useGlobalLoading()
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    if (isLoading) {
      // Clear any pending hide timer
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }

      // Delay showing the spinner to avoid flicker for quick requests
      showTimer = setTimeout(() => {
        setShouldShow(true)
      }, SHOW_DELAY)
    } else {
      // Clear any pending show timer
      if (showTimer) {
        clearTimeout(showTimer)
        showTimer = null
      }

      // If spinner is visible, delay hiding it to avoid flicker
      if (shouldShow) {
        hideTimer = setTimeout(() => {
          setShouldShow(false)
        }, HIDE_DELAY)
      }
    }

    return () => {
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [isLoading, shouldShow])

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <m.div
          key="spinner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 left-4 z-[9999]">
          <div className="animate-pulse">
            <LasiusIcon size={24} className="text-base-content/25" />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
