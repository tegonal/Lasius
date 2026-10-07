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
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'

export type TestStatus = 'error' | 'idle' | 'saving' | 'success' | 'testing'

type TestStatusViewProperties = {
  errorMessage?: string
  onBack: () => void
  onRetry: () => void
  testStatus: TestStatus
}

export const TestStatusView = ({
  errorMessage,
  onBack,
  onRetry,
  testStatus,
}: TestStatusViewProperties) => {
  const { t } = useTranslation('integrations')

  const progressLabels = {
    saving: t('issueImporters.wizard.test.saving', {
      defaultValue: 'Saving configuration...',
    }),
    testing: t('issueImporters.wizard.test.testing', {
      defaultValue: 'Testing connection...',
    }),
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        {(testStatus === 'testing' || testStatus === 'saving') && (
          <>
            <LucideIcon className="text-primary animate-spin" icon={Loader2} size={64} />
            <p className="text-base-content/70 mt-4">{progressLabels[testStatus]}</p>
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
              <Button fullWidth={false} onClick={onBack} size="sm" variant="ghost">
                {t('actions.back', { defaultValue: 'Back' })}
              </Button>
              <Button fullWidth={false} onClick={onRetry} size="sm" variant="primary">
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
