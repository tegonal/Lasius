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

import { ProjectAddUpdateForm } from 'components/features/projects/projectAddUpdateForm'
import { MyProjectsList } from 'components/features/user/projects/myProjectsList'
import { MyProjectsRightColumn } from 'components/features/user/projects/myProjectsRightColumn'
import { MyProjectsStats } from 'components/features/user/projects/myProjectsStats'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useProjects } from 'lib/api/hooks/useProjects'
import React, { useState } from 'react'

export const MyProjectsLayout: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { userProjects } = useProjects()

  const handleCreateClose = () => setIsCreateOpen(false)
  const handleCreateOpen = () => setIsCreateOpen(true)

  return (
    <>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <MyProjectsStats onCreateProject={handleCreateOpen} />
        <div className="pt-4">
          <MyProjectsList statusFilter="both" searchTerm={searchTerm} />
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <MyProjectsRightColumn
          projectCount={userProjects().length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </ScrollContainer>
      <Modal open={isCreateOpen} onClose={handleCreateClose}>
        <ProjectAddUpdateForm mode="add" onSave={handleCreateClose} onCancel={handleCreateClose} />
      </Modal>
    </>
  )
}
