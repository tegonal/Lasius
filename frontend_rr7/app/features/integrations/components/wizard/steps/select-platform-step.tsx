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

import { useTranslation } from 'react-i18next'

import { ImporterTypeIcon } from '~/features/issue-importers/importer-type-icon'
import { type ImporterType } from '~/lib/utils/tag-helpers'

type Props = {
  onSelectPlatform: (type: ImporterType) => void
}

const PLATFORMS: ImporterType[] = ['github', 'gitlab', 'jira', 'plane']

export const SelectPlatformStep = ({ onSelectPlatform }: Props) => {
  const { t } = useTranslation('integrations')

  const getPlatformDescription = (platform: ImporterType): string => {
    switch (platform) {
      case 'github':
        return t('issueImporters.wizard.selectPlatform.githubDescription', {
          defaultValue:
            'Import issues and pull requests from GitHub repositories',
        })
      case 'gitlab':
        return t('issueImporters.wizard.selectPlatform.gitlabDescription', {
          defaultValue: 'Import issues and merge requests from GitLab projects',
        })
      case 'jira':
        return t('issueImporters.wizard.selectPlatform.jiraDescription', {
          defaultValue: 'Import issues and epics from your Jira instance',
        })
      case 'plane':
        return t('issueImporters.wizard.selectPlatform.planeDescription', {
          defaultValue: 'Import issues from your Plane workspace',
        })
    }
  }

  const getPlatformLabel = (platform: ImporterType): string => {
    switch (platform) {
      case 'github':
        return 'GitHub'
      case 'gitlab':
        return 'GitLab'
      case 'jira':
        return 'Jira'
      case 'plane':
        return 'Plane'
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h3 className="mb-2 text-lg font-semibold">
        {t('issueImporters.wizard.selectPlatform.title', {
          defaultValue: 'Select a platform',
        })}
      </h3>
      <p className="text-base-content/60 mb-8 text-sm">
        {t('issueImporters.wizard.selectPlatform.subtitle', {
          defaultValue: 'Choose the platform you want to import issues from',
        })}
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <button
            className="border-base-content/10 hover:border-primary hover:bg-base-200 flex items-start gap-4 rounded-lg border p-4 text-left transition-colors"
            key={platform}
            onClick={() => onSelectPlatform(platform)}
            type="button"
          >
            <div className="bg-base-200 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
              <ImporterTypeIcon className="h-5 w-5" type={platform} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{getPlatformLabel(platform)}</span>
              <span className="text-base-content/60 mt-1 text-sm">
                {getPlatformDescription(platform)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
