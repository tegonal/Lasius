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

import { ContextButtonWrapper } from 'components/features/contextMenu/contextButtonWrapper'
import { useContextMenu } from 'components/features/contextMenu/hooks/useContextMenu'
import { Button } from 'components/primitives/buttons/Button'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { ModalConfirm } from 'components/ui/overlays/modal/modalConfirm'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useProfile } from 'lib/api/hooks/useProfile'
import { ModelsUserProject } from 'lib/api/lasius'
import { removeProjectUser } from 'lib/api/lasius/projects/projects'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  variant?: 'default' | 'compact'
  item: ModelsUserProject
}
export const ContextButtonLeaveProject: React.FC<Props> = ({ variant = 'default', item }) => {
  const { handleCloseAll } = useContextMenu()
  const { t } = useTranslation('common')
  const [showDialog, setShowDialog] = React.useState(false)
  const { selectedOrganisationId } = useOrganisation()
  const { userId } = useProfile()

  const handleConfirm = async () => {
    await removeProjectUser(selectedOrganisationId, item.projectReference.id, userId)
    handleCloseAll()
  }

  const handleCancel = async () => {
    setShowDialog(false)
  }

  const wrapperVariant = variant === 'compact' ? 'compact' : 'default'

  return (
    <ContextButtonWrapper variant={wrapperVariant}>
      <Button
        variant="contextIcon"
        title={t('projects.actions.leave', { defaultValue: 'Leave this project' })}
        aria-label={t('projects.actions.leave', { defaultValue: 'Leave this project' })}
        onClick={() => setShowDialog(true)}
        fullWidth={false}
        shape="circle">
        <LucideIcon icon={LogOut} size={24} />
      </Button>
      {showDialog && (
        <ModalConfirm
          text={{
            action: t('projects.confirmations.leave', {
              defaultValue: 'Are you sure you want to leave this project?',
            }),
          }}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ContextButtonWrapper>
  )
}
