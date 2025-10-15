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

import { AnimatePresence, m } from 'framer-motion'
import { logger } from 'lib/logger'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useExplosionEvent, useUIStore } from 'stores/uiStore'

export const BookingProgressBarExplosion: React.FC = () => {
  const explosionEvent = useExplosionEvent()
  const clearExplosion = useUIStore((state) => state.clearExplosion)
  const [activeExplosion, setActiveExplosion] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    if (explosionEvent) {
      logger.info('Explosion event received:', explosionEvent)
      // Set active explosion
      setActiveExplosion({
        id: explosionEvent.id,
        x: explosionEvent.x,
        y: explosionEvent.y,
      })

      // Clear after animation duration
      const timeout = setTimeout(() => {
        setActiveExplosion(null)
        clearExplosion()
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [explosionEvent, clearExplosion])

  if (!activeExplosion) return null

  return createPortal(
    <AnimatePresence>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const angle = (i * 360) / 10 + Math.random() * 30 - 15
        const distance = (20 + Math.random() * 20) * 1.33
        const size = 10 + Math.random() * 8
        const rotation = Math.random() * 1440 - 720

        return (
          <m.div
            key={`${activeExplosion.id}-${i}`}
            className="pointer-events-none fixed z-[9999]"
            style={{
              top: `${activeExplosion.y}px`,
              left: `${activeExplosion.x}px`,
            }}
            initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              rotate: rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}>
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-yellow-400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </m.div>
        )
      })}
    </AnimatePresence>,
    document.body,
  )
}
