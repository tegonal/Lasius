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

import { Heading } from 'components/primitives/typography/Heading'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

import { type MappingWithTagConfig, ProjectMappingList } from '../../shared/ProjectMappingList'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsExternalProject, ModelsIssueImporterConfigId } from 'lib/api/lasius'

type Props = {
  importerType: ImporterType
  configId: ModelsIssueImporterConfigId
  orgId: string
  onProjectsLoaded: (projects: ModelsExternalProject[]) => void
  onMappingsChange: (mappings: Record<string, MappingWithTagConfig>) => void
}

export const ListProjectsStep: React.FC<Props> = ({
  importerType,
  configId,
  orgId,
  onProjectsLoaded,
  onMappingsChange,
}) => {
  const { t } = useTranslation('integrations')
  const [mappings, setMappings] = useState<Record<string, MappingWithTagConfig>>({})

  const handleMappingChange = (
    externalProjectId: string,
    lasiusProjectId: string | null,
    tagConfig: any,
    _externalProjectName?: string, // Ignored in wizard context, only used when saving
  ) => {
    setMappings((prev) => {
      const updated = { ...prev }
      if (lasiusProjectId) {
        updated[externalProjectId] = {
          projectId: lasiusProjectId,
          tagConfig,
        }
      } else {
        delete updated[externalProjectId]
      }
      // Notify parent of mapping changes
      onMappingsChange(updated)
      return updated
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <Heading variant="section">
        {t('issueImporters.wizard.projects.title', {
          defaultValue: 'Map External Projects',
        })}
      </Heading>

      <ProjectMappingList
        importerType={importerType}
        configId={configId}
        orgId={orgId}
        initialMappings={mappings}
        showMappedCount
        onMappingChange={handleMappingChange}
        onProjectsLoaded={onProjectsLoaded}
      />
    </div>
  )
}
