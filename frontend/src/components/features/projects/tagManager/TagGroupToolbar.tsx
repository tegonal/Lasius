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
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onAddGroup: () => void
  onAddPresets: () => void
  onToggleAll: () => void
  showToggleAll: boolean
  allExpanded: boolean
}

export const TagGroupToolbar: React.FC<Props> = ({
  onAddGroup,
  onAddPresets,
  onToggleAll,
  showToggleAll,
  allExpanded,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className="mb-4 flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onAddGroup} fullWidth={false}>
          {t('tags.actions.addTagGroup', { defaultValue: 'Add tag group' })}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAddPresets}
          fullWidth={false}>
          {t('tags.actions.addDefaultTagGroups', {
            defaultValue: 'Add default tag groups',
          })}
        </Button>
      </div>
      {showToggleAll && (
        <Button
          type="button"
          variant="ghost"
          shape="circle"
          size="sm"
          onClick={onToggleAll}
          title={
            allExpanded
              ? t('tags.actions.collapseAll', { defaultValue: 'Collapse all' })
              : t('tags.actions.expandAll', { defaultValue: 'Expand all' })
          }
          fullWidth={false}>
          <LucideIcon icon={allExpanded ? ChevronsDownUp : ChevronsUpDown} size={20} />
        </Button>
      )}
    </div>
  )
}
