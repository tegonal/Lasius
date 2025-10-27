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

import { ProjectStatusFilter } from 'components/features/organisation/projects/allProjectsList'
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Heading } from 'components/primitives/typography/Heading'
import { Text } from 'components/primitives/typography/Text'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  statusFilter: ProjectStatusFilter
  onStatusFilterChange: (filter: ProjectStatusFilter) => void
  projectCount: number
  searchTerm: string
  onSearchChange: (value: string) => void
}

export const AllProjectsRightColumn: React.FC<Props> = ({
  statusFilter,
  onStatusFilterChange,
  projectCount,
  searchTerm,
  onSearchChange,
}) => {
  const { t } = useTranslation('common')
  const showSearch = projectCount > 10

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
      {showSearch && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium">
            {t('projects.filter.search', { defaultValue: 'Search' })}
          </h3>
          <div className="join w-full">
            <Input
              type="text"
              placeholder={t('projects.filter.searchPlaceholder', {
                defaultValue: 'Filter projects...',
              })}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="join-item"
            />
            {searchTerm && (
              <button
                type="button"
                className="btn btn-square join-item"
                onClick={() => onSearchChange('')}
                aria-label={t('common.actions.clear', { defaultValue: 'Clear' })}>
                <LucideIcon icon={X} size={20} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-sm font-medium">
          {t('projects.filter.status', { defaultValue: 'Status' })}
        </h3>
        <div className="join">
          <Button
            variant={statusFilter === 'both' ? 'primary' : 'neutral'}
            size="sm"
            className="join-item w-auto"
            onClick={() => onStatusFilterChange('both')}>
            {t('projects.filter.both', { defaultValue: 'Both' })}
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'primary' : 'neutral'}
            size="sm"
            className="join-item w-auto"
            onClick={() => onStatusFilterChange('active')}>
            {t('common.status.active', { defaultValue: 'Active' })}
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'primary' : 'neutral'}
            size="sm"
            className="join-item w-auto"
            onClick={() => onStatusFilterChange('inactive')}>
            {t('common.status.inactive', { defaultValue: 'Inactive' })}
          </Button>
        </div>
      </div>
    </div>
  )
}
