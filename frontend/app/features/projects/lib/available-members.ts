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

import { orderBy } from 'es-toolkit'

import { type ModelsUserStub } from '~/services/api/lasius'

export type MemberListView = 'empty' | 'list' | 'loading'

/**
 * Returns the organisation users that are not in the project and were not added in this session.
 * The result is sorted by last name, then by first name.
 */
export const selectAvailableMembers = (
  orgUsers: ModelsUserStub[],
  projectUserIds: ReadonlySet<string>,
  addedUserIds: ReadonlySet<string>,
): ModelsUserStub[] =>
  orderBy(
    orgUsers.filter((u) => !projectUserIds.has(u.id) && !addedUserIds.has(u.id)),
    [(u) => u.lastName, (u) => u.firstName],
    ['asc', 'asc'],
  )

/** Returns which state the member list shows. */
export const getMemberListView = (isLoading: boolean, memberCount: number): MemberListView => {
  if (isLoading) {
    return 'loading'
  }
  return memberCount === 0 ? 'empty' : 'list'
}
