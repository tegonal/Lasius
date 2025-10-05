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
  useCreateJiraConfig,
  useUpdateJiraConfig,
} from 'lib/api/lasius/issue-importers/issue-importers'
import { useTranslation } from 'next-i18next'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { mutate } from 'swr'

import type { ModelsJiraConfigResponse } from 'lib/api/lasius'

type Props = {
  open: boolean
  onClose: () => void
  config?: ModelsJiraConfigResponse
  orgId: string
}

type FormData = {
  name: string
  baseUrl: string
  consumerKey: string
  privateKey: string
  accessToken: string
  checkFrequency: number
}

export const JiraConfigModal: React.FC<Props> = ({ open, onClose, config, orgId }) => {
  const { t } = useTranslation('common')
  const isEdit = !!config
  const { trigger: createConfig, isMutating: isCreating } = useCreateJiraConfig(orgId)
  const { trigger: updateConfig, isMutating: isUpdating } = useUpdateJiraConfig(
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
      consumerKey: '',
      privateKey: '',
      accessToken: '',
      checkFrequency: 300000,
    },
  })

  const watchCheckFrequency = watch('checkFrequency')

  useEffect(() => {
    if (config) {
      reset({
        name: config.name,
        baseUrl: String(config.baseUrl),
        consumerKey: '',
        privateKey: '',
        accessToken: '',
        checkFrequency: config.checkFrequency,
      })
    } else {
      reset({
        name: '',
        baseUrl: '',
        consumerKey: '',
        privateKey: '',
        accessToken: '',
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
          consumerKey: data.consumerKey,
          ...(data.privateKey && { privateKey: data.privateKey }),
          ...(data.accessToken && { accessToken: data.accessToken }),
          checkFrequency: data.checkFrequency,
        })
      } else {
        await createConfig({
          name: data.name,
          baseUrl: data.baseUrl,
          consumerKey: data.consumerKey,
          privateKey: data.privateKey,
          accessToken: data.accessToken,
          checkFrequency: data.checkFrequency,
          projects: [],
        })
      }
      await mutate(`/organisations/${orgId}/issue-importers/jira`)
      onClose()
    } catch (error) {
      console.error(
        t('issueImporters.errors.saveFailed.jira', {
          defaultValue: 'Failed to save Jira config',
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
                {t('issueImporters.jira.howToSetupOAuth', {
                  defaultValue: 'How to set up Jira OAuth 1.0a authentication:',
                })}
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  {t('issueImporters.jira.step1', {
                    defaultValue: 'Generate RSA key pair using OpenSSL:',
                  })}{' '}
                  <code className="text-base-content/80 bg-base-300 ml-1 rounded px-1 py-0.5 text-xs">
                    openssl genrsa -out jira_privatekey.pem 1024
                  </code>
                </li>
                <li>
                  {t('issueImporters.jira.step2', {
                    defaultValue: 'In Jira: Settings → Applications → Application Links',
                  })}
                </li>
                <li>
                  {t('issueImporters.jira.step3', {
                    defaultValue: 'Create incoming link with your consumer key and public key',
                  })}
                </li>
                <li>
                  {t('issueImporters.jira.step4', {
                    defaultValue: 'Complete the OAuth flow to get your access token',
                  })}
                </li>
              </ol>
              <p className="text-base-content/70 mt-2">
                {t('issueImporters.jira.oauthWarning', {
                  defaultValue:
                    'Note: OAuth 1.0a is deprecated. Consider using OAuth 2.0 for new integrations.',
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
              placeholder={t('issueImporters.fields.namePlaceholder.jira', {
                defaultValue: 'e.g., Company Jira',
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
              placeholder={t('issueImporters.fields.baseUrlPlaceholder.jira', {
                defaultValue: 'https://company.atlassian.net',
              })}
            />
            {errors.baseUrl && <FormErrorBadge error={errors.baseUrl} />}
          </FormElement>

          <FormElement>
            <Label htmlFor="consumerKey">
              {t('issueImporters.fields.consumerKey', { defaultValue: 'OAuth Consumer Key' })}
            </Label>
            <Input
              {...register('consumerKey', {
                required:
                  !isEdit &&
                  t('issueImporters.validation.consumerKeyRequired', {
                    defaultValue: 'Consumer key is required',
                  }),
              })}
              id="consumerKey"
              placeholder="jira-oauth-consumer"
            />
            {errors.consumerKey && <FormErrorBadge error={errors.consumerKey} />}
          </FormElement>

          <FormElement>
            <Label htmlFor="privateKey">
              {isEdit
                ? t('issueImporters.fields.privateKeyEdit', {
                    defaultValue: 'OAuth Private Key (leave empty to keep current)',
                  })
                : t('issueImporters.fields.privateKey', { defaultValue: 'OAuth Private Key' })}
            </Label>
            <Input
              {...register('privateKey', {
                required:
                  !isEdit &&
                  t('issueImporters.validation.privateKeyRequired', {
                    defaultValue: 'Private key is required',
                  }),
              })}
              id="privateKey"
              type="password"
              placeholder="-----BEGIN RSA PRIVATE KEY-----"
            />
            {errors.privateKey && <FormErrorBadge error={errors.privateKey} />}
          </FormElement>

          <FormElement>
            <Label htmlFor="accessToken">
              {isEdit
                ? t('issueImporters.fields.oauthAccessTokenEdit', {
                    defaultValue: 'OAuth Access Token (leave empty to keep current)',
                  })
                : t('issueImporters.fields.oauthAccessToken', {
                    defaultValue: 'OAuth Access Token',
                  })}
            </Label>
            <Input
              {...register('accessToken', {
                required:
                  !isEdit &&
                  t('issueImporters.validation.accessTokenRequired', {
                    defaultValue: 'Access token is required',
                  }),
              })}
              id="accessToken"
              type="password"
              placeholder="your-oauth-access-token"
            />
            {errors.accessToken && <FormErrorBadge error={errors.accessToken} />}
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
