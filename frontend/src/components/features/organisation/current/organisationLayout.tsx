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

import { OrganisationAddUpdateForm } from 'components/features/organisation/current/organisationAddUpdateForm'
import { OrganisationDetail } from 'components/features/organisation/current/organisationDetail'
import { OrganisationsRightColumn } from 'components/features/organisation/current/organisationsRightColumn'
import { OrganisationStats } from 'components/features/organisation/current/organisationStats'
import { ManageUserInviteByEmailForm } from 'components/features/user/manageUserInviteByEmailForm'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import React, { useState } from 'react'

export const OrganisationLayout: React.FC = () => {
  const { selectedOrganisationId } = useOrganisation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const handleAddClose = () => setIsAddOpen(false)
  const handleUpdateClose = () => setIsUpdateOpen(false)
  const handleInviteClose = () => setIsInviteOpen(false)

  const handleInvite = () => setIsInviteOpen(true)
  const handleEdit = () => setIsUpdateOpen(true)
  const handleCreate = () => setIsAddOpen(true)

  return (
    <>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <OrganisationStats onInvite={handleInvite} onEdit={handleEdit} onCreate={handleCreate} />
        <div className="px-4 pt-3">
          <OrganisationDetail />
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <OrganisationsRightColumn />
      </ScrollContainer>
      <Modal open={isAddOpen} onClose={handleAddClose}>
        <OrganisationAddUpdateForm mode="add" onSave={handleAddClose} onCancel={handleAddClose} />
      </Modal>
      <Modal open={isUpdateOpen} onClose={handleUpdateClose}>
        <OrganisationAddUpdateForm
          mode="update"
          onSave={handleUpdateClose}
          onCancel={handleUpdateClose}
        />
      </Modal>
      <Modal open={isInviteOpen} onClose={handleInviteClose}>
        <ManageUserInviteByEmailForm
          organisation={selectedOrganisationId}
          onSave={handleInviteClose}
          onCancel={handleInviteClose}
        />
      </Modal>
    </>
  )
}
