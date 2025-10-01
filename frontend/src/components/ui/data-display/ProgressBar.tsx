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
import { AnimatePresence, m } from 'framer-motion'
import React, { memo, useEffect, useState } from 'react'

export const ProgressBar: React.FC<{ percentage: number; label: string }> = memo(
  ({ percentage, label }) => {
    const [showExplosion, setShowExplosion] = useState(false)
    const [prevPercentage, setPrevPercentage] = useState(percentage)

    const normalizedPercentage = Math.min(percentage, 100)
    const overflowPercentage = Math.max(0, percentage - 100)

    // Calculate delays: overflow bar starts after main bar completes
    const mainBarDuration = 1
    const overflowBarDelay = normalizedPercentage === 100 ? mainBarDuration : 0

    useEffect(() => {
      // Show explosion when crossing 100% threshold
      if (prevPercentage < 100 && percentage >= 100) {
        setShowExplosion(true)
        setTimeout(() => setShowExplosion(false), 1000)
      }
      setPrevPercentage(percentage)
    }, [percentage, prevPercentage])

    return (
      <div className="relative w-full">
        <ToolTip toolTipContent={label}>
          <div className="space-y-[2px]">
            {/* Main progress bar */}
            <div className="bg-base-content/25 relative h-[5px] w-full overflow-visible text-[10px]">
              <div className="absolute inset-0 overflow-hidden">
                <m.div
                  className="bg-secondary dark:bg-base-content/75 h-full max-w-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${normalizedPercentage}%` }}
                  transition={{ duration: mainBarDuration, ease: 'easeInOut' }}
                  style={{ willChange: 'width' }}
                />
              </div>
              {/* Star explosion */}
              <AnimatePresence>
                {showExplosion && (
                  <m.div
                    className="absolute top-1/2 right-0 z-10 -translate-y-1/2"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: [0, 1.5, 0], rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-secondary">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            {/* Overflow bar - always shows background, fill only when > 100% */}
            <div className="bg-base-content/15 h-[3px] w-full overflow-hidden">
              {percentage > 100 && (
                <m.div
                  className="bg-error h-full max-w-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(overflowPercentage, 100)}%` }}
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
