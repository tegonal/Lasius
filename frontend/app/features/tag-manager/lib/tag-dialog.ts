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

/** The one dialog that the tag form shows on top of itself, or null. */
export type TagDialog =
  | null
  | { groupIndex: number; groupName: string; kind: 'deleteGroup' }
  | { groupIndex: number; kind: 'addTag' }
  | { kind: 'addGroup' }
  | { kind: 'cancel' }

/** Which dialog is open. The delete dialog needs the name of the group, so it gives the name. */
export const getTagDialogFlags = (dialog: TagDialog) => ({
  deleteGroupName: dialog?.kind === 'deleteGroup' ? dialog.groupName : null,
  isAddGroupOpen: dialog?.kind === 'addGroup',
  isAddTagOpen: dialog?.kind === 'addTag',
  isCancelOpen: dialog?.kind === 'cancel',
})
