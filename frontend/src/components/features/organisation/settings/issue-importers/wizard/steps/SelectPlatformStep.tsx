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

import { ImporterTypeIcon } from 'components/features/issue-importers/shared/ImporterTypeIcon'
import {
  getImporterTypeLabel,
  type ImporterType,
} from 'components/features/issue-importers/shared/types'
import { Button } from 'components/primitives/buttons/Button'
import { Heading } from 'components/primitives/typography/Heading'
import { Text } from 'components/primitives/typography/Text'
import { useTranslation } from 'next-i18next'
import React from 'react'

type Props = {
  onSelectPlatform: (type: ImporterType) => void
}

const PLATFORMS: ImporterType[] = ['github', 'gitlab', 'jira', 'plane']

export const SelectPlatformStep: React.FC<Props> = ({ onSelectPlatform }) => {
  const { t } = useTranslation('integrations')

  // Platform descriptions - using static keys for i18next-parser extraction
  const getPlatformDescription = (platform: ImporterType): string => {
    switch (platform) {
      case 'github':
        return t('issueImporters.wizard.selectPlatform.githubDescription', {
          defaultValue: 'Import issues and pull requests from GitHub repositories',
        })
      case 'gitlab':
        return t('issueImporters.wizard.selectPlatform.gitlabDescription', {
          defaultValue: 'Import issues and merge requests from GitLab projects',
        })
      case 'jira':
        return t('issueImporters.wizard.selectPlatform.jiraDescription', {
          defaultValue: 'Import issues and epics from Jira boards',
        })
      case 'plane':
        return t('issueImporters.wizard.selectPlatform.planeDescription', {
          defaultValue: 'Import issues and tasks from Plane workspaces',
        })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Heading variant="section">
        {t('issueImporters.wizard.selectPlatform.title', {
          defaultValue: 'Select Issue Tracker',
        })}
      </Heading>
      <Text variant="infoText" className="mt-2">
        {t('issueImporters.wizard.selectPlatform.description', {
          defaultValue: 'Choose which issue tracking platform you want to integrate with Lasius.',
        })}
      </Text>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <Button
            key={platform}
            variant="ghost"
            className="h-auto justify-start gap-4 p-6 text-left"
            onClick={() => onSelectPlatform(platform)}>
            <ImporterTypeIcon type={platform} className="h-8 w-8 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-base font-semibold">{getImporterTypeLabel(platform, t)}</div>
              <div className="text-base-content/60 mt-1 text-sm">
                {getPlatformDescription(platform)}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
