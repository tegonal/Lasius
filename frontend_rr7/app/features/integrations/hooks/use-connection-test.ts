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

import { type RefObject, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type ImporterType } from '~/lib/utils/tag-helpers'
import {
  useTestConnectivity,
  useTestExistingConfig,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

export type ConnectionTestResult = 'error' | 'success' | null

type UseConnectionTestOptions = {
  config: ModelsIssueImporterConfigResponse | null
  formRef: RefObject<HTMLFormElement | null>
  importerType: ImporterType
  open: boolean
  selectedOrgId: string
}

export const useConnectionTest = ({
  config,
  formRef,
  importerType,
  open,
  selectedOrgId,
}: UseConnectionTestOptions) => {
  const { t } = useTranslation('integrations')

  const [connectionTestResult, setConnectionTestResult] =
    useState<ConnectionTestResult>(null)
  const [connectionTestMessage, setConnectionTestMessage] = useState('')

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setConnectionTestResult(null)
      setConnectionTestMessage('')
    }
  }, [open])

  const testExistingApi = useTestExistingConfig({
    onError: (error) => {
      setConnectionTestResult('error')
      setConnectionTestMessage(
        error instanceof Error ? error.message : String(error),
      )
    },
    onSuccess: (data) => {
      setConnectionTestResult(data?.status === 'success' ? 'success' : 'error')
      setConnectionTestMessage(
        data?.message ??
          t('issueImporters.testConnection.success', {
            defaultValue: 'Connection successful',
          }),
      )
    },
  })

  const testConnectivityApi = useTestConnectivity({
    onError: (error) => {
      setConnectionTestResult('error')
      setConnectionTestMessage(
        error instanceof Error ? error.message : String(error),
      )
    },
    onSuccess: (data) => {
      setConnectionTestResult(data?.status === 'success' ? 'success' : 'error')
      setConnectionTestMessage(
        data?.message ??
          t('issueImporters.testConnection.success', {
            defaultValue: 'Connection successful',
          }),
      )
    },
  })

  const isTestingConnection =
    testExistingApi.isSubmitting || testConnectivityApi.isSubmitting

  const getFormValues = useCallback((): Record<string, string> => {
    if (!formRef.current) return {}
    const fd = new FormData(formRef.current)
    return Object.fromEntries(fd.entries()) as Record<string, string>
  }, [formRef])

  const hasNewCredentials = useCallback(() => {
    const values = getFormValues()
    switch (importerType) {
      case 'github':
      case 'gitlab': {
        return !!values.accessToken
      }
      case 'jira': {
        return (
          !!values.accessToken || !!values.consumerKey || !!values.privateKey
        )
      }
      case 'plane': {
        return !!values.apiKey
      }
    }
  }, [getFormValues, importerType])

  const handleTestConnection = useCallback(() => {
    if (!config) return

    if (hasNewCredentials()) {
      const values = getFormValues()
      testConnectivityApi.submit({
        body: {
          accessToken: values.accessToken || undefined,
          apiKey: values.apiKey || undefined,
          baseUrl: values.baseUrl,
          checkFrequency: Number(values.checkFrequency),
          consumerKey: values.consumerKey || undefined,
          importerType: importerType as unknown as never,
          name: values.name,
          privateKey: values.privateKey || undefined,
          resourceOwner: values.resourceOwner || undefined,
          resourceOwnerType: values.resourceOwnerType || undefined,
          workspace: values.workspace || undefined,
        } as unknown as never,
        orgId: selectedOrgId,
      })
    } else {
      testExistingApi.submit({
        configId: config.id,
        orgId: selectedOrgId,
      })
    }
  }, [
    config,
    getFormValues,
    hasNewCredentials,
    importerType,
    selectedOrgId,
    testConnectivityApi,
    testExistingApi,
  ])

  const resetTestState = useCallback(() => {
    setConnectionTestResult(null)
    setConnectionTestMessage('')
  }, [])

  return {
    connectionTestMessage,
    connectionTestResult,
    handleTestConnection,
    isTestingConnection,
    resetTestState,
  }
}
