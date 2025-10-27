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

import {
  AllProjectsList,
  ProjectStatusFilter,
} from 'components/features/organisation/projects/allProjectsList'
import { AllProjectsRightColumn } from 'components/features/organisation/projects/allProjectsRightColumn'
import { AllProjectsStats } from 'components/features/organisation/projects/allProjectsStats'
import { ProjectAddUpdateForm } from 'components/features/projects/projectAddUpdateForm'
import { ScrollContainer } from 'components/primitives/layout/ScrollContainer'
import { Modal } from 'components/ui/overlays/modal/Modal'
import { useOrganisation } from 'lib/api/hooks/useOrganisation'
import { useGetProjectList } from 'lib/api/lasius/projects/projects'
import React, { useState } from 'react'

export const AllProjectsLayout: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('both')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { selectedOrganisationId } = useOrganisation()
  const { data } = useGetProjectList(selectedOrganisationId)

  const handleCreateClose = () => setIsCreateOpen(false)
  const handleCreateOpen = () => setIsCreateOpen(true)

  return (
    <>
      <ScrollContainer className="bg-base-100 flex-1 overflow-y-auto">
        <AllProjectsStats onCreateProject={handleCreateOpen} />
        <div className="pt-4">
          <AllProjectsList statusFilter={statusFilter} searchTerm={searchTerm} />
        </div>
      </ScrollContainer>
      <ScrollContainer className="bg-base-200 flex-1 overflow-y-auto rounded-tr-lg">
        <AllProjectsRightColumn
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          projectCount={data?.length || 0}
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
