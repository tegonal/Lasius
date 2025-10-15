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

import { ToolTip } from 'components/ui/feedback/Tooltip'
import { m } from 'framer-motion'
import { logger } from 'lib/logger'
import React, { memo, useEffect, useRef, useState } from 'react'
import { useGlobalLoading, useUIStore } from 'stores/uiStore'

export const ProgressBar: React.FC<{ percentage: number; label: string }> = memo(
  ({ percentage, label }) => {
    const globalLoading = useGlobalLoading()
    const triggerExplosion = useUIStore((state) => state.triggerExplosion)
    const [displayPercentage, setDisplayPercentage] = useState(percentage)
    const progressBarRef = useRef<HTMLDivElement>(null)
    const progressBarFillRef = useRef<HTMLDivElement>(null)
    const hasTriggeredExplosionRef = useRef(false)

    // Update display percentage only when not loading
    useEffect(() => {
      if (!globalLoading) {
        setDisplayPercentage(percentage)
        // Reset explosion trigger flag when percentage changes
        hasTriggeredExplosionRef.current = false
      }
    }, [globalLoading, percentage])

    const handleExplosion = () => {
      if (progressBarFillRef.current && !hasTriggeredExplosionRef.current) {
        // Get the bounding rect of the actual filled bar (not the container)
        const fillRect = progressBarFillRef.current.getBoundingClientRect()
        // Position at the right edge, vertically centered
        const x = fillRect.right
        const y = fillRect.top + fillRect.height / 2

        // Only trigger if we have valid coordinates
        if (x > 0 && y > 0) {
          logger.info('ProgressBar explosion coords:', { x, y, fillRect })
          triggerExplosion(x, y)
          hasTriggeredExplosionRef.current = true
        } else {
          logger.info('ProgressBar skipping invalid coords:', { x, y, fillRect })
        }
      }
    }

    // Cap visual percentage to prevent "looks full but isn't"
    const visualPercentage = displayPercentage >= 100 ? 100 : Math.min(displayPercentage, 97)
    const normalizedDisplayPercentage = Math.min(visualPercentage, 100)
    const overflowDisplayPercentage = Math.max(0, displayPercentage - 100)

    // Calculate delays: overflow bar starts after main bar completes
    const mainBarDuration = 1
    const overflowBarDelay = normalizedDisplayPercentage === 100 ? mainBarDuration : 0

    return (
      <div ref={progressBarRef} className="relative w-full">
        <ToolTip toolTipContent={label}>
          <div className="space-y-[2px]">
            {/* Main progress bar */}
            <div className="bg-base-content/25 relative h-[5px] w-full overflow-visible text-[10px]">
              <div className="absolute inset-0 overflow-hidden">
                <m.div
                  ref={progressBarFillRef}
                  className="bg-secondary dark:bg-base-content/75 h-full max-w-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${normalizedDisplayPercentage}%` }}
                  transition={{ duration: mainBarDuration, ease: 'easeInOut' }}
                  style={{ willChange: 'width' }}
                  onAnimationComplete={() => {
                    // Trigger explosion after animation completes if at 100% and not yet triggered
                    if (normalizedDisplayPercentage === 100) {
                      handleExplosion()
                    }
                  }}
                />
              </div>
            </div>
            {/* Overflow bar - always shows background, fill only when > 100% */}
            <div className="bg-base-content/15 h-[3px] w-full overflow-hidden">
              {displayPercentage > 100 && (
                <m.div
                  className="bg-warning h-full max-w-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(overflowDisplayPercentage, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeInOut', delay: overflowBarDelay }}
                  style={{ willChange: 'width' }}
                />
              )}
            </div>
          </div>
        </ToolTip>
      </div>
    )
  },
)
