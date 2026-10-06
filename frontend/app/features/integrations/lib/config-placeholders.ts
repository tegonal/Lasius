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

import { type SchemaTranslationFunction } from '~/lib/i18n-types'
import { type ImporterType } from '~/lib/utils/tag-helpers'

export const getConfigNamePlaceholder = (
  type: ImporterType,
  t: SchemaTranslationFunction,
): string => {
  switch (type) {
    case 'github': {
      return t('integrations:issueImporters.fields.namePlaceholder.github', {
        defaultValue: 'e.g., Company GitHub',
      })
    }
    case 'gitlab': {
      return t('integrations:issueImporters.fields.namePlaceholder.gitlab', {
        defaultValue: 'e.g., Company GitLab',
      })
    }
    case 'jira': {
      return t('integrations:issueImporters.fields.namePlaceholder.jira', {
        defaultValue: 'e.g., Company Jira',
      })
    }
    case 'plane': {
      return t('integrations:issueImporters.fields.namePlaceholder.plane', {
        defaultValue: 'e.g., Company Plane',
      })
    }
  }
}

export const getConfigBaseUrlPlaceholder = (
  type: ImporterType,
  t: SchemaTranslationFunction,
): string => {
  switch (type) {
    case 'github': {
      return t('integrations:issueImporters.fields.baseUrlPlaceholder.github', {
        defaultValue: 'https://api.github.com',
      })
    }
    case 'gitlab': {
      return t('integrations:issueImporters.fields.baseUrlPlaceholder.gitlab', {
        defaultValue: 'https://...',
      })
    }
    case 'jira': {
      return t('integrations:issueImporters.fields.baseUrlPlaceholder.jira', {
        defaultValue: 'https://company.atlassian.net',
      })
    }
    case 'plane': {
      return t('integrations:issueImporters.fields.baseUrlPlaceholder.plane', {
        defaultValue: 'https://...',
      })
    }
  }
}
