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

import { getFormProps, useForm, useInputControl } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevalidator } from 'react-router'
import { type z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { useToast } from '~/components/ui/feedback/use-toast'
import { Modal } from '~/components/ui/overlays/modal/modal'
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
import {
  buildConfigUpdateBody,
  DEFAULT_CHECK_FREQUENCY_MS,
  getEditConfigDefaults,
  getImporterTypeOfConfig,
} from '~/features/integrations/lib/config-defaults'
import {
  allFieldsConstraintSchema,
  createConfigSchema,
} from '~/features/integrations/lib/config-schemas'
import { useUpdateConfig } from '~/services/api/lasius-hooks/issue-importers/issue-importers'
import { type ModelsIssueImporterConfigResponse } from '~/services/api/lasius/modelsIssueImporterConfigResponse'

type Properties = {
  config: ModelsIssueImporterConfigResponse | null
  onClose: () => void
  open: boolean
  selectedOrgId: string
}

export const GenericConfigModal = ({ config, onClose, open, selectedOrgId }: Properties) => {
  const { t } = useTranslation('integrations')
  const { addToast } = useToast()
  const revalidator = useRevalidator()
  const formReference = useRef<HTMLFormElement>(null)
  const nameInputReference = useRef<HTMLInputElement>(null)

  const importerType = config ? getImporterTypeOfConfig(config) : 'gitlab'

  const schema = useMemo(() => createConfigSchema(t, importerType, true), [t, importerType])
  const defaultValue = useMemo(() => getEditConfigDefaults(config), [config])

  const updateApi = useUpdateConfig({
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

  const isSaving = updateApi.isSubmitting

  const [form, fields] = useForm<
    z.input<typeof allFieldsConstraintSchema>,
    z.output<typeof allFieldsConstraintSchema>
  >({
    constraint: getZodConstraint(allFieldsConstraintSchema),
    defaultValue,
    id: open && config ? `edit-config-${config.id}` : undefined,
    onSubmit(event, { submission }) {
      event.preventDefault()
      if (!config || submission?.status !== 'success') return

      updateApi.submit({
        body: buildConfigUpdateBody(submission.value),
        configId: config.id,
        orgId: selectedOrgId,
      })
    },
    onValidate({ formData: fd }) {
      // The platform schema validates; the superset type only gives Conform the field names.
      return parseWithZod(fd, {
        schema: schema as typeof allFieldsConstraintSchema,
      })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const accessTokenControl = useInputControl(fields.accessToken)
  const baseUrlControl = useInputControl(fields.baseUrl)
  const checkFrequencyControl = useInputControl(fields.checkFrequency)

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
    open,
    selectedOrgId,
  })

  // Reset test state when config changes or modal opens
  useEffect(() => {
    if (config && open) {
      resetTestState()
    }
  }, [config, open, resetTestState])

  if (!config) return null

  return (
    <Modal initialFocus={nameInputReference} onClose={onClose} open={open} size="xl">
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
                inputRef={nameInputReference}
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
    </Modal>
  )
}
