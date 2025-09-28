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
import { Card, CardBody } from 'components/ui/cards/Card'
import { useToast } from 'components/ui/feedback/hooks/useToast'
import { FormBody } from 'components/ui/forms/formBody'
import { FormElement } from 'components/ui/forms/formElement'
import { FormElementSpacer } from 'components/ui/forms/formElementSpacer'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { FormErrorsMultiple } from 'components/ui/forms/formErrorsMultiple'
import { FormGroup } from 'components/ui/forms/formGroup'
import { preventEnterOnForm } from 'components/ui/forms/input/shared/preventEnterOnForm'
import { Icon } from 'components/ui/icons/Icon'
import { useProfile } from 'lib/api/hooks/useProfile'
import { updateUserPassword } from 'lib/api/lasius/oauth2-provider/oauth2-provider'
import { useTranslation } from 'next-i18next'
import { DEV, LASIUS_DEMO_MODE } from 'projectConfig/constants'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useIsClient } from 'usehooks-ts'

type Form = {
  password: string
  newPassword: string
  confirmPassword: string
}
export const AccountSecurityForm: React.FC = () => {
  const [showPasswords, setShowPasswords] = useState<boolean>(false)
  const hookForm = useForm<Form>({
    defaultValues: { password: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
    criteriaMode: 'all',
  })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { profile } = useProfile()
  const isClient = useIsClient()
  const { addToast } = useToast()

  const { t } = useTranslation('common')

  const resetForm = () => {
    if (profile) {
      hookForm.reset({ password: '', newPassword: '', confirmPassword: '' })
    }
  }

  const onSubmit = async (data: any) => {
    if (LASIUS_DEMO_MODE === 'true' && !DEV) {
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
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <form onSubmit={hookForm.handleSubmit(onSubmit)} onKeyDown={(e) => preventEnterOnForm(e)}>
            <FormBody>
              <FormGroup>
                <FormElement>
                  <Label htmlFor="password">
                    {t('common.forms.password', { defaultValue: 'Password' })}
                  </Label>
                  <Input
                    {...hookForm.register('password', { required: true })}
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
                    {...hookForm.register('newPassword', {
                      required: true,
                      validate: {
                        notEnoughCharactersPassword: (value: string) => value.length > 8,
                        // notEqualPassword: (value: string) => value !== hookForm.getValues('password'),
                        noUppercase: (value: string) => /(?=.*[A-Z])/.test(value),
                        noNumber: (value: string) => /\d/.test(value),
                        // noSpecialCharacters: (value: string) =>
                        //   /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(value),
                      },
                    })}
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
                    {...hookForm.register('confirmPassword', {
                      required: true,
                      validate: {
                        notEqualPassword: (value: string) =>
                          value === hookForm.getValues('newPassword'),
                      },
                    })}
                    autoComplete="off"
                    type={showPasswords ? 'text' : 'password'}
                  />
                  <FormErrorBadge error={hookForm.formState.errors.confirmPassword} />
                </FormElement>
                <FormElement>
                  <Button onClick={handleTogglePasswordsVisible} variant="ghost">
                    <Icon
                      name={
                        showPasswords
                          ? 'view-1-interface-essential'
                          : 'view-off-interface-essential'
                      }
                      size={24}
                    />
                    {showPasswords ? (
                      <span>{t('ui.hidePasswords', { defaultValue: 'Hide passwords' })}</span>
                    ) : (
                      <span>{t('ui.showPasswords', { defaultValue: 'Show passwords' })}</span>
                    )}
                  </Button>
                </FormElement>
              </FormGroup>
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
