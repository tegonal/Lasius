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

import { ContextButtonClose } from 'components/features/contextMenu/buttons/contextButtonClose'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextAnimatePresence } from 'components/features/contextMenu/contextAnimatePresence'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextBody } from 'components/features/contextMenu/contextBody'
import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { AnimatePresence } from 'framer-motion'
import { FolderTree, Info, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  configId: string
  projectCount: number
  onEdit: () => void
  onViewMappings: () => void
  onViewInfo: () => void
  onDelete: () => void
}

export const IntegrationConfigItemContext: React.FC<Props> = ({
  configId,
  projectCount,
  onEdit,
  onViewMappings,
  onViewInfo,
  onDelete,
}) => {
  const { t } = useTranslation('integrations')
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()

  const handleEdit = () => {
    handleCloseAll()
    onEdit()
  }

  const handleViewMappings = () => {
    handleCloseAll()
    onViewMappings()
  }

  const handleViewInfo = () => {
    handleCloseAll()
    onViewInfo()
  }

  const handleDelete = () => {
    handleCloseAll()
    onDelete()
  }

  return (
    <ContextBody variant="compact">
      <ContextButtonOpen hash={configId} />
      <AnimatePresence>
        {currentOpenContextMenuId === configId && (
          <ContextAnimatePresence variant="compact">
            <ContextBar>
              <ContextButtonWrapper variant="compact">
                <Button
                  variant="contextIcon"
                  onClick={handleViewInfo}
                  fullWidth={false}
                  shape="circle"
                  title={t('issueImporters.actions.viewInfo', {
                    defaultValue: 'View configuration info',
                  })}>
                  <LucideIcon icon={Info} size={24} />
                </Button>
              </ContextButtonWrapper>
              <ContextButtonWrapper variant="compact">
                <Button
                  variant="contextIcon"
                  onClick={handleEdit}
                  fullWidth={false}
                  shape="circle"
                  title={t('issueImporters.actions.edit', { defaultValue: 'Edit configuration' })}>
                  <LucideIcon icon={Pencil} size={24} />
                </Button>
              </ContextButtonWrapper>
              <ContextButtonWrapper variant="compact">
                <Button
                  variant="contextIcon"
                  onClick={handleViewMappings}
                  fullWidth={false}
                  shape="circle"
                  title={t('issueImporters.actions.viewMappings', {
                    defaultValue: 'View project mappings',
                  })}>
                  <LucideIcon icon={FolderTree} size={24} />
                </Button>
              </ContextButtonWrapper>
              <ContextButtonWrapper variant="compact">
                {projectCount > 0 ? (
                  <ToolTip
                    toolTipContent={t('issueImporters.actions.deleteDisabled', {
                      defaultValue: 'Cannot delete: remove all project mappings first',
                    })}
                    placement="top">
                    <Button
                      variant="contextIcon"
                      onClick={handleDelete}
                      fullWidth={false}
                      shape="circle"
                      disabled>
                      <LucideIcon icon={Trash2} size={24} />
                    </Button>
                  </ToolTip>
                ) : (
                  <Button
                    variant="contextIcon"
                    onClick={handleDelete}
                    fullWidth={false}
                    shape="circle"
                    title={t('issueImporters.actions.delete', {
                      defaultValue: 'Delete configuration',
                    })}>
                    <LucideIcon icon={Trash2} size={24} />
                  </Button>
                )}
              </ContextButtonWrapper>
              <ContextBarDivider />
              <ContextButtonClose variant="compact" />
            </ContextBar>
          </ContextAnimatePresence>
        )}
      </AnimatePresence>
    </ContextBody>
  )
}
