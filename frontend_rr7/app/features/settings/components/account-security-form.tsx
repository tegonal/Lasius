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
import { Eye, EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { preventEnterOnForm } from '~/components/ui/forms/input/prevent-enter-on-form'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { useUpdateUserPassword } from '~/services/api/lasius-hooks/oauth2-provider/oauth2-provider'

const createPasswordChangeSchema = (t: TFunction) =>
  z
    .object({
      confirmPassword: z.string().min(1, {
        message: t(
          'validation.confirmPasswordRequired',
          'Please confirm your password',
        ),
      }),
      newPassword: z.string().superRefine((val, ctx) => {
        if (val.length < 9) {
          ctx.addIssue({
            code: 'custom',
            message: t('validation.passwordTooShort', 'Minimum 9 characters'),
            params: { type: 'notEnoughCharactersPassword' },
          })
        }
        if (!/[A-Z]/.test(val)) {
          ctx.addIssue({
            code: 'custom',
            message: t(
              'validation.missingUppercase',
              'Must contain uppercase letter',
            ),
            params: { type: 'noUppercase' },
          })
        }
        if (!/\d/.test(val)) {
          ctx.addIssue({
            code: 'custom',
            message: t('validation.missingNumber', 'Must contain a number'),
            params: { type: 'noNumber' },
          })
        }
      }),
      password: z.string().min(1, {
        message: t('validation.passwordRequired', 'Password is required'),
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.passwordMismatch', 'Passwords do not match'),
      path: ['confirmPassword'],
    })

type AccountSecurityFormProps = {
  demoMode: boolean
}

type PasswordFormData = z.infer<ReturnType<typeof createPasswordChangeSchema>>

export const AccountSecurityForm = ({ demoMode }: AccountSecurityFormProps) => {
  const { t } = useTranslation('settings')
  const [showPasswords, setShowPasswords] = useState(false)
  const { addToast } = useToast()

  const schema = useMemo(() => createPasswordChangeSchema(t), [t])

  const hookForm = useForm<PasswordFormData>({
    criteriaMode: 'all',
    defaultValues: { confirmPassword: '', newPassword: '', password: '' },
    mode: 'onSubmit',
    resolver: zodResolver(schema),
  })

  const passwordApi = useUpdateUserPassword({
    onSuccess: () => {
      hookForm.reset()
      addToast({
        message: t('account.status.passwordUpdated', 'Password updated'),
        type: 'SUCCESS',
      })
    },
  })

  const onSubmit = (data: PasswordFormData) => {
    if (demoMode) {
      addToast({
        message: t(
          'account.profileChangesNotAllowedInDemo',
          'Profile changes are not allowed in demo mode',
        ),
        type: 'ERROR',
      })
      return
    }
    const submitArgs: Parameters<typeof passwordApi.submit>[0] = {
      body: { newPassword: data.newPassword, password: data.password },
    }
    passwordApi.submit(submitArgs)
  }

  const handleTogglePasswordsVisible = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setShowPasswords(!showPasswords)
  }

  // Extract multiple errors from newPassword (superRefine produces array)
  const newPasswordErrors = hookForm.formState.errors.newPassword
  const newPasswordMessages: string[] = []
  if (newPasswordErrors) {
    if (newPasswordErrors.message) {
      newPasswordMessages.push(newPasswordErrors.message)
    }
    // criteriaMode: 'all' puts additional errors in .types
    if (newPasswordErrors.types) {
      for (const msg of Object.values(newPasswordErrors.types)) {
        if (typeof msg === 'string' && !newPasswordMessages.includes(msg)) {
          newPasswordMessages.push(msg)
        }
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          <form
            onKeyDown={(e) => preventEnterOnForm(e)}
            onSubmit={hookForm.handleSubmit(onSubmit)}
          >
            <FormBody>
              <FieldSet>
                <FormElement>
                  <Label htmlFor="password">
                    {t('forms.password', 'Password')}
                  </Label>
                  <Input
                    {...hookForm.register('password')}
                    autoComplete="off"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorBadge error={hookForm.formState.errors.password} />
                </FormElement>
                <FormElementSpacer />
                <FormElement>
                  <Label htmlFor="newPassword">
                    {t('forms.newPassword', 'New password')}
                  </Label>
                  <Input
                    {...hookForm.register('newPassword')}
                    autoComplete="off"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  {newPasswordMessages.length > 0 && (
                    <div className="-mt-2 flex flex-col gap-1">
                      {newPasswordMessages.map((msg) => (
                        <div className="badge badge-warning" key={msg}>
                          <ErrorSign />
                          {msg}
                        </div>
                      ))}
                    </div>
                  )}
                </FormElement>
                <FormElement>
                  <Label htmlFor="confirmPassword">
                    {t('forms.confirmNewPassword', 'Confirm new password')}
                  </Label>
                  <Input
                    {...hookForm.register('confirmPassword')}
                    autoComplete="off"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorBadge
                    error={hookForm.formState.errors.confirmPassword}
                  />
                </FormElement>
                <FormElement>
                  <Button
                    onClick={handleTogglePasswordsVisible}
                    type="button"
                    variant="ghost"
                  >
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
                <Button
                  disabled={passwordApi.isLoading}
                  type="submit"
                  variant="primary"
                >
                  {t('actions.saveChanges', 'Save changes')}
                </Button>
              </ButtonGroup>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
