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

import { Button } from 'components/primitives/buttons/Button'
import { Alert } from 'components/ui/feedback/Alert'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { testConnectivity } from 'lib/api/lasius/issue-importers/issue-importers'
import { logger } from 'lib/logger'
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'

import type { ModelsCreateIssueImporterConfig } from 'lib/api/lasius'

type TestStatus = 'testing' | 'success' | 'error' | 'idle'

type Props = {
  config: ModelsCreateIssueImporterConfig
  orgId: string
  onSuccess: () => void
  onStatusChange?: (status: TestStatus) => void
}

export const TestConnectionStep: React.FC<Props> = ({
  config,
  orgId,
  onSuccess,
  onStatusChange,
}) => {
  const { t } = useTranslation('integrations')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()
  const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hasTestedRef = React.useRef(false)

  // Notify parent of status changes
  React.useEffect(() => {
    onStatusChange?.(testStatus)
  }, [testStatus, onStatusChange])

  const testConnection = async () => {
    // Prevent duplicate test runs (e.g., from React Strict Mode)
    if (hasTestedRef.current) {
      return
    }
    hasTestedRef.current = true

    setTestStatus('testing')
    setErrorMessage(undefined)

    try {
      const response = await testConnectivity(orgId, config)

      if (response.status === 'success') {
        setTestStatus('success')
        // Auto-proceed after brief delay
        successTimeoutRef.current = setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setTestStatus('error')
        setErrorMessage(response.message || t('issueImporters.testConnection.failed'))
        hasTestedRef.current = false // Allow retry on error
      }
    } catch (error) {
      logger.error('[TestConnectionStep] Connection test failed:', error)
      setTestStatus('error')
      setErrorMessage(
        t('issueImporters.testConnection.failed', {
          defaultValue: 'Connection test failed. Please check your credentials and URL.',
        }),
      )
      hasTestedRef.current = false // Allow retry on error
    }
  }

  // Auto-test on mount
  useEffect(() => {
    testConnection()

    // Cleanup function to cancel timeout on unmount
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        {testStatus === 'testing' && (
          <>
            <LucideIcon icon={Loader2} size={64} className="text-primary animate-spin" />
            <p className="text-base-content/70 mt-4">
              {t('issueImporters.wizard.test.testing', {
                defaultValue: 'Testing connection...',
              })}
            </p>
          </>
        )}

        {testStatus === 'success' && (
          <>
            <LucideIcon icon={CheckCircle} size={64} className="text-success" />
            <p className="text-success mt-4 font-semibold">
              {t('issueImporters.wizard.test.success', {
                defaultValue: 'Connection successful!',
              })}
            </p>
            <p className="text-base-content/70 mt-2 text-sm">
              {t('issueImporters.wizard.test.successDescription', {
                defaultValue: 'Proceeding to next step...',
              })}
            </p>
          </>
        )}

        {testStatus === 'error' && (
          <>
            <LucideIcon icon={AlertCircle} size={64} className="text-error" />
            <p className="text-error mt-4 font-semibold">
              {t('issueImporters.wizard.test.error', {
                defaultValue: 'Connection failed',
              })}
            </p>
            {errorMessage && (
              <Alert variant="error" className="mt-4">
                <p className="text-sm">{errorMessage}</p>
              </Alert>
            )}
            <Button
              variant="primary"
              onClick={testConnection}
              className="mt-6 gap-2"
              disabled={testStatus !== 'error'}>
              <LucideIcon icon={RefreshCw} size={16} />
              {t('issueImporters.wizard.test.retry', {
                defaultValue: 'Retry Connection Test',
              })}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
