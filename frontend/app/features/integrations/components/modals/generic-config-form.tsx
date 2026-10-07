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

import { getFormProps } from '@conform-to/react'
import { type RefObject, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'

import { Button } from '~/components/primitives/buttons/button'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ModalBody } from '~/components/ui/overlays/modal/modal-body'
import { ModalCloseButton } from '~/components/ui/overlays/modal/modal-close-button'
import { ModalHeader } from '~/components/ui/overlays/modal/modal-header'
import { ModalHelpButton } from '~/features/help/components/help-button'
import { EditCredentialFields } from '~/features/integrations/components/modals/config-fields/edit-credential-fields'
import { ConnectionTestPanel } from '~/features/integrations/components/modals/connection-test-panel'
import { CheckFrequencyField } from '~/features/integrations/components/shared/check-frequency-field'
import { ConfigBaseUrlField } from '~/features/integrations/components/shared/config-base-url-field'
import { ConfigNameField } from '~/features/integrations/components/shared/config-name-field'
import { ProviderInstructions } from '~/features/integrations/components/shared/provider-instructions'
import { useConnectionTest } from '~/features/integrations/hooks/use-connection-test'
import { useImporterConfigForm } from '~/features/integrations/hooks/use-importer-config-form'
import {
  buildConfigUpdateBody,
  DEFAULT_CHECK_FREQUENCY_MS,
  getEditConfigDefaults,
  getImporterTypeOfConfig,
} from '~/features/integrations/lib/config-defaults'
import { createConfigSchema } from '~/features/integrations/lib/config-schemas'
import { useUpdateConfig } from '~/services/api/lasius-hooks/issue-importers/issue-importers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

type GenericConfigFormProperties = {
  config: ModelsIssueImporterConfigResponse
  nameInputRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  selectedOrgId: string
}

export const GenericConfigForm = ({
  config,
  nameInputRef,
  onClose,
  selectedOrgId,
}: GenericConfigFormProperties) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()
  const formReference = useRef<HTMLFormElement>(null)

  const importerType = getImporterTypeOfConfig(config)

  const schema = useMemo(() => createConfigSchema(t, importerType, true), [t, importerType])
  const defaultValue = useMemo(() => getEditConfigDefaults(config), [config])

  const { isSubmitting: isSaving, submit: submitUpdate } = useUpdateConfig({
    onError: () => {
      addToast({
        message: t('issueImporters.errors.updateFailed', {
          defaultValue: 'Failed to update integration',
        }),
        type: 'ERROR',
      })
    },
    onSuccess: () => {
      onClose()
      void revalidator.revalidate()
      addToast({
        message: t('issueImporters.success.configUpdated', {
          defaultValue: 'Integration updated successfully',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const { accessTokenControl, baseUrlControl, checkFrequencyControl, fields, form } =
    useImporterConfigForm({
      defaultValue,
      id: `edit-config-${config.id}`,
      onValidSubmit: (value) => {
        submitUpdate({
          body: buildConfigUpdateBody(value),
          configId: config.id,
          orgId: selectedOrgId,
        })
      },
      schema,
    })

  const {
    connectionTestMessage,
    connectionTestResult,
    handleTestConnection,
    isTestingConnection,
    resetTestState,
  } = useConnectionTest({
    config,
    formRef: formReference,
    importerType,
    selectedOrgId,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0">
        <ModalCloseButton onClose={onClose} />
        <ModalHeader actionSlot={<ModalHelpButton helpKey="modal-importer-config" />}>
          {t('issueImporters.titles.edit', { defaultValue: 'Edit Integration' })}
        </ModalHeader>
        <p className="text-base-content/60 mb-6 text-sm">
          {t('issueImporters.descriptions.edit', {
            defaultValue: 'Update the configuration for this issue importer integration.',
          })}
        </p>
      </div>

      <ModalBody>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <form {...getFormProps(form)} className="space-y-4" ref={formReference}>
            <ConfigNameField
              field={fields.name}
              importerType={importerType}
              inputRef={nameInputRef}
            />
            <ConfigBaseUrlField
              control={baseUrlControl}
              field={fields.baseUrl}
              importerType={importerType}
            />
            <EditCredentialFields
              accessTokenControl={accessTokenControl}
              baseUrl={config.baseUrl}
              fields={fields}
              importerType={importerType}
              resetTestState={resetTestState}
              selectedOrgId={selectedOrgId}
            />
            <CheckFrequencyField
              control={checkFrequencyControl}
              fallbackMs={config.checkFrequency || DEFAULT_CHECK_FREQUENCY_MS}
              field={fields.checkFrequency}
            />

            <ConnectionTestPanel
              connectionTestMessage={connectionTestMessage}
              connectionTestResult={connectionTestResult}
              handleTestConnection={handleTestConnection}
              isSaving={isSaving}
              isTestingConnection={isTestingConnection}
            />

            <div className="border-base-300 border-t pt-4">
              <div className="flex gap-2">
                <Button disabled={isSaving} fullWidth={false} type="submit" variant="primary">
                  {isSaving
                    ? t('actions.saving', { defaultValue: 'Saving...' })
                    : t('issueImporters.actions.update', { defaultValue: 'Update' })}
                </Button>
                <Button
                  disabled={isSaving}
                  fullWidth={false}
                  onClick={onClose}
                  type="button"
                  variant="ghost">
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
              </div>
            </div>
          </form>

          <div className="hidden lg:block">
            <ProviderInstructions importerType={importerType} />
          </div>
        </div>
      </ModalBody>
    </div>
  )
}
