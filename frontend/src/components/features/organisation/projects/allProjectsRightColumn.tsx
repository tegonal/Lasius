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

import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { ProjectAddUpdateForm } from 'components/features/projects/projectAddUpdateForm'
import { Button } from 'components/primitives/buttons/Button'
import { Divider } from 'components/primitives/divider/Divider'
import { Heading } from 'components/primitives/typography/Heading'
import { Text } from 'components/primitives/typography/Text'
import { FormElement } from 'components/ui/forms/FormElement'
import useModal from 'components/ui/overlays/modal/hooks/useModal'
import { ModalResponsive } from 'components/ui/overlays/modal/modalResponsive'
import { useTranslation } from 'next-i18next'
import React from 'react'

export const AllProjectsRightColumn: React.FC = () => {
  const { t } = useTranslation('common')
  const { modalId, openModal, closeModal } = useModal('AddProjectModal')
  const { handleCloseAll } = useContextMenu()

  const addProject = () => {
    openModal()
    handleCloseAll()
  }

  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('projects.allProjects', { defaultValue: 'All projects' })}
      </Heading>
      <Text variant="infoText">
        {t('projects.allProjectsDescription', {
          defaultValue:
            'All projects in the current organization that you can administer. Create billing reports including time booked by external project members.',
        })}
      </Text>
      <Divider className="my-4" />
      <FormElement>
        <Button onClick={() => addProject()}>
          {t('projects.actions.create', { defaultValue: 'Create a project' })}
        </Button>
      </FormElement>
      <ModalResponsive modalId={modalId}>
        <ProjectAddUpdateForm mode="add" onSave={closeModal} onCancel={closeModal} />
      </ModalResponsive>
    </div>
  )
}
