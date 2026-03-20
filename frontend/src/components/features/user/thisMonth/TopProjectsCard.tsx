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

import { ProjectSummary } from 'lib/api/functions/aggregateProjectHours'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  projects: ProjectSummary[]
  emptyMessage: string
  showTopPrefix?: boolean
}

export const TopProjectsCard = ({ projects, emptyMessage, showTopPrefix = true }: Props) => {
  const { t } = useTranslation('common')

  const title = showTopPrefix
    ? `Top ${t('projects.title', { defaultValue: 'Projects' })}`
    : t('projects.title', { defaultValue: 'Projects' })

  if (projects.length === 0) {
    return (
      <div className="flex-1">
        <div className="stats h-fit w-full">
          <div className="stat">
            <div className="stat-title">{title}</div>
            <div className="text-base-content/60 py-8 text-center text-sm">{emptyMessage}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="stats h-fit w-full">
        <div className="stat">
          <div className="stat-title">{title}</div>
          <div className="mt-2 space-y-2">
            {projects.map((project) => (
              <div key={project.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex-1 truncate font-medium">{project.name}</span>
                  <span className="text-base-content/60 ml-2 text-xs">
                    {project.hours.toFixed(1)}h
                  </span>
                </div>
                <progress
                  className="progress progress-primary h-2"
                  value={project.percentage}
                  max="100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
