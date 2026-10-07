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

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  type TestStatus,
  TestStatusView,
} from '~/features/integrations/components/wizard/steps/test-status-view'
import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'
import { buildConfigBody } from '~/features/integrations/lib/wizard-config-body'
import { logger } from '~/lib/logger'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius'
import {
  useCreateConfig,
  useTestConnectivity,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Properties = {
  existingConfig?: ModelsIssueImporterConfigResponse
  formData: WizardFormData
  onBack: () => void
  onConfigCreated: (config: ModelsIssueImporterConfigResponse) => void
  onNext: () => void
  selectedOrgId: string
}

export const TestConnectionStep = ({
  existingConfig,
  formData,
  onBack,
  onConfigCreated,
  onNext,
  selectedOrgId,
}: Properties) => {
  const { t } = useTranslation('integrations')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()
  const hasTestedReference = useRef(false)
  const successTimeoutReference = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const testFailedMessage = t('issueImporters.wizard.test.failed', {
    defaultValue: 'Connection test failed. Please check your credentials and URL.',
  })

  // A failure clears the guard, so that a retry can run the test again.
  const failWith = (message: string) => {
    setTestStatus('error')
    setErrorMessage(message)
    hasTestedReference.current = false
  }

  const succeed = (config: ModelsIssueImporterConfigResponse) => {
    setTestStatus('success')
    onConfigCreated(config)
    successTimeoutReference.current = setTimeout(() => {
      onNext()
    }, 1500)
  }

  const { reset: resetCreate, submit: submitCreate } = useCreateConfig({
    onError: (error) => {
      logger.error('[TestConnectionStep] Config creation failed:', error)
      failWith(
        t('issueImporters.wizard.test.createFailed', {
          defaultValue: 'Connection succeeded but failed to save configuration.',
        }),
      )
    },
    onSuccess: succeed,
  })

  const { reset: resetTest, submit: submitTest } = useTestConnectivity({
    onError: (error) => {
      logger.error('[TestConnectionStep] Connection test failed:', error)
      failWith(testFailedMessage)
    },
    onSuccess: (data) => {
      if (data.status !== 'success') {
        failWith(data.message || testFailedMessage)
        return
      }
      // A config from a previous pass already exists, so the step skips the creation.
      if (existingConfig) {
        succeed(existingConfig)
        return
      }
      setTestStatus('saving')
      submitCreate({ body: buildConfigBody(formData), orgId: selectedOrgId })
    },
  })

  const runTest = useCallback(() => {
    if (hasTestedReference.current) return
    hasTestedReference.current = true

    setTestStatus('testing')
    setErrorMessage(undefined)

    submitTest({ body: buildConfigBody(formData), orgId: selectedOrgId })
  }, [formData, selectedOrgId, submitTest])

  const handleRetry = useCallback(() => {
    hasTestedReference.current = false
    resetTest()
    resetCreate()
    runTest()
  }, [runTest, resetTest, resetCreate])

  // Auto-test on mount (ref guard prevents re-runs)
  useEffect(() => {
    runTest()
  }, [runTest])

  // Clean up the success timeout on unmount only. The auto-test effect re-runs when runTest
  // changes identity, so its cleanup would cancel the navigation timeout too early.
  useEffect(() => {
    return () => {
      if (successTimeoutReference.current) {
        clearTimeout(successTimeoutReference.current)
      }
    }
  }, [])

  return (
    <TestStatusView
      errorMessage={errorMessage}
      onBack={onBack}
      onRetry={handleRetry}
      testStatus={testStatus}
    />
  )
}
