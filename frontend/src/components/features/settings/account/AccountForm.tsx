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
import { Card, CardBody } from 'components/ui/cards/Card'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { ButtonGroup } from 'components/ui/forms/ButtonGroup'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { preventEnterOnForm } from 'components/ui/forms/input/shared/preventEnterOnForm'
import { useProfile } from 'lib/api/hooks/useProfile'
import { updateUserProfile } from 'lib/api/lasius/user/user'
import { emailValidationPattern } from 'lib/utils/data/validators'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { AUTH_PROVIDER_INTERNAL_LASIUS, LASIUS_DEMO_MODE } from 'projectConfig/constants'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIsClient } from 'usehooks-ts'

type Form = {
  email: string
  firstName: string
  lastName: string
}

export const AccountForm: React.FC = () => {
  const hookForm = useForm<Form>({ defaultValues: { email: '', firstName: '', lastName: '' } })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { firstName, lastName, email, role } = useProfile()
  const isClient = useIsClient()
  const session = useSession()
  const { addToast } = useToast()

  const { t } = useTranslation('common')

  useEffect(() => {
    hookForm.setValue('firstName', firstName)
    hookForm.setValue('lastName', lastName)
    hookForm.setValue('email', email)
  }, [email, firstName, hookForm, lastName])

  const onSubmit = async () => {
    if (LASIUS_DEMO_MODE === 'true') {
      addToast({
        message: t('account.profileChangesNotAllowedInDemo', {
          defaultValue: 'Profile changes are not allowed in demo mode',
        }),
        type: 'ERROR',
      })
      setIsSubmitting(false)
      return
    }
    const data = hookForm.getValues()
    setIsSubmitting(true)
    await updateUserProfile(data)
    addToast({
      message: t('account.status.settingsUpdated', { defaultValue: 'Account settings updated' }),
      type: 'SUCCESS',
    })
    setIsSubmitting(false)
  }

  if (!isClient) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {t('account.profileSettings.title', { defaultValue: 'Profile Information' })}
          </h2>
          <p className="text-base-content/70 mb-6 text-sm">
            {t('account.profileSettings.description', {
              defaultValue: 'Manage your personal information and account details.',
            })}
          </p>
          {}
          <form onSubmit={hookForm.handleSubmit(onSubmit)} onKeyDown={(e) => preventEnterOnForm(e)}>
            <FormBody>
              <FieldSet>
                <FormElement
                  label={t('common.forms.role', { defaultValue: 'Role' })}
                  htmlFor="role">
                  <Input id="role" readOnly value={role} tabIndex={-1} disabled />
                </FormElement>
                <FormElement
                  label={t('common.forms.firstName', { defaultValue: 'First name' })}
                  htmlFor="firstName"
                  required>
                  <Input
                    id="firstName"
                    {...hookForm.register('firstName', { required: true })}
                    aria-describedby="firstName-error"
                    autoComplete="given-name"
                  />
                  <FormErrorBadge
                    id="firstName-error"
                    error={hookForm.formState.errors.firstName}
                  />
                </FormElement>
                <FormElement
                  label={t('common.forms.lastName', { defaultValue: 'Last name' })}
                  htmlFor="lastName"
                  required>
                  <Input
                    id="lastName"
                    {...hookForm.register('lastName', { required: true })}
                    aria-describedby="lastName-error"
                    autoComplete="family-name"
                  />
                  <FormErrorBadge id="lastName-error" error={hookForm.formState.errors.lastName} />
                </FormElement>
                <FormElementSpacer />
                <FormElement
                  label={t('common.forms.email', { defaultValue: 'Email' })}
                  htmlFor="email"
                  required>
                  <Input
                    id="email"
                    readOnly={session?.data?.provider !== AUTH_PROVIDER_INTERNAL_LASIUS}
                    {...hookForm.register('email', {
                      required: true,
                      pattern: emailValidationPattern,
                    })}
                    aria-describedby="email-error"
                    autoComplete="email"
                  />
                  <FormErrorBadge id="email-error" error={hookForm.formState.errors.email} />
                </FormElement>
              </FieldSet>
              <ButtonGroup className="justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {t('common.actions.saveChanges', { defaultValue: 'Save changes' })}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
