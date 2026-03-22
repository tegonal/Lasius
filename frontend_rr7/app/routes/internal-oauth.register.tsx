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
import { parseWithZod } from '@conform-to/zod/v4'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	data,
	Form,
	href,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { z } from 'zod'

import { Button } from '~/components/primitives/buttons/button'
import { Input } from '~/components/primitives/inputs/input'
import { Card, CardBody } from '~/components/ui/cards/card'
import { Alert } from '~/components/ui/feedback/alert'
import { ButtonGroup } from '~/components/ui/forms/button-group'
import { FieldSet } from '~/components/ui/forms/field-set'
import { FormBody } from '~/components/ui/forms/form-body'
import { FormElement } from '~/components/ui/forms/form-element'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { Logo } from '~/components/ui/icons/logo'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { RegisterInfoPanel } from '~/features/auth/auth-info-panels'
import { AuthLayout } from '~/features/auth/auth-layout'
import { type SchemaTranslationFn } from '~/lib/i18n-types'
import { logger } from '~/lib/logger'
import { registerOAuthUser } from '~/services/api/lasius/oauth2-provider/oauth2-provider'
import { getOptionalUser } from '~/services/auth/auth-helpers.server'

import { type Route } from './+types/internal-oauth.register'

const createRegisterSchema = (t: SchemaTranslationFn) =>
	z
		.object({
			confirmPassword: z
				.string({
					error: t('common.validation.required', { defaultValue: 'Required' }),
				})
				.min(1, t('common.validation.required', { defaultValue: 'Required' })),
			email: z
				.string({
					error: t('common.validation.required', { defaultValue: 'Required' }),
				})
				.email(
					t('common.validation.emailInvalid', {
						defaultValue: 'Invalid email address',
					}),
				),
			firstName: z
				.string({
					error: t('common.validation.required', { defaultValue: 'Required' }),
				})
				.min(1, t('common.validation.required', { defaultValue: 'Required' })),
			invitationId: z.string().optional(),
			lastName: z
				.string({
					error: t('common.validation.required', { defaultValue: 'Required' }),
				})
				.min(1, t('common.validation.required', { defaultValue: 'Required' })),
			password: z
				.string({
					error: t('common.validation.required', { defaultValue: 'Required' }),
				})
				.min(
					9,
					t('common.validation.passwordTooShort', {
						defaultValue: 'Password must be at least 9 characters',
					}),
				)
				.regex(/[A-Z]/, {
					error: t('common.validation.missingUppercase', {
						defaultValue: 'Must contain an uppercase letter',
					}),
				})
				.regex(/\d/, {
					error: t('common.validation.missingNumber', {
						defaultValue: 'Must contain a number',
					}),
				}),
			returnTo: z.string().optional(),
		})
		.refine((val) => val.password === val.confirmPassword, {
			message: t('common.validation.passwordMismatch', {
				defaultValue: 'Passwords do not match',
			}),
			path: ['confirmPassword'],
		})

// Server-side schema with English defaults
const serverRegisterSchema = createRegisterSchema(
	(_, opts) => opts?.defaultValue ?? '',
)

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: serverRegisterSchema })

	if (submission.status !== 'success') {
		return data(
			{ lastResult: submission.reply(), serverError: null },
			{ status: 400 },
		)
	}

	const { email, firstName, invitationId, lastName, password, returnTo } =
		submission.value

	try {
		await registerOAuthUser({
			email: email.trim(),
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			password,
		})

		const params = new URLSearchParams({
			email: email.trim(),
			registered: 'true',
		})
		if (invitationId) {
			params.set('invitation_id', invitationId)
		}
		if (returnTo) {
			params.set('returnTo', returnTo)
		}

		return redirect(`${href('/internal-oauth/login')}?${params.toString()}`)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'unknown_error'
		logger.warn('Registration failed', { email, error: message })

		const errorCode =
			message.includes('user_already_registered') || message.includes('409')
				? 'user_already_registered'
				: 'register_unknown'

		return data(
			{
				lastResult: submission.reply(),
				serverError: errorCode,
			},
			{
				status: errorCode === 'user_already_registered' ? 409 : 500,
			},
		)
	}
}

export default function InternalOAuthRegister() {
	const {
		email: prefilledEmail,
		invitationId,
		returnTo,
	} = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const { t } = useTranslation('common')
	const [showPasswords, setShowPasswords] = useState(false)

	const registerSchema = createRegisterSchema(t)

	const [form, fields] = useForm<{
		confirmPassword: string
		email: string
		firstName: string
		invitationId?: string
		lastName: string
		password: string
		returnTo?: string
	}>({
		defaultValue: {
			confirmPassword: '',
			email: prefilledEmail,
			firstName: '',
			invitationId: invitationId || undefined,
			lastName: '',
			password: '',
			returnTo: returnTo || undefined,
		},
		lastResult: actionData?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: registerSchema })
		},
		shouldRevalidate: 'onInput',
		shouldValidate: 'onBlur',
	})

	const isSubmitting = navigation.state !== 'idle'

	const getErrorMessage = (errorCode: string): string => {
		switch (errorCode) {
			case 'user_already_registered':
				return t('auth.errors.userAlreadyRegistered', {
					defaultValue: 'User already registered',
				})
			default:
				return t('auth.errors.registerUnknown', {
					defaultValue: 'Unknown registration error',
				})
		}
	}

	return (
		<AuthLayout infoPanel={<RegisterInfoPanel />}>
			{actionData?.serverError && (
				<Alert
					className="animate-[fadeIn_0.4s_ease-out]"
					data-testid="auth-register-error"
					variant="warning"
				>
					{getErrorMessage(actionData.serverError)}
				</Alert>
			)}
			{invitationId && (
				<Alert className="animate-[fadeIn_0.4s_ease-out]" variant="info">
					{t('invitations.createAccountMessage', {
						defaultValue:
							'You have been invited to create an account so that you can use Lasius to track your working hours.',
					})}
				</Alert>
			)}
			<Card className="bg-base-100/80 border-0 shadow-2xl backdrop-blur-sm">
				<CardBody className="p-8 lg:p-10">
					<div className="mb-4 flex justify-center lg:hidden">
						<Logo />
					</div>
					<div className="mb-8 text-center">
						<h2 className="mb-2 text-3xl font-bold">
							{t('auth.createYourAccount', {
								defaultValue: 'Create your account',
							})}
						</h2>
						<p className="text-base-content/60 text-sm">
							{t('auth.fillDetailsToStart', {
								defaultValue: 'Please fill in your details to get started',
							})}
						</p>
					</div>
					<Form method="post" {...getFormProps(form)}>
						{returnTo && (
							<input
								{...getInputProps(fields.returnTo, { type: 'hidden' })}
								key={fields.returnTo.key}
							/>
						)}
						{invitationId && (
							<input
								{...getInputProps(fields.invitationId, { type: 'hidden' })}
								key={fields.invitationId.key}
							/>
						)}
						<FormBody>
							<FieldSet>
								<FormElement
									htmlFor={fields.email.id}
									label={t('common.forms.email', {
										defaultValue: 'Email',
									})}
									required
								>
									<Input
										autoComplete="email"
										autoFocus={!prefilledEmail}
										data-testid="auth-register-email-input"
										error={!!fields.email.errors?.length}
										{...getInputProps(fields.email, { type: 'email' })}
										key={fields.email.key}
									/>
									<FormFieldErrors errors={fields.email.errors} />
								</FormElement>
								<FormElement
									htmlFor={fields.firstName.id}
									label={t('common.forms.firstName', {
										defaultValue: 'First name',
									})}
									required
								>
									<Input
										autoComplete="given-name"
										data-testid="auth-register-firstname-input"
										error={!!fields.firstName.errors?.length}
										{...getInputProps(fields.firstName, { type: 'text' })}
										key={fields.firstName.key}
									/>
									<FormFieldErrors errors={fields.firstName.errors} />
								</FormElement>
								<FormElement
									htmlFor={fields.lastName.id}
									label={t('common.forms.lastName', {
										defaultValue: 'Last name',
									})}
									required
								>
									<Input
										autoComplete="family-name"
										data-testid="auth-register-lastname-input"
										error={!!fields.lastName.errors?.length}
										{...getInputProps(fields.lastName, { type: 'text' })}
										key={fields.lastName.key}
									/>
									<FormFieldErrors errors={fields.lastName.errors} />
								</FormElement>
								<FormElement
									htmlFor={fields.password.id}
									label={t('common.forms.password', {
										defaultValue: 'Password',
									})}
									required
								>
									<Input
										autoComplete="new-password"
										data-testid="auth-register-password-input"
										error={!!fields.password.errors?.length}
										{...getInputProps(fields.password, {
											type: showPasswords ? 'text' : 'password',
										})}
										key={fields.password.key}
									/>
									<FormFieldErrors errors={fields.password.errors} />
								</FormElement>
								<FormElement
									htmlFor={fields.confirmPassword.id}
									label={t('common.forms.confirmPassword', {
										defaultValue: 'Confirm password',
									})}
									required
								>
									<Input
										autoComplete="new-password"
										data-testid="auth-register-confirmpassword-input"
										error={!!fields.confirmPassword.errors?.length}
										{...getInputProps(fields.confirmPassword, {
											type: showPasswords ? 'text' : 'password',
										})}
										key={fields.confirmPassword.key}
									/>
									<FormFieldErrors errors={fields.confirmPassword.errors} />
								</FormElement>
							</FieldSet>
							<ButtonGroup>
								<Button
									className="justify-start gap-2"
									fullWidth
									onClick={(e) => {
										e.preventDefault()
										setShowPasswords(!showPasswords)
									}}
									variant="ghost"
								>
									<LucideIcon icon={showPasswords ? Eye : EyeOff} size={24} />
									<span>
										{showPasswords
											? t('ui.hidePasswords', {
													defaultValue: 'Hide passwords',
												})
											: t('ui.showPasswords', {
													defaultValue: 'Show passwords',
												})}
									</span>
								</Button>
								<Button
									data-testid="auth-register-submit-btn"
									fullWidth
									loading={isSubmitting}
									type="submit"
								>
									{t('common.actions.signUp', {
										defaultValue: 'Sign up',
									})}
								</Button>
							</ButtonGroup>
						</FormBody>
					</Form>
				</CardBody>
			</Card>
		</AuthLayout>
	)
}

export async function loader({ request }: Route.LoaderArgs) {
	const user = await getOptionalUser(request)

	if (user) {
		throw redirect(href('/'))
	}

	const url = new URL(request.url)
	const email = url.searchParams.get('email') ?? ''
	const invitationId = url.searchParams.get('invitation_id') ?? ''
	const returnTo = url.searchParams.get('returnTo') ?? ''

	return { email, invitationId, returnTo }
}
