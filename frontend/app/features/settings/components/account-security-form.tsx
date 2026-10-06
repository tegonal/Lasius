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

import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { Eye, EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Label } from '~/components/primitives/typography/label'
import { Card, CardBody } from '~/components/ui/cards/card'
import { ErrorSign } from '~/components/ui/feedback/error-sign'
import { useToast } from '~/components/ui/feedback/use-toast'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormElementSpacer } from '~/components/ui/forms/form-element-spacer'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { preventEnterOnForm } from '~/components/ui/forms/input/prevent-enter-on-form'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useGuardedSubmit } from '~/features/settings/hooks/use-guarded-submit'
import { requiredString } from '~/lib/conform-helpers'
import { type SchemaTranslationFunction, untyped } from '~/lib/i18n-types'
import { useUpdateUserPassword } from '~/services/api/lasius-hooks/oauth2-provider/oauth2-provider'

const createPasswordChangeSchema = (t: SchemaTranslationFunction) =>
  z
    .object({
      confirmPassword: requiredString(
        t('common:validation.confirmPasswordRequired', 'Please confirm your password'),
      ),
      newPassword: z
        .string({ error: t('common:validation.passwordTooShort', 'Minimum 9 characters') })
        .superRefine((value, context) => {
          if (value.length < 9) {
            context.addIssue({
              code: 'custom',
              error: t('common:validation.passwordTooShort', 'Minimum 9 characters'),
            })
          }
          if (!/[A-Z]/.test(value)) {
            context.addIssue({
              code: 'custom',
              error: t('common:validation.missingUppercase', 'Must contain uppercase letter'),
            })
          }
          if (!/\d/.test(value)) {
            context.addIssue({
              code: 'custom',
              error: t('common:validation.missingNumber', 'Must contain a number'),
            })
          }
        }),
      password: requiredString(t('common:validation.passwordRequired', 'Password is required')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      error: t('common:validation.passwordMismatch', 'Passwords do not match'),
      path: ['confirmPassword'],
    })

type AccountSecurityFormProperties = {
  demoMode: boolean
}

export const AccountSecurityForm = ({ demoMode }: AccountSecurityFormProperties) => {
  const { t } = useTranslation('settings')
  const [showPasswords, setShowPasswords] = useState(false)
  const { addToast } = useToast()

  const schema = useMemo(() => createPasswordChangeSchema(untyped(t)), [t])

  // A new form id clears the fields after a successful change (pitfalls/rr7-conform-form-in-modal).
  const [resetKey, setResetKey] = useState(0)
  const passwordApi = useUpdateUserPassword({
    onSuccess: () => {
      setResetKey((key) => key + 1)
      addToast({
        message: t('account.status.passwordUpdated', 'Password updated'),
        type: 'SUCCESS',
      })
    },
  })

  const onSubmit = useGuardedSubmit<z.output<typeof schema>>(
    demoMode,
    ({ newPassword, password }) => {
      passwordApi.submit({ body: { newPassword, password } })
    },
  )

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: { confirmPassword: '', newPassword: '', password: '' },
    id: `account-password-${resetKey}`,
    onSubmit,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const handleTogglePasswordsVisible = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setShowPasswords(!showPasswords)
  }

  const passwordType = showPasswords ? 'text' : 'password'

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <form {...getFormProps(form)}>
            <div onKeyDown={preventEnterOnForm} role="presentation">
              <FormBody>
                <FieldSet>
                  <FormElement>
                    <Label htmlFor={fields.password.id}>{t('forms.password', 'Password')}</Label>
                    <Input
                      {...getInputProps(fields.password, { type: passwordType })}
                      autoComplete="off"
                      key={fields.password.key}
                    />
                    <FormFieldErrors errors={fields.password.errors} />
                  </FormElement>
                  <FormElementSpacer />
                  <FormElement>
                    <Label htmlFor={fields.newPassword.id}>
                      {t('forms.newPassword', 'New password')}
                    </Label>
                    <Input
                      {...getInputProps(fields.newPassword, {
                        type: passwordType,
                      })}
                      autoComplete="off"
                      key={fields.newPassword.key}
                    />
                    {fields.newPassword.errors && fields.newPassword.errors.length > 0 && (
                      <div className="-mt-2 flex flex-col gap-1">
                        {fields.newPassword.errors.map((message) => (
                          <div className="badge badge-warning" key={message}>
                            <ErrorSign />
                            {message}
                          </div>
                        ))}
                      </div>
                    )}
                  </FormElement>
                  <FormElement>
                    <Label htmlFor={fields.confirmPassword.id}>
                      {t('forms.confirmNewPassword', 'Confirm new password')}
                    </Label>
                    <Input
                      {...getInputProps(fields.confirmPassword, {
                        type: passwordType,
                      })}
                      autoComplete="off"
                      key={fields.confirmPassword.key}
                    />
                    <FormFieldErrors errors={fields.confirmPassword.errors} />
                  </FormElement>
                  <FormElement>
                    <Button onClick={handleTogglePasswordsVisible} type="button" variant="ghost">
                      <LucideIcon icon={showPasswords ? Eye : EyeOff} size={24} />
                      <span>
                        {showPasswords
                          ? t('ui.hidePasswords', 'Hide passwords')
                          : t('ui.showPasswords', 'Show passwords')}
                      </span>
                    </Button>
                  </FormElement>
                </FieldSet>
                <ButtonGroup>
                  <Button disabled={passwordApi.isLoading} type="submit" variant="primary">
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
