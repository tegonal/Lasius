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

import { noop } from 'es-toolkit/compat'
import {
  ChevronDown,
  ChevronUp,
  Clipboard,
  Copy,
  Plus,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Badge } from '~/components/ui/data-display/badge'
import { Tag } from '~/components/ui/data-display/tag-list'
import { InputTagsAdmin } from '~/components/ui/forms/input/input-tags-admin'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type ModelsTag } from '~/services/api/lasius/modelsTag'
import { type ModelsTagGroup } from '~/services/api/lasius/modelsTagGroup'

type Props = {
  isExpanded: boolean
  onAddTag: () => void
  onCopyTags: () => void
  onDelete: () => void
  onPasteTags: () => void
  onTagsChange: (tags: ModelsTag[]) => void
  onToggle: () => void
  showPasteButton: boolean
  tagGroup: ModelsTagGroup
}

export const TagGroupItem = ({
  isExpanded,
  onAddTag,
  onCopyTags,
  onDelete,
  onPasteTags,
  onTagsChange,
  onToggle,
  showPasteButton,
  tagGroup,
}: Props) => {
  const { t } = useTranslation('tag-manager')

  return (
    <div className="bg-base-200 group border-base-300 overflow-hidden rounded-lg border">
      {/* Group Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          className="hover:text-primary flex min-w-0 flex-shrink items-center gap-2 text-left transition-colors"
          onClick={onToggle}
          type="button"
        >
          <LucideIcon
            className="text-base-content/60 flex-shrink-0"
            icon={isExpanded ? ChevronUp : ChevronDown}
            size={20}
          />
          <div className="pointer-events-none min-w-0 flex-shrink">
            <Tag clickHandler={noop} hideRemoveIcon item={tagGroup} />
          </div>
        </button>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <Button
            className="text-error hover:bg-error/10 opacity-0 transition-opacity group-hover:opacity-100"
            fullWidth={false}
            onClick={onDelete}
            shape="circle"
            size="sm"
            type="button"
            variant="ghost"
          >
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
            <InputTagsAdmin
              hideAddButton
              onTagsChange={onTagsChange}
              tags={tagGroup.relatedTags || []}
            />
          </div>

          {/* Column 2: Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              fullWidth={false}
              onClick={onAddTag}
              shape="circle"
              size="sm"
              title={t('actions.addTag', 'Add a tag')}
              type="button"
              variant="secondary"
            >
              <LucideIcon icon={Plus} size={18} />
            </Button>
            <Button
              fullWidth={false}
              onClick={onCopyTags}
              shape="circle"
              size="sm"
              title={t('actions.copyTags', 'Copy tags')}
              type="button"
              variant="ghost"
            >
              <LucideIcon icon={Copy} size={18} />
            </Button>
            {showPasteButton && (
              <Button
                fullWidth={false}
                onClick={onPasteTags}
                shape="circle"
                size="sm"
                title={t('actions.pasteTags', 'Paste tags')}
                type="button"
                variant="ghost"
              >
                <LucideIcon icon={Clipboard} size={18} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
