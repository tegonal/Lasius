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

import { type UIEvent, useState } from 'react'

/** The number of items to show after a scroll, or null when the number stays. */
export const getNextShownCount = ({
  remainingScroll,
  scrollBeforeEnd,
  shown,
  step,
  total,
}: {
  remainingScroll: number
  scrollBeforeEnd: number
  shown: number
  step: number
  total: number
}): null | number => {
  if (remainingScroll >= scrollBeforeEnd || total <= shown) return null
  const next = Math.min(shown + step, total)
  return next > shown ? next : null
}

interface UseScrollPagination<E> {
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  visibleElements: E[]
}

/**
 * Custom hook for implementing infinite scroll pagination with virtual scrolling.
 * Progressively loads more items as the user scrolls near the bottom of a container.
 *
 * @template E - The type of elements in the array
 * @param elements - The complete array of elements to paginate
 * @param showItemsPerStep - Number of items to load per pagination step (default: 30)
 * @param scrollBeforeEnd - Pixel threshold from bottom to trigger next load (default: 50)
 * @returns Object containing:
 *   - onScroll: Event handler to attach to the scrollable container
 *   - visibleElements: Subset of elements currently visible/loaded
 *
 * @example
 * const { onScroll, visibleElements } = useScrollPagination(items, 50, 100)
 *
 * return (
 *   <div onScroll={onScroll} style={{ height: '500px', overflow: 'auto' }}>
 *     {visibleElements.map(item => <Item key={item.id} {...item} />)}
 *   </div>
 * )
 */
export const useScrollPagination = <E>(
  elements: E[],
  showItemsPerStep = 30,
  scrollBeforeEnd = 50,
): UseScrollPagination<E> => {
  const [shownNumberOfItems, setShownNumberOfItems] = useState(showItemsPerStep)

  // Show the first step again when the list length or the step size changes
  const [paginationSource, setPaginationSource] = useState({
    length: elements.length,
    step: showItemsPerStep,
  })
  if (paginationSource.length !== elements.length || paginationSource.step !== showItemsPerStep) {
    setPaginationSource({ length: elements.length, step: showItemsPerStep })
    setShownNumberOfItems(showItemsPerStep)
  }

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!event.target) return
    const { clientHeight, scrollHeight, scrollTop } = event.target as HTMLDivElement
    const nextCount = getNextShownCount({
      remainingScroll: scrollHeight - scrollTop - clientHeight,
      scrollBeforeEnd,
      shown: shownNumberOfItems,
      step: showItemsPerStep,
      total: elements.length,
    })
    if (nextCount !== null) setShownNumberOfItems(nextCount)
  }

  return { onScroll, visibleElements: elements.slice(0, shownNumberOfItems) }
}
