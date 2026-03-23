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

import { FolderTree, Info, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { ContextButtonClose } from '~/features/context-menu/buttons/context-button-close'
import { ContextButtonOpen } from '~/features/context-menu/buttons/context-button-open'
import { ContextAnimatePresence } from '~/features/context-menu/context-animate-presence'
import { ContextBar } from '~/features/context-menu/context-bar'
import { ContextBarDivider } from '~/features/context-menu/context-bar-divider'
import { ContextBody } from '~/features/context-menu/context-body'
import { ContextButtonWrapper } from '~/features/context-menu/context-button-wrapper'
import { useContextMenu } from '~/features/context-menu/hooks/use-context-menu'

type Props = {
  configId: string
  onDelete: () => void
  onEdit: () => void
  onViewInfo: () => void
  onViewMappings: () => void
  projectCount: number
}

export const IntegrationConfigItemContext = ({
  configId,
  onDelete,
  onEdit,
  onViewInfo,
  onViewMappings,
  projectCount,
}: Props) => {
  const { t } = useTranslation('integrations')
  const { currentOpenContextMenuId, handleCloseAll } = useContextMenu()

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

  const hasProjects = projectCount > 0

  return (
    <ContextBody variant="compact">
      <ContextButtonOpen hash={configId} />
      {currentOpenContextMenuId === configId && (
        <ContextAnimatePresence variant="compact">
          <ContextBar>
            <ContextButtonWrapper variant="compact">
              <Button
                aria-label={t('issueImporters.actions.viewInfo', {
                  defaultValue: 'View configuration info',
                })}
                fullWidth={false}
                onClick={handleViewInfo}
                shape="circle"
                title={t('issueImporters.actions.viewInfo', {
                  defaultValue: 'View configuration info',
                })}
                variant="contextIcon"
              >
                <LucideIcon icon={Info} size={24} />
              </Button>
            </ContextButtonWrapper>
            <ContextButtonWrapper variant="compact">
              <Button
                aria-label={t('issueImporters.actions.edit', {
                  defaultValue: 'Edit configuration',
                })}
                fullWidth={false}
                onClick={handleEdit}
                shape="circle"
                title={t('issueImporters.actions.edit', {
                  defaultValue: 'Edit configuration',
                })}
                variant="contextIcon"
              >
                <LucideIcon icon={Pencil} size={24} />
              </Button>
            </ContextButtonWrapper>
            <ContextButtonWrapper variant="compact">
              <Button
                aria-label={t('issueImporters.actions.viewMappings', {
                  defaultValue: 'View project mappings',
                })}
                fullWidth={false}
                onClick={handleViewMappings}
                shape="circle"
                title={t('issueImporters.actions.viewMappings', {
                  defaultValue: 'View project mappings',
                })}
                variant="contextIcon"
              >
                <LucideIcon icon={FolderTree} size={24} />
              </Button>
            </ContextButtonWrapper>
            <ContextButtonWrapper variant="compact">
              {hasProjects ? (
                <div
                  className="tooltip"
                  data-tip={t('issueImporters.actions.deleteDisabled', {
                    defaultValue:
                      'Cannot delete: remove all project mappings first',
                  })}
                >
                  <Button
                    aria-label={t('issueImporters.actions.delete', {
                      defaultValue: 'Delete configuration',
                    })}
                    disabled
                    fullWidth={false}
                    onClick={handleDelete}
                    shape="circle"
                    variant="contextIcon"
                  >
                    <LucideIcon icon={Trash2} size={24} />
                  </Button>
                </div>
              ) : (
                <Button
                  aria-label={t('issueImporters.actions.delete', {
                    defaultValue: 'Delete configuration',
                  })}
                  fullWidth={false}
                  onClick={handleDelete}
                  shape="circle"
                  title={t('issueImporters.actions.delete', {
                    defaultValue: 'Delete configuration',
                  })}
                  variant="contextIcon"
                >
                  <LucideIcon icon={Trash2} size={24} />
                </Button>
              )}
            </ContextButtonWrapper>
            <ContextBarDivider />
            <ContextButtonClose variant="compact" />
          </ContextBar>
        </ContextAnimatePresence>
      )}
    </ContextBody>
  )
}
