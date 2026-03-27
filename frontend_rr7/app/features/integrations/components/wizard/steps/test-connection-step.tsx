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

import { CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type WizardFormData } from '~/features/integrations/hooks/use-wizard-state'
import { logger } from '~/lib/logger'
import {
  type ModelsCreateIssueImporterConfig,
  type ModelsIssueImporterConfigResponse,
} from '~/services/api/lasius'
import {
  useCreateConfig,
  useTestConnectivity,
} from '~/services/api/lasius-hooks/issue-importers/issue-importers'

type Props = {
  existingConfig?: ModelsIssueImporterConfigResponse
  formData: WizardFormData
  onBack: () => void
  onConfigCreated: (config: ModelsIssueImporterConfigResponse) => void
  onNext: () => void
  selectedOrgId: string
}

type TestStatus = 'error' | 'idle' | 'saving' | 'success' | 'testing'

function buildConfigBody(
  formData: WizardFormData,
): ModelsCreateIssueImporterConfig {
  return {
    accessToken: formData.accessToken,
    baseUrl: formData.baseUrl,
    checkFrequency: formData.checkFrequency,
    importerType: formData.importerType!,
    name: formData.name,
    ...(formData.importerType === 'github' && {
      resourceOwner: formData.resourceOwner,
      resourceOwnerType: formData.resourceOwnerType,
    }),
    ...(formData.importerType === 'jira' && {
      consumerKey: formData.consumerKey,
      privateKey: formData.privateKey,
    }),
    ...(formData.importerType === 'plane' && {
      apiKey: formData.apiKey,
      workspace: formData.workspace,
    }),
  }
}

export const TestConnectionStep = ({
  existingConfig,
  formData,
  onBack,
  onConfigCreated,
  onNext,
  selectedOrgId,
}: Props) => {
  const { t } = useTranslation('integrations')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()
  const hasTestedRef = useRef(false)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const testConnectivity = useTestConnectivity({
    onError: (err) => {
      logger.error('[TestConnectionStep] Connection test failed:', err)
      setTestStatus('error')
      setErrorMessage(
        t('issueImporters.wizard.test.failed', {
          defaultValue:
            'Connection test failed. Please check your credentials and URL.',
        }),
      )
      hasTestedRef.current = false
    },
    onSuccess: (data) => {
      if (data.status === 'success') {
        if (existingConfig) {
          // Config already created from a previous pass — skip creation
          setTestStatus('success')
          onConfigCreated(existingConfig)
          successTimeoutRef.current = setTimeout(() => {
            onNext()
          }, 1500)
        } else {
          setTestStatus('saving')
          const body = buildConfigBody(formData)
          createConfig.submit({ body, orgId: selectedOrgId })
        }
      } else {
        setTestStatus('error')
        setErrorMessage(
          data.message ||
            t('issueImporters.wizard.test.failed', {
              defaultValue:
                'Connection test failed. Please check your credentials and URL.',
            }),
        )
        hasTestedRef.current = false
      }
    },
  })

  const createConfig = useCreateConfig({
    onError: (err) => {
      logger.error('[TestConnectionStep] Config creation failed:', err)
      setTestStatus('error')
      setErrorMessage(
        t('issueImporters.wizard.test.createFailed', {
          defaultValue:
            'Connection succeeded but failed to save configuration.',
        }),
      )
      hasTestedRef.current = false
    },
    onSuccess: (config) => {
      setTestStatus('success')
      onConfigCreated(config)
      successTimeoutRef.current = setTimeout(() => {
        onNext()
      }, 1500)
    },
  })

  const runTest = useCallback(() => {
    if (hasTestedRef.current) return
    hasTestedRef.current = true

    setTestStatus('testing')
    setErrorMessage(undefined)

    const body = buildConfigBody(formData)
    testConnectivity.submit({ body, orgId: selectedOrgId })
  }, [formData, selectedOrgId, testConnectivity])

  const handleRetry = useCallback(() => {
    hasTestedRef.current = false
    testConnectivity.reset()
    createConfig.reset()
    runTest()
  }, [runTest, testConnectivity, createConfig])

  // Auto-test on mount (ref guard prevents re-runs)
  useEffect(() => {
    runTest()
  }, [runTest])

  // Clean up success timeout on unmount only — must be separate from the
  // auto-test effect because runTest changes identity when testConnectivity
  // state changes, which would clear the navigation timeout prematurely.
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        {(testStatus === 'testing' || testStatus === 'saving') && (
          <>
            <LucideIcon
              className="text-primary animate-spin"
              icon={Loader2}
              size={64}
            />
            <p className="text-base-content/70 mt-4">
              {testStatus === 'testing'
                ? t('issueImporters.wizard.test.testing', {
                    defaultValue: 'Testing connection...',
                  })
                : t('issueImporters.wizard.test.saving', {
                    defaultValue: 'Saving configuration...',
                  })}
            </p>
          </>
        )}

        {testStatus === 'success' && (
          <>
            <LucideIcon className="text-success" icon={CheckCircle} size={64} />
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
            <LucideIcon className="text-error" icon={XCircle} size={64} />
            <p className="text-error mt-4 font-semibold">
              {t('issueImporters.wizard.test.error', {
                defaultValue: 'Connection failed',
              })}
            </p>
            {errorMessage && (
              <div className="alert alert-error mt-4">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button
                fullWidth={false}
                onClick={onBack}
                size="sm"
                variant="ghost"
              >
                {t('actions.back', { defaultValue: 'Back' })}
              </Button>
              <Button
                fullWidth={false}
                onClick={handleRetry}
                size="sm"
                variant="primary"
              >
                <LucideIcon icon={RefreshCw} size={16} />
                {t('issueImporters.wizard.test.retry', {
                  defaultValue: 'Retry Connection Test',
                })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
