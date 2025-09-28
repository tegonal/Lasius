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
import { ContextBar } from 'components/features/contextMenu/contextBar'
import { ContextCompactAnimatePresence } from 'components/features/contextMenu/contextCompactAnimatePresence'
import { ContextCompactBody } from 'components/features/contextMenu/contextCompactBody'
import { ContextCompactButtonWrapper } from 'components/features/contextMenu/contextCompactButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { ManageProjectMembers } from 'components/features/projects/manageMembers'
import { ProjectAddUpdateForm } from 'components/features/projects/projectAddUpdateForm'
import { ProjectAddUpdateTagsForm } from 'components/features/projects/projectAddUpdateTagsForm'
import { ProjectBookingsCsvExport } from 'components/features/projects/projectBookingsCsvExport'
import { Button } from 'components/primitives/buttons/Button'
import { FormElement } from 'components/ui/forms/formElement'
import { Icon } from 'components/ui/icons/Icon'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { AnimatePresence } from 'framer-motion'
import { ModelsProject } from 'lib/api/lasius'
import { deactivateProject } from 'lib/api/lasius/projects/projects'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  item: ModelsProject
}

export const AllProjectsListItemContext: React.FC<Props> = ({ item }) => {
  const updateModal = useModal(`EditProjectModal-${item.id}`)
  const manageModal = useModal(`ManageProjectMembersModal-${item.id}`)
  const statsModal = useModal(`StatsModal-${item.id}`)
  const exportModal = useModal(`ExportModal-${item.id}`)
  const tagModal = useModal(`TagModal-${item.id}`)
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

  const handleDeactivateProject = async () => {
    await deactivateProject(item.organisationReference.id, item.id)
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
        <ContextButtonOpen hash={item.id} />
        <AnimatePresence>
          {currentOpenContextMenuId === item.id && (
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
                    <Icon name="human-resources-search-team-work-office-companies" size={24} />
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
                    <Icon name="pie-line-graph-interface-essential" size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('export.getBillingReports', {
                      defaultValue: 'Get billing reports as CSV',
                    })}
                    aria-label={t('export.getBillingReports', {
                      defaultValue: 'Get billing reports as CSV',
                    })}
                    onClick={() => showExport()}
                    fullWidth={false}
                    shape="circle">
                    <Icon name="filter-text-interface-essential" size={24} />
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
                    <Icon name="pencil-2-interface-essential" size={24} />
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
                    <Icon name="tags-double-interface-essential" size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextCompactButtonWrapper>
                  <Button
                    variant="contextIcon"
                    title={t('projects.actions.deactivate', { defaultValue: 'Deactivate project' })}
                    aria-label={t('projects.actions.deactivate', {
                      defaultValue: 'Deactivate project',
                    })}
                    onClick={() => handleDeactivateProject()}
                    fullWidth={false}
                    shape="circle">
                    <Icon name="bin-2-alternate-interface-essential" size={24} />
                  </Button>
                </ContextCompactButtonWrapper>
                <ContextButtonClose variant="compact" />
              </ContextBar>
            </ContextCompactAnimatePresence>
          )}
        </AnimatePresence>
      </ContextCompactBody>
      <ModalResponsive modalId={tagModal.modalId} autoSize>
        <ProjectAddUpdateTagsForm
          mode="update"
          item={item}
          onSave={tagModal.closeModal}
          onCancel={tagModal.closeModal}
        />
      </ModalResponsive>
      <ModalResponsive modalId={updateModal.modalId}>
        <ProjectAddUpdateForm
          mode="update"
          item={item}
          onSave={updateModal.closeModal}
          onCancel={updateModal.closeModal}
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
        <ProjectBookingsCsvExport item={item} />
        <FormElement>
          <Button type="button" variant="secondary" onClick={exportModal.closeModal}>
            {t('common.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </FormElement>
      </ModalResponsive>
    </>
  )
}
