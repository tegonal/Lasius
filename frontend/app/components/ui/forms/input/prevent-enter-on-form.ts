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

import type React from 'react'

// Enter in an input field submits the surrounding form implicitly, so the handler cancels it there.
// Enter on a button still activates the button, and Enter in a textarea still adds a line.
export const preventEnterOnForm = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault()
}
