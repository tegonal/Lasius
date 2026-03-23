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

import { useState } from 'react'
import { useLoaderData } from 'react-router'

import {
  ColumnCenter,
  ColumnRight,
  innerGridClasses,
} from '~/components/ui/layouts/layout-columns'
import { ScrollArea } from '~/components/ui/layouts/scroll-area'
import { Modal } from '~/components/ui/overlays/modal'
import {
  AllProjectsList,
  type ProjectStatusFilter,
} from '~/features/projects/components/all-projects-list'
import { AllProjectsRightColumn } from '~/features/projects/components/all-projects-right-column'
import { AllProjectsStats } from '~/features/projects/components/all-projects-stats'
import { ProjectAddUpdateForm } from '~/features/projects/components/project-add-update-form'
import { type ProjectWithActivity } from '~/types/common'

export const AllProjectsLayout = () => {
  const { projects } = useLoaderData<{
    projects: ProjectWithActivity[]
  }>()
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('both')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateClose = () => setIsCreateOpen(false)
  const handleCreateOpen = () => setIsCreateOpen(true)

  return (
    <div className={innerGridClasses}>
      <ColumnCenter>
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-shrink-0">
            <AllProjectsStats
              onCreateProject={handleCreateOpen}
              projects={projects}
            />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="pt-4">
              <AllProjectsList
                projects={projects}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
              />
            </div>
          </ScrollArea>
        </div>
      </ColumnCenter>
      <ColumnRight>
        <ScrollArea className="h-full">
          <AllProjectsRightColumn
            onSearchChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            projectCount={projects.length}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        </ScrollArea>
      </ColumnRight>
      <Modal onClose={handleCreateClose} open={isCreateOpen}>
        <ProjectAddUpdateForm
          mode="add"
          onCancel={handleCreateClose}
          onSave={handleCreateClose}
        />
      </Modal>
    </div>
  )
}
