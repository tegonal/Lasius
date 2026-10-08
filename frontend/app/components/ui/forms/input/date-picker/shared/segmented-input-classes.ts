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

/**
 * The visibility classes of the increment and decrement arrows around a segmented input. The
 * arrows show while a segment is selected or the pointer is over the input.
 */
export const getArrowVisibilityClasses = (isVisible: boolean) =>
  isVisible
    ? {
        downButton: 'opacity-60 hover:opacity-100',
        downContainer: '',
        label: 'opacity-100',
        up: 'opacity-60 hover:opacity-100',
      }
    : {
        downButton: 'opacity-0',
        downContainer: 'pointer-events-none',
        label: 'opacity-0',
        up: 'pointer-events-none opacity-0',
      }
