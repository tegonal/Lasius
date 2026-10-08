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

import { describe, expect, it } from 'vitest'

import { getTagDialogFlags } from './tag-dialog'

const closed = {
  deleteGroupName: null,
  isAddGroupOpen: false,
  isAddTagOpen: false,
  isCancelOpen: false,
}

describe('getTagDialogFlags', () => {
  it('opens no dialog without a dialog', () => {
    expect(getTagDialogFlags(null)).toEqual(closed)
  })

  it('opens exactly the requested dialog', () => {
    expect(getTagDialogFlags({ kind: 'addGroup' })).toEqual({ ...closed, isAddGroupOpen: true })
    expect(getTagDialogFlags({ groupIndex: 1, kind: 'addTag' })).toEqual({
      ...closed,
      isAddTagOpen: true,
    })
    expect(getTagDialogFlags({ kind: 'cancel' })).toEqual({ ...closed, isCancelOpen: true })
  })

  it('gives the group name for the delete dialog', () => {
    expect(getTagDialogFlags({ groupIndex: 2, groupName: 'Design', kind: 'deleteGroup' })).toEqual({
      ...closed,
      deleteGroupName: 'Design',
    })
  })

  it('keeps an empty group name for the delete dialog', () => {
    expect(
      getTagDialogFlags({ groupIndex: 2, groupName: '', kind: 'deleteGroup' }).deleteGroupName,
    ).toBe('')
  })
})
