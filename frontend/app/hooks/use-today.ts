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

import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { formatDateToURLParameter } from '~/lib/utils/dates'

/**
 * Today of the user as yyyy-MM-dd. The app-layout loader computes it in the zone of the tz cookie,
 * so the server render and the hydration agree. Outside app-layout, the browser clock decides.
 */
export const useToday = (): string =>
  useLayoutLoaderData()?.today ?? formatDateToURLParameter(new Date())
