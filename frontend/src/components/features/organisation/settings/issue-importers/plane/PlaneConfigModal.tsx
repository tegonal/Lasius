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
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { Alert } from 'components/ui/feedback/Alert'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { DurationInputMinutes } from 'components/ui/forms/input/DurationInputMinutes'
import { Modal } from 'components/ui/overlays/modal/Modal'
import {
  useCreatePlaneConfig,
  useUpdatePlaneConfig,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { mutate } from 'swr'

import type { ModelsPlaneConfigResponse } from 'lib/api/lasius'

type Props = {
  open: boolean
  onClose: () => void
  config?: ModelsPlaneConfigResponse
  orgId: string
}

type FormData = {
  name: string
  baseUrl: string
  apiKey: string
  checkFrequency: number
}

export const PlaneConfigModal: React.FC<Props> = ({ open, onClose, config, orgId }) => {
  const { t } = useTranslation('common')
  const isEdit = !!config
  const { trigger: createConfig, isMutating: isCreating } = useCreatePlaneConfig(orgId)
  const { trigger: updateConfig, isMutating: isUpdating } = useUpdatePlaneConfig(
    orgId,
    config?.id || { value: '' },
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      baseUrl: '',
      apiKey: '',
      checkFrequency: 300000,
    },
  })

  const watchCheckFrequency = watch('checkFrequency')

  useEffect(() => {
    if (config) {
      reset({
        name: config.name,
        baseUrl: String(config.baseUrl),
        apiKey: '',
        checkFrequency: config.checkFrequency,
      })
    } else {
      reset({
        name: '',
        baseUrl: '',
        apiKey: '',
        checkFrequency: 300000,
      })
    }
  }, [config, reset])

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && config) {
        await updateConfig({
          name: data.name,
          baseUrl: data.baseUrl,
          ...(data.apiKey && { apiKey: data.apiKey }),
          checkFrequency: data.checkFrequency,
        })
      } else {
        await createConfig({
          name: data.name,
          baseUrl: data.baseUrl,
          apiKey: data.apiKey,
          checkFrequency: data.checkFrequency,
          projects: [],
        })
      }
      await mutate(`/organisations/${orgId}/issue-importers/plane`)
      onClose()
    } catch (error) {
      console.error(
        t('issueImporters.errors.saveFailed.plane', {
          defaultValue: 'Failed to save Plane config',
        }),
        error,
      )
    }
  }

  const isSaving = isCreating || isUpdating

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Alert variant="info">
            <div className="text-sm">
              <p className="font-semibold">
                {t('issueImporters.plane.howToCreateToken', {
                  defaultValue: 'How to create a Plane Personal Access Token:',
                })}
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  {t('issueImporters.plane.step1', {
                    defaultValue: 'Log into your Plane account or instance',
                  })}
                </li>
                <li>
                  {t('issueImporters.plane.step2', {
                    defaultValue: 'Go to Profile Settings → Personal Access Tokens',
                  })}
                </li>
                <li>
                  {t('issueImporters.plane.step3', {
                    defaultValue: 'Click "Add personal access token"',
                  })}
                </li>
                <li>
                  {t('issueImporters.plane.step4', {
                    defaultValue: 'Enter a name and copy the generated token immediately',
                  })}
                </li>
              </ol>
              <p className="text-base-content/70 mt-2">
                {t('issueImporters.plane.tokenWarning', {
                  defaultValue: 'Note: The token will only be shown once. Store it securely.',
                })}
              </p>
            </div>
          </Alert>

          <FormElement>
            <Label htmlFor="name">
              {t('issueImporters.fields.name', { defaultValue: 'Configuration Name' })}
            </Label>
            <Input
              {...register('name', {
                required: t('issueImporters.validation.nameRequired', {
                  defaultValue: 'Name is required',
                }),
              })}
              id="name"
              placeholder={t('issueImporters.fields.namePlaceholder.plane', {
                defaultValue: 'e.g., Company Plane',
              })}
              autoFocus
            />
            {errors.name && <FormErrorBadge error={errors.name} />}
          </FormElement>

          <FormElement>
            <Label htmlFor="baseUrl">
              {t('issueImporters.fields.baseUrl', { defaultValue: 'Base URL' })}
            </Label>
            <Input
              {...register('baseUrl', {
                required: t('issueImporters.validation.baseUrlRequired', {
                  defaultValue: 'Base URL is required',
                }),
              })}
              id="baseUrl"
              placeholder={t('issueImporters.fields.baseUrlPlaceholder.plane', {
                defaultValue: 'https://plane.company.com',
              })}
            />
            {errors.baseUrl && <FormErrorBadge error={errors.baseUrl} />}
          </FormElement>

          <FormElement>
            <Label htmlFor="apiKey">
              {isEdit
                ? t('issueImporters.fields.apiKeyEdit', {
                    defaultValue: 'API Key (leave empty to keep current)',
                  })
                : t('issueImporters.fields.apiKey', { defaultValue: 'API Key' })}
            </Label>
            <Input
              {...register('apiKey', {
                required:
                  !isEdit &&
                  t('issueImporters.validation.apiKeyRequired', {
                    defaultValue: 'API key is required',
                  }),
              })}
              id="apiKey"
              type="password"
              placeholder="plane-api-key-xxxxxxxxxxxxx"
            />
            {errors.apiKey && <FormErrorBadge error={errors.apiKey} />}
          </FormElement>

          <FormElement>
            <Label htmlFor="checkFrequency">
              {t('issueImporters.checkInterval', { defaultValue: 'Check Interval' })}
            </Label>
            <DurationInputMinutes
              id="checkFrequency"
              value={watchCheckFrequency}
              onChange={(ms) => setValue('checkFrequency', ms, { shouldValidate: true })}
              error={!!errors.checkFrequency}
              placeholder="05:00"
            />
            {errors.checkFrequency && <FormErrorBadge error={errors.checkFrequency} />}
            <p className="text-base-content/60 mt-1 text-xs">
              {t('issueImporters.checkIntervalHelp', {
                defaultValue: 'How often to check for new issues',
              })}
            </p>
          </FormElement>
        </div>

        <ButtonGroup className="mt-6">
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving
              ? t('issueImporters.actions.saving', { defaultValue: 'Saving...' })
              : isEdit
                ? t('issueImporters.actions.update', { defaultValue: 'Update' })
                : t('issueImporters.actions.create', { defaultValue: 'Create' })}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('issueImporters.actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
        </ButtonGroup>
      </form>
    </Modal>
  )
}
