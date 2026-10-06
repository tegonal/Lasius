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

import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Card, CardBody } from '~/components/ui/cards/card'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FormField } from '~/components/ui/forms/conform/form-field'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormElementSpacer } from '~/components/ui/forms/form-element-spacer'
import { preventEnterOnForm } from '~/components/ui/forms/input/prevent-enter-on-form'
import { useGuardedSubmit } from '~/features/settings/hooks/use-guarded-submit'
import { useLayoutLoaderData } from '~/hooks/use-layout-loader-data'
import { type SchemaTranslationFunction, untyped } from '~/lib/i18n-types'
import { useUpdateUserProfile } from '~/services/api/lasius-hooks/user/user'

const createAccountSchema = (t: SchemaTranslationFunction) =>
  z.object({
    firstName: z
      .string({
        error: t('common:validation.firstNameRequired', 'First name is required'),
      })
      .min(1, t('common:validation.firstNameRequired', 'First name is required')),
    lastName: z
      .string({
        error: t('common:validation.lastNameRequired', 'Last name is required'),
      })
      .min(1, t('common:validation.lastNameRequired', 'Last name is required')),
  })

interface AccountFormProperties {
  demoMode: boolean
}

export const AccountForm = ({ demoMode }: AccountFormProperties) => {
  const { t } = useTranslation('settings')
  const layoutData = useLayoutLoaderData()
  const user = layoutData?.user
  const { addToast } = useToast()

  const profileApi = useUpdateUserProfile({
    onSuccess: () => {
      addToast({
        message: t('account.status.settingsUpdated', 'Account settings updated'),
        type: 'SUCCESS',
      })
    },
  })

  const schema = useMemo(() => createAccountSchema(untyped(t)), [t])

  const onSubmit = useGuardedSubmit<z.output<typeof schema>>(
    demoMode,
    ({ firstName, lastName }) => {
      profileApi.submit({ body: { firstName, lastName } })
    },
  )

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
    onSubmit,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {t('account.profileSettings.title', 'Profile Information')}
          </h2>
          <p className="text-base-content/70 mb-6 text-sm">
            {t(
              'account.profileSettings.description',
              'Manage your personal information and account details.',
            )}
          </p>
          <form {...getFormProps(form)}>
            <div onKeyDown={preventEnterOnForm} role="presentation">
              <FormBody>
                <FieldSet>
                  <FormElement htmlFor="role" label={t('forms.role', 'Role')}>
                    <Input disabled id="role" readOnly tabIndex={-1} value={user?.role || ''} />
                  </FormElement>
                  <FormField
                    autoComplete="given-name"
                    field={fields.firstName}
                    label={t('forms.firstName', 'First name')}
                    required
                  />
                  <FormField
                    autoComplete="family-name"
                    field={fields.lastName}
                    label={t('forms.lastName', 'Last name')}
                    required
                  />
                  <FormElementSpacer />
                  {/* The backend finds the user by this email at sign-in, so it refuses a change. */}
                  <FormElement htmlFor="email" label={t('forms.email', 'Email')}>
                    <Input disabled id="email" readOnly tabIndex={-1} value={user?.email ?? ''} />
                  </FormElement>
                </FieldSet>
                <ButtonGroup className="justify-end">
                  <Button disabled={profileApi.isSubmitting} type="submit">
                    {t('actions.saveChanges', 'Save changes')}
                  </Button>
                </ButtonGroup>
              </FormBody>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
