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
import { ManageProjectMembers } from 'components/features/projects/manageMembers'
import { ProjectAddUpdateForm } from 'components/features/projects/projectAddUpdateForm'
import { ProjectAddUpdateTagsForm } from 'components/features/projects/projectAddUpdateTagsForm'
import { Button } from 'components/primitives/buttons/Button'
import { ToolTip } from 'components/ui/feedback/Tooltip'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { ModalConfirmDeactivateProject } from 'components/ui/overlays/modal/ModalConfirmDeactivateProject'
import { AnimatePresence } from 'framer-motion'
import { ModelsProject } from 'lib/api/lasius'
import { deactivateProject, getGetProjectListKey } from 'lib/api/lasius/projects/projects'
import { Archive, List, Pencil, PieChart, Tags, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useSWRConfig } from 'swr'

type Props = {
  item: ModelsProject
}

export const AllProjectsListItemContext: React.FC<Props> = ({ item }) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isTagOpen, setIsTagOpen] = useState(false)
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false)
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()
  const { mutate } = useSWRConfig()
  const router = useRouter()

  const { t } = useTranslation('common')

  const handleUpdateClose = () => setIsUpdateOpen(false)
  const handleManageClose = () => setIsManageOpen(false)
  const handleTagClose = () => setIsTagOpen(false)
  const handleDeactivateConfirmClose = () => setIsDeactivateConfirmOpen(false)

  const showStats = () => {
    router.push(
      `/organisation/stats?projectId=${item.id}&projectName=${encodeURIComponent(item.key)}`,
    )
    handleCloseAll()
  }

  const showLists = () => {
    router.push(
      `/organisation/lists?projectId=${item.id}&projectName=${encodeURIComponent(item.key)}`,
    )
    handleCloseAll()
  }

  const showDeactivateConfirm = () => {
    setIsDeactivateConfirmOpen(true)
    handleCloseAll()
  }

  const handleDeactivateProject = async () => {
    await deactivateProject(item.organisationReference.id, item.id)
    await mutate(getGetProjectListKey(item.organisationReference.id))
    setIsDeactivateConfirmOpen(false)
  }

  const manageMembers = () => {
    setIsManageOpen(true)
    handleCloseAll()
  }

  const manageTags = () => {
    setIsTagOpen(true)
    handleCloseAll()
  }

  const updateProject = () => {
    setIsUpdateOpen(true)
    handleCloseAll()
  }

  return (
    <>
      <ContextBody variant="compact">
        <ContextButtonOpen hash={item.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.id && (
            <ContextAnimatePresence variant="compact">
              <ContextBar>
                {item.active && (
                  <ContextButtonWrapper variant="compact">
                    <Button
                      variant="contextIcon"
                      title={t('members.actions.manage', { defaultValue: 'Manage members' })}
                      aria-label={t('members.actions.manage', { defaultValue: 'Manage members' })}
                      onClick={() => manageMembers()}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={Users} size={24} />
                    </Button>
                  </ContextButtonWrapper>
                )}
                <ContextButtonWrapper variant="compact">
                  <Button
                    variant="contextIcon"
                    title={t('bookings.showLists', { defaultValue: 'Show bookings' })}
                    aria-label={t('bookings.showLists', { defaultValue: 'Show bookings' })}
                    onClick={() => showLists()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={List} size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextButtonWrapper variant="compact">
                  <Button
                    variant="contextIcon"
                    title={t('statistics.showStatistics', { defaultValue: 'Show statistics' })}
                    aria-label={t('statistics.showStatistics', { defaultValue: 'Show statistics' })}
                    onClick={() => showStats()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={PieChart} size={24} />
                  </Button>
                </ContextButtonWrapper>
                <ContextButtonWrapper variant="compact">
                  {!item.active && item.deactivatedBy ? (
                    <ToolTip
                      toolTipContent={t('projects.deactivatedBy', {
                        defaultValue: 'Archived by {{user}}',
                        user: item.deactivatedBy.key,
                      })}
                      placement="top"
                      width="auto">
                      <Button
                        variant="contextIcon"
                        title={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                        aria-label={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                        onClick={() => updateProject()}
                        fullWidth={false}
                        shape="circle">
                        <LucideIcon icon={Pencil} size={24} />
                      </Button>
                    </ToolTip>
                  ) : (
                    <Button
                      variant="contextIcon"
                      title={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                      aria-label={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                      onClick={() => updateProject()}
                      fullWidth={false}
                      shape="circle">
                      <LucideIcon icon={Pencil} size={24} />
                    </Button>
                  )}
                </ContextButtonWrapper>
                {item.active && (
                  <>
                    <ContextButtonWrapper variant="compact">
                      <Button
                        variant="contextIcon"
                        title={t('tags.actions.edit', { defaultValue: 'Edit tags' })}
                        aria-label={t('tags.actions.edit', { defaultValue: 'Edit tags' })}
                        onClick={() => manageTags()}
                        fullWidth={false}
                        shape="circle">
                        <LucideIcon icon={Tags} size={24} />
                      </Button>
                    </ContextButtonWrapper>
                    <ContextButtonWrapper variant="compact">
                      <Button
                        variant="contextIcon"
                        title={t('projects.actions.deactivate', {
                          defaultValue: 'Deactivate project',
                        })}
                        aria-label={t('projects.actions.deactivate', {
                          defaultValue: 'Deactivate project',
                        })}
                        onClick={() => showDeactivateConfirm()}
                        fullWidth={false}
                        shape="circle">
                        <LucideIcon icon={Archive} size={24} />
                      </Button>
                    </ContextButtonWrapper>
                  </>
                )}
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      <Modal open={isTagOpen} onClose={handleTagClose} size="wide">
        <ProjectAddUpdateTagsForm
          mode="update"
          item={item}
          onSave={handleTagClose}
          onCancel={handleTagClose}
        />
      </Modal>
      <Modal open={isUpdateOpen} onClose={handleUpdateClose}>
        <ProjectAddUpdateForm
          mode="update"
          item={item}
          onSave={handleUpdateClose}
          onCancel={handleUpdateClose}
        />
      </Modal>
      <Modal open={isManageOpen} onClose={handleManageClose} autoSize={false}>
        <ManageProjectMembers item={item} onSave={handleManageClose} onCancel={handleManageClose} />
      </Modal>
      {isDeactivateConfirmOpen && (
        <ModalConfirmDeactivateProject
          projectName={item.key}
          onConfirm={handleDeactivateProject}
          onCancel={handleDeactivateConfirmClose}
        />
      )}
    </>
  )
}
