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

import { ImporterTypeBadge } from 'components/features/issue-importers/shared/ImporterTypeBadge'
import { Button } from 'components/primitives/buttons/Button'
import { Card, CardBody } from 'components/ui/cards/Card'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { FolderTree, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsUserStub } from 'lib/api/lasius'

type Props = {
  type: ImporterType
  name: string
  baseUrl: string
  projectCount: number
  createdBy?: string | ModelsUserStub
  onEdit: () => void
  onDelete: () => void
  onViewMappings: () => void
}

export const ConfigListItem: React.FC<Props> = ({
  type,
  name,
  baseUrl,
  projectCount,
  createdBy,
  onEdit,
  onDelete,
  onViewMappings,
}) => {
  const { t } = useTranslation('integrations')

  const noun =
    projectCount === 1
      ? t('issueImporters.configListItem.project', { defaultValue: 'project' })
      : t('issueImporters.configListItem.projects', { defaultValue: 'projects' })

  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-base font-semibold">{name}</h3>
              <ImporterTypeBadge type={type} />
            </div>
            <p className="text-base-content/70 mb-1 text-sm">{baseUrl}</p>
            <div className="text-base-content/60 flex flex-wrap items-center gap-x-2 text-xs">
              <span>
                {t('issueImporters.configListItem.usedBy', {
                  count: projectCount,
                  noun,
                  defaultValue: '{{count}} {{noun}}',
                })}
              </span>
              {createdBy && (
                <>
                  <span>•</span>
                  <span>{typeof createdBy === 'string' ? createdBy : createdBy.key}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onViewMappings}
              title={t('issueImporters.actions.viewMappings', {
                defaultValue: 'View project mappings',
              })}>
              <LucideIcon icon={FolderTree} size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onEdit}
              title={t('issueImporters.actions.edit', { defaultValue: 'Edit configuration' })}>
              <LucideIcon icon={Pencil} size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onDelete}
              disabled={projectCount > 0}
              title={t('issueImporters.actions.delete', { defaultValue: 'Delete configuration' })}>
              <LucideIcon icon={Trash2} size={16} />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
