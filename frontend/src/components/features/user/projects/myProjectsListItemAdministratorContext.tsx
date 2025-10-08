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
import { ContextButtonLeaveProject } from 'components/features/contextMenu/buttons/contextButtonLeaveProject'
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
import { FormElement } from 'components/ui/forms/FormElement'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { AnimatePresence } from 'framer-motion'
import { ModelsUserProject } from 'lib/api/lasius'
import { List, Pencil, PieChart, Tags, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import React, { useState } from 'react'

type Props = {
  item: ModelsUserProject
}

export const MyProjectsListItemAdministratorContext: React.FC<Props> = ({ item }) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isTagOpen, setIsTagOpen] = useState(false)
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()
  const router = useRouter()

  const { t } = useTranslation('common')

  const handleUpdateClose = () => setIsUpdateOpen(false)
  const handleManageClose = () => setIsManageOpen(false)
  const handleTagClose = () => setIsTagOpen(false)

  const showStats = () => {
    router.push(
      `/user/stats?projectId=${item.projectReference.id}&projectName=${encodeURIComponent(item.projectReference.key)}`,
    )
    handleCloseAll()
  }

  const showLists = () => {
    router.push(
      `/user/lists?projectId=${item.projectReference.id}&projectName=${encodeURIComponent(item.projectReference.key)}`,
    )
    handleCloseAll()
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
        <ContextButtonOpen hash={item.projectReference.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.projectReference.id && (
            <ContextAnimatePresence variant="compact">
              <ContextBar>
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
                  <Button
                    variant="contextIcon"
                    title={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                    aria-label={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                    onClick={() => updateProject()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Pencil} size={24} />
                  </Button>
                </ContextButtonWrapper>
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
                <ContextButtonLeaveProject item={item} variant="compact" />
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextAnimatePresence>
          )}
        </AnimatePresence>
      </ContextBody>
      <Modal open={isUpdateOpen} onClose={handleUpdateClose}>
        <ProjectAddUpdateForm
          mode="update"
          item={item}
          onSave={handleUpdateClose}
          onCancel={handleUpdateClose}
        />
      </Modal>
      <Modal open={isTagOpen} onClose={handleTagClose} size="wide">
        <ProjectAddUpdateTagsForm
          mode="update"
          item={item}
          onSave={handleTagClose}
          onCancel={handleTagClose}
        />
      </Modal>
      <Modal open={isManageOpen} onClose={handleManageClose} autoSize>
        <ManageProjectMembers item={item} onSave={handleManageClose} onCancel={handleManageClose} />
        <FormElement>
          <Button type="button" variant="secondary" onClick={handleManageClose}>
            {t('common.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </FormElement>
      </Modal>
    </>
  )
}
