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

import { zodResolver } from '@hookform/resolvers/zod'
import { type TFunction } from 'i18next'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Card, CardBody } from '~/components/ui/cards/card'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormElementSpacer } from '~/components/ui/forms/form-element-spacer'
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { preventEnterOnForm } from '~/components/ui/forms/input/prevent-enter-on-form'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { useUpdateUserProfile } from '~/services/api/lasius-hooks/user/user'

const createAccountSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .min(
        1,
        t('validation.emailRequired', {
          defaultValue: 'Email is required',
        }),
      )
      .email({
        message: t('validation.emailInvalid', {
          defaultValue: 'Invalid email address',
        }),
      }),
    firstName: z.string().min(
      1,
      t('validation.firstNameRequired', {
        defaultValue: 'First name is required',
      }),
    ),
    lastName: z.string().min(
      1,
      t('validation.lastNameRequired', {
        defaultValue: 'Last name is required',
      }),
    ),
  })

interface AccountFormProps {
  demoMode: boolean
}

type FormData = z.infer<ReturnType<typeof createAccountSchema>>

export const AccountForm = ({ demoMode }: AccountFormProps) => {
  const { t } = useTranslation('common')
  const layoutData = useLayoutLoaderData()
  const user = layoutData?.user
  const tokenIssuer = layoutData?.tokenIssuer
  const { addToast } = useToast()

  const profileApi = useUpdateUserProfile({
    onSuccess: () => {
      addToast({
        message: t('account.status.settingsUpdated', {
          defaultValue: 'Account settings updated',
        }),
        type: 'SUCCESS',
      })
    },
  })

  const schema = useMemo(() => createAccountSchema(t), [t])

  const hookForm = useForm<FormData>({
    defaultValues: { email: '', firstName: '', lastName: '' },
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (user) {
      hookForm.setValue('firstName', user.firstName || '')
      hookForm.setValue('lastName', user.lastName || '')
      hookForm.setValue('email', user.email || '')
    }
  }, [user, hookForm])

  const onSubmit = (data: FormData) => {
    if (demoMode) {
      addToast({
        message: t('account.profileChangesNotAllowedInDemo', {
          defaultValue: 'Profile changes are not allowed in demo mode',
        }),
        type: 'ERROR',
      })
      return
    }

    const submitArgs: Parameters<typeof profileApi.submit>[0] = {
      body: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    }
    profileApi.submit(submitArgs)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {t('account.profileSettings.title', {
              defaultValue: 'Profile Information',
            })}
          </h2>
          <p className="text-base-content/70 mb-6 text-sm">
            {t('account.profileSettings.description', {
              defaultValue:
                'Manage your personal information and account details.',
            })}
          </p>
          <form
            onKeyDown={(e) => preventEnterOnForm(e)}
            onSubmit={hookForm.handleSubmit(onSubmit)}
          >
            <FormBody>
              <FieldSet>
                <FormElement
                  htmlFor="role"
                  label={t('common.forms.role', {
                    defaultValue: 'Role',
                  })}
                >
                  <Input
                    disabled
                    id="role"
                    readOnly
                    tabIndex={-1}
                    value={user?.role || ''}
                  />
                </FormElement>
                <FormElement
                  htmlFor="firstName"
                  label={t('common.forms.firstName', {
                    defaultValue: 'First name',
                  })}
                  required
                >
                  <Input
                    aria-describedby="firstName-error"
                    autoComplete="given-name"
                    id="firstName"
                    {...hookForm.register('firstName')}
                  />
                  <FormErrorBadge
                    error={hookForm.formState.errors.firstName}
                    id="firstName-error"
                  />
                </FormElement>
                <FormElement
                  htmlFor="lastName"
                  label={t('common.forms.lastName', {
                    defaultValue: 'Last name',
                  })}
                  required
                >
                  <Input
                    aria-describedby="lastName-error"
                    autoComplete="family-name"
                    id="lastName"
                    {...hookForm.register('lastName')}
                  />
                  <FormErrorBadge
                    error={hookForm.formState.errors.lastName}
                    id="lastName-error"
                  />
                </FormElement>
                <FormElementSpacer />
                <FormElement
                  htmlFor="email"
                  label={t('common.forms.email', {
                    defaultValue: 'Email',
                  })}
                  required
                >
                  <Input
                    aria-describedby="email-error"
                    autoComplete="email"
                    id="email"
                    readOnly={tokenIssuer !== 'internal'}
                    {...hookForm.register('email')}
                  />
                  <FormErrorBadge
                    error={hookForm.formState.errors.email}
                    id="email-error"
                  />
                </FormElement>
              </FieldSet>
              <ButtonGroup className="justify-end">
                <Button disabled={profileApi.isSubmitting} type="submit">
                  {t('common.actions.saveChanges', {
                    defaultValue: 'Save changes',
                  })}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
