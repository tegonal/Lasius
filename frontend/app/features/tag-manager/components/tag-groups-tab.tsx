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

import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { sortTagGroupsById } from '~/features/tag-manager/lib/project-tag-form'
import { type ModelsSimpleTag } from '~/services/api/lasius/modelsSimpleTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'

import { TagGroupEmptyState } from './tag-group-empty-state'
import { TagGroupItem } from './tag-group-item'
import { TagGroupToolbar } from './tag-group-toolbar'

interface TagGroupsTabProperties {
  copiedFromGroupId: null | string
  expandedGroups: Set<string>
  onAddGroup: () => void
  onAddPresets: () => void
  onAddTag: (groupIndex: number) => void
  onCollapseAll: () => void
  onCopyTags: (group: ModelsTagGroup) => void
  onDeleteGroup: (groupIndex: number, groupName: string) => void
  onExpandAll: () => void
  onPasteTags: (groupIndex: number) => void
  onTagsChange: (groupIndex: number, tags: ModelsSimpleTag[]) => void
  onToggleGroup: (groupId: string) => void
  tagGroups: ModelsTagGroup[]
}

export const TagGroupsTab = ({
  copiedFromGroupId,
  expandedGroups,
  onAddGroup,
  onAddPresets,
  onAddTag,
  onCollapseAll,
  onCopyTags,
  onDeleteGroup,
  onExpandAll,
  onPasteTags,
  onTagsChange,
  onToggleGroup,
  tagGroups,
}: TagGroupsTabProperties) => {
  const sortedTagGroups = sortTagGroupsById(tagGroups)
  const isAllExpanded = expandedGroups.size === sortedTagGroups.length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TagGroupToolbar
        allExpanded={isAllExpanded}
        onAddGroup={onAddGroup}
        onAddPresets={onAddPresets}
        onToggleAll={isAllExpanded ? onCollapseAll : onExpandAll}
        showToggleAll={sortedTagGroups.length > 0}
      />

      <ModalBody className="min-h-0 flex-1 pr-2">
        <div className="space-y-2 pb-4">
          {sortedTagGroups.length === 0 && <TagGroupEmptyState />}

          {sortedTagGroups.map((tagGroup) => {
            // The handlers address a group by its index in the unsorted state array.
            const index = tagGroups.findIndex((g) => g.id === tagGroup.id)
            return (
              <TagGroupItem
                isExpanded={expandedGroups.has(tagGroup.id)}
                key={tagGroup.id}
                onAddTag={() => onAddTag(index)}
                onCopyTags={() => onCopyTags(tagGroup)}
                onDelete={() => onDeleteGroup(index, tagGroup.id)}
                onPasteTags={() => onPasteTags(index)}
                onTagsChange={(tags) => onTagsChange(index, tags as ModelsSimpleTag[])}
                onToggle={() => onToggleGroup(tagGroup.id)}
                showPasteButton={copiedFromGroupId !== null && copiedFromGroupId !== tagGroup.id}
                tagGroup={tagGroup}
              />
            )
          })}
        </div>
      </ModalBody>
    </div>
  )
}
