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

import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type ConnectionTestResult } from '~/features/integrations/hooks/use-connection-test'

type Props = {
  connectionTestMessage: string
  connectionTestResult: ConnectionTestResult
  handleTestConnection: () => void
  isSaving: boolean
  isTestingConnection: boolean
}

export const ConnectionTestPanel = ({
  connectionTestMessage,
  connectionTestResult,
  handleTestConnection,
  isSaving,
  isTestingConnection,
}: Props) => {
  const { t } = useTranslation('integrations')

  return (
    <div className="space-y-4">
      {connectionTestResult && (
        <div
          className={`alert ${connectionTestResult === 'success' ? 'alert-success' : 'alert-error'}`}
        >
          <span>{connectionTestMessage}</span>
        </div>
      )}
      <button
        className="btn btn-secondary w-full"
        disabled={isTestingConnection || isSaving}
        onClick={handleTestConnection}
        type="button"
      >
        {isTestingConnection ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('issueImporters.testConnection.testing', {
              defaultValue: 'Testing connection...',
            })}
          </>
        ) : (
          t('issueImporters.testConnection.test', {
            defaultValue: 'Test Connection',
          })
        )}
      </button>
      <p className="text-base-content/60 text-xs">
        {t('issueImporters.testConnection.editModeNote', {
          defaultValue:
            'Note: Enter your credentials above to test the connection. Leave empty to keep existing credentials when saving.',
        })}
      </p>
    </div>
  )
}
