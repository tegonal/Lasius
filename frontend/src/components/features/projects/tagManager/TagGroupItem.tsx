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

import { Button } from 'components/primitives/buttons/Button'
import { Badge } from 'components/ui/data-display/Badge'
import { Tag } from 'components/ui/data-display/TagList'
import { InputTagsAdmin2 } from 'components/ui/forms/input/InputTagsAdmin2'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { noop } from 'es-toolkit/compat'
import { ModelsTagGroup } from 'lib/api/lasius'
import { ChevronDown, ChevronUp, Clipboard, Copy, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  tagGroup: ModelsTagGroup
  index: number
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  onAddTag: () => void
  onCopyTags: () => void
  onPasteTags: () => void
  showPasteButton: boolean
}

export const TagGroupItem: React.FC<Props> = ({
  tagGroup,
  index,
  isExpanded,
  onToggle,
  onDelete,
  onAddTag,
  onCopyTags,
  onPasteTags,
  showPasteButton,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className="bg-base-200 group border-base-300 overflow-hidden rounded-lg border">
      {/* Group Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="hover:text-primary flex min-w-0 flex-shrink items-center gap-2 text-left transition-colors">
          <LucideIcon
            icon={isExpanded ? ChevronUp : ChevronDown}
            size={20}
            className="text-base-content/60 flex-shrink-0"
          />
          <div className="pointer-events-none min-w-0 flex-shrink">
            <Tag item={tagGroup} clickHandler={noop} hideRemoveIcon />
          </div>
        </button>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            shape="circle"
            fullWidth={false}
            onClick={onDelete}
            className="text-error hover:bg-error/10 opacity-0 transition-opacity group-hover:opacity-100">
            <LucideIcon icon={Trash2} size={18} />
          </Button>
          <Badge variant="muted">{tagGroup.relatedTags?.length || 0}</Badge>
        </div>
      </div>

      {/* Group Content - Collapsible */}
      {isExpanded && (
        <div className="bg-base-100 border-base-300 grid grid-cols-[1fr_auto] gap-4 border-t p-3">
          {/* Column 1: Tags */}
          <div className="min-w-0">
            <InputTagsAdmin2
              tags={tagGroup.relatedTags || []}
              name="tagGroups"
              tagGroupIndex={index}
              hideAddButton
            />
          </div>

          {/* Column 2: Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              shape="circle"
              fullWidth={false}
              onClick={onAddTag}
              title={t('tags.actions.addTag', { defaultValue: 'Add a tag' })}>
              <LucideIcon icon={Plus} size={18} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              shape="circle"
              fullWidth={false}
              onClick={onCopyTags}
              title={t('tags.actions.copyTags', { defaultValue: 'Copy tags' })}>
              <LucideIcon icon={Copy} size={18} />
            </Button>
            {showPasteButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                shape="circle"
                fullWidth={false}
                onClick={onPasteTags}
                title={t('tags.actions.pasteTags', { defaultValue: 'Paste tags' })}>
                <LucideIcon icon={Clipboard} size={18} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
