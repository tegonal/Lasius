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

import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { GenericConfirmModal } from '~/components/ui/overlays/modal/generic-confirm-modal'
import { useOrganisation } from '~/features/organisation/hooks/use-organisation'
import { useRemoveProjectOwnUser } from '~/services/api/lasius-hooks/projects/projects'
import { type ModelsUserProject } from '~/services/api/lasius/modelsUserProject'

import { ContextButtonWrapper } from '../context-button-wrapper'
import { useContextMenu } from '../hooks/use-context-menu'

type Props = {
  item: ModelsUserProject
  variant?: 'compact' | 'default'
}

export const ContextButtonLeaveProject = ({
  item,
  variant = 'default',
}: Props) => {
  const { handleCloseAll } = useContextMenu()
  const { t } = useTranslation(['projects', 'common'])
  const [showDialog, setShowDialog] = useState(false)
  const { selectedOrganisationId } = useOrganisation()
  const leaveProjectApi = useRemoveProjectOwnUser()

  const handleConfirm = () => {
    leaveProjectApi.submit({
      orgId: selectedOrganisationId,
      projectId: item.projectReference.id,
    })
    setShowDialog(false)
    handleCloseAll()
  }

  const handleCancel = () => {
    setShowDialog(false)
  }

  return (
    <ContextButtonWrapper variant={variant}>
      <Button
        aria-label={t('projects:actions.leave', 'Leave this project')}
        data-testid="project-ctx-leave-btn"
        fullWidth={false}
        onClick={() => setShowDialog(true)}
        shape="circle"
        title={t('projects:actions.leave', 'Leave this project')}
        variant="contextIcon"
      >
        <LucideIcon icon={LogOut} size={24} />
      </Button>
      {showDialog && (
        <GenericConfirmModal
          blockViewport
          cancelLabel={t('actions.cancel', 'Cancel')}
          confirmLabel={t('projects:actions.leave', 'Leave this project')}
          confirmVariant="primary"
          message={t(
            'projects:confirmations.leave',
            'Are you sure you want to leave this project?',
          )}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          open={showDialog}
          title={t('projects:actions.leave', 'Leave this project')}
        />
      )}
    </ContextButtonWrapper>
  )
}
