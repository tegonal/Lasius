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

import { useToast } from 'components/ui/feedback/hooks/useToast'
import { ModelsImporterType } from 'lib/api/lasius'
import {
  getGetConfigsKey,
  useCreateConfig,
  useUpdateConfig,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import { mutate } from 'swr'

import { getCredentialPayload, getNullCredentialFields } from './credentialConfig'

import type { ImporterType } from 'components/features/issue-importers/shared/types'
import type { ModelsIssueImporterConfigResponse } from 'lib/api/lasius'

/**
 * Hook for handling config submission (create/update)
 *
 * @param importerType - Platform type (github, gitlab, jira, plane)
 * @param orgId - Organization ID
 * @param isEdit - Whether this is edit mode
 * @param config - Existing config (for edit mode)
 * @param onSuccess - Callback on successful submission
 * @returns Submit handler and saving state
 */
export const useConfigSubmit = (
  importerType: ImporterType,
  orgId: string,
  isEdit: boolean,
  config?: ModelsIssueImporterConfigResponse,
  onSuccess?: () => void,
) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const { trigger: createConfig, isMutating: isCreating } = useCreateConfig(orgId)
  const { trigger: updateConfig, isMutating: isUpdating } = useUpdateConfig(orgId, config?.id || '')

  const onSubmit = async (formData: Record<string, any>) => {
    try {
      const basePayload = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        checkFrequency: formData.checkFrequency,
      }

      const credentialPayload = getCredentialPayload(importerType, formData, isEdit)
      const nullFields = getNullCredentialFields(importerType)

      if (isEdit && config) {
        // Update existing config
        const updatePayload = {
          ...basePayload,
          ...credentialPayload,
          ...nullFields,
        }
        await updateConfig(updatePayload)
      } else {
        // Create new config
        const createPayload = {
          importerType: ModelsImporterType[importerType],
          ...basePayload,
          ...credentialPayload,
          ...nullFields,
        }
        await createConfig(createPayload)
      }

      // Invalidate cache
      await mutate(getGetConfigsKey(orgId, { type: importerType as any }))

      // Show success message
      addToast({
        message: t('issueImporters.success.configSaved', {
          defaultValue: 'Configuration saved successfully',
        }),
        type: 'SUCCESS',
      })

      // Call success callback
      onSuccess?.()
    } catch (error) {
      logger.error(`[useConfigSubmit] Failed to save ${importerType} config:`, error)
      addToast({
        message: t(`issueImporters.errors.saveFailed.${importerType}`, {
          defaultValue: `Failed to save ${importerType} config`,
        }),
        type: 'ERROR',
      })
    }
  }

  return {
    onSubmit,
    isSaving: isCreating || isUpdating,
  }
}
