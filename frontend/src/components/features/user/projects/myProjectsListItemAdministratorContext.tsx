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
import { ContextButtonDeactivateProject } from 'components/features/contextMenu/buttons/contextButtonDeactivateProject'
import { ContextButtonLeaveProject } from 'components/features/contextMenu/buttons/contextButtonLeaveProject'
import { ContextButtonOpen } from 'components/features/contextMenu/buttons/contextButtonOpen'
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextBarDivider } from 'components/features/contextMenu/contextBarDivider'
import { ContextCompactAnimatePresence } from 'components/features/contextMenu/contextCompactAnimatePresence'
import { ContextCompactBody } from 'components/features/contextMenu/contextCompactBody'
import { ContextCompactButtonWrapper } from 'components/features/contextMenu/contextCompactButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { ManageProjectMembers } from 'components/features/projects/manageMembers'
import { ProjectAddUpdateForm } from 'components/features/projects/projectAddUpdateForm'
import { ProjectAddUpdateTagsForm } from 'components/features/projects/projectAddUpdateTagsForm'
import { ProjectBookingsExport } from 'components/features/projects/projectBookingsExport'
import { Button } from 'components/primitives/buttons/Button'
import { FormElement } from 'components/ui/forms/FormElement'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { AnimatePresence } from 'framer-motion'
import { ModelsUserProject } from 'lib/api/lasius'
import { FileText, Pencil, PieChart, Tags, Users } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  item: ModelsUserProject
}

export const MyProjectsListItemAdministratorContext: React.FC<Props> = ({ item }) => {
  const updateModal = useModal(`EditProjectModal-${item.projectReference.id}`)
  const manageModal = useModal(`ManageProjectMembersModal-${item.projectReference.id}`)
  const statsModal = useModal(`StatsModal-${item.projectReference.id}`)
  const exportModal = useModal(`ExportModal-${item.projectReference.id}`)
  const tagModal = useModal(`TagModal-${item.projectReference.id}`)
  const { handleCloseAll, currentOpenContextMenuId } = useContextMenu()

  const { t } = useTranslation('common')

  const showStats = () => {
    statsModal.openModal()
    handleCloseAll()
  }

  const showExport = () => {
    exportModal.openModal()
    handleCloseAll()
  }

  const manageMembers = () => {
    manageModal.openModal()
    handleCloseAll()
  }

  const manageTags = () => {
    tagModal.openModal()
    handleCloseAll()
  }

  const updateProject = () => {
    updateModal.openModal()
    handleCloseAll()
  }

  return (
    <>
      <ContextCompactBody>
        <ContextButtonOpen hash={item.projectReference.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.projectReference.id && (
            <ContextCompactAnimatePresence>
              <ContextBar>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('members.actions.manage', { defaultValue: 'Manage members' })}
                    aria-label={t('members.actions.manage', { defaultValue: 'Manage members' })}
                    onClick={() => manageMembers()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Users} size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('statistics.showStatistics', { defaultValue: 'Show statistics' })}
                    aria-label={t('statistics.showStatistics', { defaultValue: 'Show statistics' })}
                    onClick={() => showStats()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={PieChart} size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('export.getBillingReports', {
                      defaultValue: 'Get billing reports',
                    })}
                    aria-label={t('export.getBillingReports', {
                      defaultValue: 'Get billing reports',
                    })}
                    onClick={() => showExport()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={FileText} size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                    aria-label={t('projects.actions.edit', { defaultValue: 'Edit project' })}
                    onClick={() => updateProject()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Pencil} size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('tags.actions.edit', { defaultValue: 'Edit tags' })}
                    aria-label={t('tags.actions.edit', { defaultValue: 'Edit tags' })}
                    onClick={() => manageTags()}
                    fullWidth={false}
                    shape="circle">
                    <LucideIcon icon={Tags} size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextButtonDeactivateProject item={item} variant="compact" />
                <ContextButtonLeaveProject item={item} variant="compact" />
                <ContextBarDivider />
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextCompactAnimatePresence>
          )}
        </AnimatePresence>
      </ContextCompactBody>
      <ModalResponsive modalId={updateModal.modalId}>
        <ProjectAddUpdateForm
          mode="update"
          item={item}
          onSave={updateModal.closeModal}
          onCancel={updateModal.closeModal}
        />
      </ModalResponsive>
      <ModalResponsive modalId={tagModal.modalId} autoSize>
        <ProjectAddUpdateTagsForm
          mode="update"
          item={item}
          onSave={tagModal.closeModal}
          onCancel={tagModal.closeModal}
        />
      </ModalResponsive>
      <ModalResponsive modalId={manageModal.modalId} autoSize>
        <ManageProjectMembers
          item={item}
          onSave={manageModal.closeModal}
          onCancel={manageModal.closeModal}
        />
        <FormElement>
          <Button type="button" variant="secondary" onClick={manageModal.closeModal}>
            {t('common.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </FormElement>
      </ModalResponsive>
      <ModalResponsive modalId={statsModal.modalId} autoSize>
        <div>Placeholder</div>
        <FormElement>
          <Button type="button" variant="secondary" onClick={statsModal.closeModal}>
            {t('common.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </FormElement>
      </ModalResponsive>
      <ModalResponsive modalId={exportModal.modalId} autoSize>
        <ProjectBookingsExport item={item.projectReference} />
        <FormElement>
          <Button type="button" variant="secondary" onClick={exportModal.closeModal}>
            {t('common.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </FormElement>
      </ModalResponsive>
    </>
  )
}
