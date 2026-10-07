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

import { type ModelsUserStub } from '~/services/api/lasius'

// Without a name in the user stub, the user key "jane.doe" gives "jane" and "doe".
export const resolveAvatarName = (
  userKey: string,
  user: Pick<ModelsUserStub, 'firstName' | 'lastName'> | undefined,
): { firstName: string; lastName: string } => {
  const [keyFirst, keyLast] = userKey.split('.', 2)
  return {
    firstName: user?.firstName || keyFirst || userKey[0] || '',
    lastName: user?.lastName || keyLast || userKey[1] || '',
  }
}
