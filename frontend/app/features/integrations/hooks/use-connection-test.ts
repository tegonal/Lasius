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

import { type RefObject, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  buildConnectivityBody,
  type ConnectionTestResponse,
  getConnectionTestOutcome,
  hasNewCredentials,
} from '~/features/integrations/lib/connection-test'
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
  selectedOrgId: string
}

export const useConnectionTest = ({
  config,
  formRef,
  importerType,
  selectedOrgId,
}: UseConnectionTestOptions) => {
  const { t } = useTranslation('integrations')

  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult>(null)
  const [connectionTestMessage, setConnectionTestMessage] = useState('')

  const callbacks = {
    onError: (error: { error: string }) => {
      setConnectionTestResult('error')
      setConnectionTestMessage(error.error)
    },
    onSuccess: (data: ConnectionTestResponse) => {
      const outcome = getConnectionTestOutcome(
        data,
        t('issueImporters.testConnection.success', {
          defaultValue: 'Connection successful',
        }),
      )
      setConnectionTestResult(outcome.result)
      setConnectionTestMessage(outcome.message)
    },
  }

  const testExistingApi = useTestExistingConfig(callbacks)
  const testConnectivityApi = useTestConnectivity(callbacks)

  const isTestingConnection = testExistingApi.isSubmitting || testConnectivityApi.isSubmitting

  const { submit: submitConnectivityTest } = testConnectivityApi
  const { submit: submitExistingTest } = testExistingApi

  const handleTestConnection = useCallback(() => {
    if (!config) return
    const values = formRef.current
      ? (Object.fromEntries(new FormData(formRef.current)) as Record<string, string>)
      : {}

    if (hasNewCredentials(importerType, values)) {
      submitConnectivityTest({
        body: buildConnectivityBody(importerType, values) as unknown as never,
        orgId: selectedOrgId,
      })
    } else {
      submitExistingTest({ configId: config.id, orgId: selectedOrgId })
    }
  }, [config, formRef, importerType, selectedOrgId, submitConnectivityTest, submitExistingTest])

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
