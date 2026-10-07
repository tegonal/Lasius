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

import { Button } from '~/components/primitives/buttons/button'
import { Alert } from '~/components/ui/feedback/alert'

type TagConfigMetadataStatusProperties = {
  isError: boolean
  isLoading: boolean
  onRetry: () => void
}

export const TagConfigMetadataStatus = ({
  isError,
  isLoading,
  onRetry,
}: TagConfigMetadataStatusProperties) => {
  const { t } = useTranslation('integrations')

  if (isLoading) {
    return (
      <p
        className="text-base-content/60 flex items-center gap-2 text-xs"
        data-testid="tag-config-metadata-loading">
        <span className="loading loading-spinner loading-xs" />
        {t('issueImporters.tagConfiguration.metadataLoading', {
          defaultValue: 'Loading labels and states...',
        })}
      </p>
    )
  }

  if (!isError) return null

  return (
    <Alert data-testid="tag-config-metadata-error" variant="error">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">
          {t('issueImporters.tagConfiguration.metadataError', {
            defaultValue: 'Failed to load the labels and states of this project.',
          })}
        </p>
        <Button
          data-testid="tag-config-metadata-retry"
          fullWidth={false}
          onClick={onRetry}
          type="button"
          variant="neutral">
          {t('issueImporters.tagConfiguration.metadataRetry', {
            defaultValue: 'Retry',
          })}
        </Button>
      </div>
    </Alert>
  )
}
