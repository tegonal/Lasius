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

import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

export const RouteProgressBar = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true)
      setProgress(0)

      // Start random progress animation
      let currentProgress = 0
      intervalRef.current = setInterval(() => {
        currentProgress += Math.random() * 30
        // Cap at 90% to leave room for completion
        if (currentProgress > 90) {
          currentProgress = 90
        }
        setProgress(currentProgress)
      }, 300)
    }

    const handleComplete = () => {
      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Complete the progress
      setProgress(100)

      // Hide after animation completes
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 300)
    }

    const handleError = () => {
      handleComplete()
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleError)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleError)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [router])

  if (!isLoading && progress === 0) {
    return null
  }

  return (
    <div
      className="bg-base-100 fixed top-0 right-0 left-0 z-[9999] h-1"
      style={{
        opacity: isLoading || progress > 0 ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
      }}>
      <div
        className="bg-secondary/50 h-full"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 200ms ease-out' : 'width 300ms ease-in-out',
        }}
      />
    </div>
  )
}
