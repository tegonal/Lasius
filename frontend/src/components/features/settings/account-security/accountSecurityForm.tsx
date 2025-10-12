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
import { Button } from 'components/primitives/buttons/Button'
import { Input } from 'components/primitives/inputs/Input'
import { Label } from 'components/primitives/typography/Label'
import { Card, CardBody } from 'components/ui/cards/Card'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { FieldSet } from 'components/ui/forms/FieldSet'
import { FormBody } from 'components/ui/forms/FormBody'
import { FormElement } from 'components/ui/forms/FormElement'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { FormErrorsMultiple } from 'components/ui/forms/formErrorsMultiple'
import { preventEnterOnForm } from 'components/ui/forms/input/shared/preventEnterOnForm'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { useProfile } from 'lib/api/hooks/useProfile'
import { updateUserPassword } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import { IS_DEV, LASIUS_DEMO_MODE } from 'projectConfig/constants'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIsClient } from 'usehooks-ts'
import { z } from 'zod'

import type { TFunction } from 'i18next'

// Schema factory function with i18n support
const createPasswordChangeSchema = (t: TFunction) =>
  z
    .object({
      password: z
        .string()
        .min(1, t('validation.passwordRequired', { defaultValue: 'Password is required' })),
      newPassword: z
        .string()
        .min(9, t('validation.passwordTooShort', { defaultValue: 'Minimum 9 characters' }))
        .regex(
          /(?=.*[A-Z])/,
          t('validation.missingUppercase', { defaultValue: 'Must contain uppercase letter' }),
        )
        .regex(/\d/, t('validation.missingNumber', { defaultValue: 'Must contain a number' })),
      confirmPassword: z
        .string()
        .min(
          1,
          t('validation.confirmPasswordRequired', { defaultValue: 'Please confirm your password' }),
        ),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.passwordMismatch', { defaultValue: 'Passwords do not match' }),
      path: ['confirmPassword'],
    })

type FormData = z.infer<ReturnType<typeof createPasswordChangeSchema>>
export const AccountSecurityForm: React.FC = () => {
  const { t } = useTranslation('common')
  const [showPasswords, setShowPasswords] = useState<boolean>(false)

  // Memoize schema to prevent recreation on every render
  const schema = useMemo(() => createPasswordChangeSchema(t), [t])

  const hookForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
    criteriaMode: 'all',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { profile } = useProfile()
  const isClient = useIsClient()
  const { addToast } = useToast()

  const resetForm = () => {
    if (profile) {
      hookForm.reset({ password: '', newPassword: '', confirmPassword: '' })
    }
  }

  const onSubmit = async (data: any) => {
    if (LASIUS_DEMO_MODE === 'true' && !IS_DEV) {
      addToast({
        message: t('account.profileChangesNotAllowedInDemo', {
          defaultValue: 'Profile changes are not allowed in demo mode',
        }),
        type: 'ERROR',
      })
      resetForm()
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(true)
    const { password, newPassword } = data
    const payload = {
      password,
      newPassword,
    }
    try {
      await updateUserPassword(payload)
      addToast({
        message: t('account.status.passwordUpdated', { defaultValue: 'Password updated' }),
        type: 'SUCCESS',
      })
      resetForm()
    } catch {
      addToast({
        message: t('account.errors.passwordUpdateFailed', {
          defaultValue:
            'Password update failed. Make sure you entered your current password and that it is correct.',
        }),
        type: 'ERROR',
      })
    }
    setIsSubmitting(false)
  }

  const handleTogglePasswordsVisible = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setShowPasswords(!showPasswords)
  }

  if (!isClient) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardBody className="p-6">
          {}
          <form onSubmit={hookForm.handleSubmit(onSubmit)} onKeyDown={(e) => preventEnterOnForm(e)}>
            <FormBody>
              <FieldSet>
                <FormElement>
                  <Label htmlFor="password">
                    {t('common.forms.password', { defaultValue: 'Password' })}
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
                    {t('common.forms.newPassword', { defaultValue: 'New password' })}
                  </Label>
                  <Input
                    {...hookForm.register('newPassword')}
                    autoComplete="off"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorsMultiple errors={hookForm.formState.errors.newPassword} />
                </FormElement>
                <FormElement>
                  <Label htmlFor="confirmNewPassword">
                    {t('common.forms.confirmNewPassword', { defaultValue: 'Confirm new password' })}
                  </Label>
                  <Input
                    {...hookForm.register('confirmPassword')}
                    autoComplete="off"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorBadge error={hookForm.formState.errors.confirmPassword} />
                </FormElement>
                <FormElement>
                  <Button onClick={handleTogglePasswordsVisible} variant="ghost">
                    <LucideIcon icon={showPasswords ? Eye : EyeOff} size={24} />
                    {showPasswords ? (
                      <span>{t('ui.hidePasswords', { defaultValue: 'Hide passwords' })}</span>
                    ) : (
                      <span>{t('ui.showPasswords', { defaultValue: 'Show passwords' })}</span>
                    )}
                  </Button>
                </FormElement>
              </FieldSet>
              <FormElement>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {t('common.actions.saveChanges', { defaultValue: 'Save changes' })}
                  </Button>
                </div>
              </FormElement>
            </FormBody>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
