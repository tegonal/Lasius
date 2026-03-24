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

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Heading } from '~/components/primitives/typography/heading'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type ProjectStatusFilter } from '~/features/projects/components/all-projects-list'

type Props = {
  onSearchChange: (value: string) => void
  onStatusFilterChange: (filter: ProjectStatusFilter) => void
  projectCount: number
  searchTerm: string
  statusFilter: ProjectStatusFilter
}

export const AllProjectsRightColumn = ({
  onSearchChange,
  onStatusFilterChange,
  projectCount,
  searchTerm,
  statusFilter,
}: Props) => {
  const { t } = useTranslation()
  const showSearch = projectCount > 10

  return (
    <div className="w-full px-6 pt-3">
      <Heading as="h2" variant="section">
        {t('projects:allProjects', 'All projects')}
      </Heading>
      <p className="text-base-content/60 text-sm">
        {t(
          'projects:allProjectsDescription',
          'All projects in the current organization that you can administer. Create billing reports including time booked by external project members.',
        )}
      </p>
      {showSearch && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium">
            {t('projects:filter.search', 'Search')}
          </h3>
          <div className="join w-full">
            <Input
              className="join-item"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t(
                'projects:filter.searchPlaceholder',
                'Filter projects...',
              )}
              type="text"
              value={searchTerm}
            />
            {searchTerm && (
              <button
                aria-label={t('actions.clear', 'Clear')}
                className="btn btn-square join-item"
                onClick={() => onSearchChange('')}
                type="button"
              >
                <LucideIcon icon={X} size={20} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-sm font-medium">
          {t('projects:filter.status', 'Status')}
        </h3>
        <div className="join">
          <Button
            className="join-item w-auto"
            onClick={() => onStatusFilterChange('both')}
            size="sm"
            variant={statusFilter === 'both' ? 'primary' : 'neutral'}
          >
            {t('projects:filter.both', 'Both')}
          </Button>
          <Button
            className="join-item w-auto"
            onClick={() => onStatusFilterChange('active')}
            size="sm"
            variant={statusFilter === 'active' ? 'primary' : 'neutral'}
          >
            {t('status.active', 'Active')}
          </Button>
          <Button
            className="join-item w-auto"
            onClick={() => onStatusFilterChange('inactive')}
            size="sm"
            variant={statusFilter === 'inactive' ? 'primary' : 'neutral'}
          >
            {t('status.inactive', 'Inactive')}
          </Button>
        </div>
      </div>
    </div>
  )
}
