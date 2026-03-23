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

import { isInteger, padStart, round } from 'es-toolkit/compat'
import { useEffect, useRef } from 'react'

import { countDecimals } from '~/lib/utils/data/count-decimals'

type Props = {
  from: number
  leftpad?: number
  to: number
}

const formatNumber = (value: number, from: number, to: number) =>
  round(
    value,
    isInteger(to) ? (to === 0 ? countDecimals(from) : 0) : countDecimals(to),
  )

const formatNumberLeftpadded = (
  value: number,
  from: number,
  to: number,
  leftpad: number,
) => padStart(formatNumber(value, from, to).toString(), 1 + leftpad, '0')

const DURATION_MS = 330

/**
 * AnimateNumber component: Animates a number from one value to another.
 * Uses requestAnimationFrame with ease-out cubic easing.
 * @param from
 * @param to
 * @param leftpad
 */
export const AnimateNumber = ({ from, leftpad = 0, to }: Props) => {
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const startTime = performance.now()
    let rafId: number

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / DURATION_MS, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (to - from) * eased

      node.textContent =
        leftpad > 0
          ? formatNumberLeftpadded(value, from, to, leftpad)
          : formatNumber(value, from, to).toString()

      if (progress < 1) {
        rafId = requestAnimationFrame(update)
      }
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [from, leftpad, to])

  return <span ref={nodeRef} />
}
