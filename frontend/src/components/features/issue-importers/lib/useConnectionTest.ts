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

import { ModelsImporterType, ModelsIssueImporterConfigId } from 'lib/api/lasius'
import {
  testConnectivity,
  testExistingConfig,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { logger } from 'lib/logger'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

import { getNullCredentialFields } from './credentialConfig'

import type { ImporterType } from 'components/features/issue-importers/shared/types'

export type ConnectionTestStatus = 'success' | 'error' | null

/**
 * Hook for handling connection testing for issue importer configurations
 *
 * @param importerType - Platform type (github, gitlab, jira, plane)
 * @param orgId - Organization ID
 * @param configId - Optional config ID for testing existing configuration
 * @returns Connection test state and handler function
 */
export const useConnectionTest = (
  importerType: ImporterType,
  orgId: string,
  configId?: ModelsIssueImporterConfigId,
) => {
  const { t } = useTranslation('integrations')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestStatus>(null)
  const [connectionTestMessage, setConnectionTestMessage] = useState<string>('')

  const handleTestConnection = async (formData: Record<string, any>) => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)
    setConnectionTestMessage('')

    try {
      let response: any

      // Check if any credential fields have been entered in the form
      const hasNewCredentials =
        formData.accessToken || formData.consumerKey || formData.privateKey || formData.apiKey

      // Case 1: Testing existing config (edit mode with no new credentials entered)
      if (configId && !hasNewCredentials) {
        logger.info(`[useConnectionTest] Testing existing config: ${configId}`)
        response = await testExistingConfig(orgId, configId)
      }
      // Case 2: Testing with new credentials (create mode or edit mode with new credentials)
      else {
        // Validate required fields before testing
        if (importerType === 'github' && !formData.resourceOwner) {
          setConnectionTestResult('error')
          setConnectionTestMessage(
            t('issueImporters.testConnection.resourceOwnerRequired', {
              defaultValue: 'Please select a resource owner before testing the connection.',
            }),
          )
          setIsTestingConnection(false)
          return
        }

        const payload: Record<string, any> = {
          importerType: ModelsImporterType[importerType],
          name: formData.name,
          baseUrl: formData.baseUrl,
          checkFrequency: formData.checkFrequency,
          // Include platform-specific credentials
          accessToken: formData.accessToken || null,
          consumerKey: formData.consumerKey || null,
          privateKey: formData.privateKey || null,
          apiKey: formData.apiKey || null,
          // Null out unused fields for this platform
          ...getNullCredentialFields(importerType),
        }

        // Add resourceOwner and resourceOwnerType for GitHub (required fields, not nullable)
        if (importerType === 'github' && formData.resourceOwner) {
          payload.resourceOwner = formData.resourceOwner
          payload.resourceOwnerType = formData.resourceOwnerType
        }

        logger.info(
          `[useConnectionTest] Testing with new credentials for ${importerType}${configId ? ` (editing config ${configId})` : ' (new config)'}`,
        )
        response = await testConnectivity(orgId, payload as any)
      }

      if (response.status === 'success') {
        setConnectionTestResult('success')
        setConnectionTestMessage(
          response.message ||
            t('issueImporters.testConnection.success', {
              defaultValue: 'Connection test successful',
            }),
        )
      } else {
        setConnectionTestResult('error')
        setConnectionTestMessage(
          response.message ||
            t('issueImporters.testConnection.failed', {
              defaultValue: 'Connection test failed. Please check your credentials and URL.',
            }),
        )
      }
    } catch (error) {
      logger.error(`[useConnectionTest] Connection test failed for ${importerType}:`, error)
      setConnectionTestResult('error')
      setConnectionTestMessage(
        t('issueImporters.testConnection.failed', {
          defaultValue: 'Connection test failed. Please check your credentials and URL.',
        }),
      )
    } finally {
      setIsTestingConnection(false)
    }
  }

  const resetTestState = () => {
    setConnectionTestResult(null)
    setConnectionTestMessage('')
  }

  return {
    isTestingConnection,
    connectionTestResult,
    connectionTestMessage,
    handleTestConnection,
    resetTestState,
  }
}
