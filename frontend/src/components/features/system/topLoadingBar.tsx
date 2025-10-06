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
import { useEffect, useMemo, useState } from 'react'
import { useGlobalLoading } from 'stores/uiStore'
import { nivoPalette } from 'styles/colors'

const SHOW_DELAY = 100 // ms - delay before showing progress bar
const MIN_INCREMENT = 5 // Minimum % to increment per tick
const MAX_INCREMENT = 15 // Maximum % to increment per tick
const TICK_INTERVAL = 300 // ms between progress increments
const MAX_PROGRESS = 90 // Don't go above 90% until actually complete
const GRADIENT_ANIMATION_DURATION = 3 // seconds for gradient animation loop

// Pick 3 random colors from the nivo palette for the gradient
const getRandomGradientColors = () => {
  const shuffled = [...nivoPalette].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1], shuffled[2]]
}

export const TopLoadingBar = () => {
  const isLoading = useGlobalLoading()
  const [shouldShow, setShouldShow] = useState(false)
  const [progress, setProgress] = useState(0)

  // Generate random gradient colors once when component mounts or when loading starts
  const gradientColors = useMemo(() => getRandomGradientColors(), [])

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let progressTimer: ReturnType<typeof setInterval> | null = null

    if (isLoading) {
      // Reset progress and delay showing the bar
      setProgress(0)

      showTimer = setTimeout(() => {
        setShouldShow(true)

        // Start incrementing progress randomly
        progressTimer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= MAX_PROGRESS) {
              return prev // Stay at MAX_PROGRESS until loading completes
            }

            // Random increment between MIN and MAX
            const increment =
              Math.floor(Math.random() * (MAX_INCREMENT - MIN_INCREMENT + 1)) + MIN_INCREMENT

            // Use exponential slowdown as we approach MAX_PROGRESS
            const slowdownFactor = 1 - prev / MAX_PROGRESS
            const adjustedIncrement = increment * slowdownFactor

            const nextProgress = Math.min(prev + adjustedIncrement, MAX_PROGRESS)
            return nextProgress
          })
        }, TICK_INTERVAL)
      }, SHOW_DELAY)
    } else {
      // Clear any pending show timer
      if (showTimer) {
        clearTimeout(showTimer)
        showTimer = null
      }

      // Clear progress timer
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }

      // Complete the progress bar when loading finishes
      if (shouldShow) {
        setProgress(100)

        // Hide after a short delay to show completion
        const hideTimer = setTimeout(() => {
          setShouldShow(false)
          setProgress(0)
        }, 400)

        return () => clearTimeout(hideTimer)
      }
    }

    return () => {
      if (showTimer) clearTimeout(showTimer)
      if (progressTimer) clearInterval(progressTimer)
    }
  }, [isLoading, shouldShow])

  return (
    <>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
      <AnimatePresence mode="wait">
        {shouldShow && (
          <m.div
            key="progress-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 right-0 left-0 z-[9999] h-1">
            <m.div
              className="h-full shadow-lg"
              initial={{ width: '0%' }}
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                width: { duration: 0.3, ease: 'easeOut' },
              }}
              style={{
                background: `linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]}, ${gradientColors[2]})`,
                backgroundSize: '200% 100%',
                animation: `gradientShift ${GRADIENT_ANIMATION_DURATION}s ease-in-out infinite`,
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
