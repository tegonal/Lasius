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

import { type FieldError, type FieldErrors, type Merge } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { ErrorSign } from '~/components/ui/feedback/error-sign'
import { logger } from '~/lib/logger'

interface FormErrorBadgeProps {
	error?: FieldError | Merge<FieldError, FieldErrors<Record<string, unknown>>>
	id?: string
}

const errorTypeToTranslationKey: Record<string, string> = {
	endAfterStart: 'common.validation.mustBeAfterStart',
	fromBeforeTo: 'common.validation.fromMustBeBeforeTo',
	isEmailAddress: 'common.validation.emailInvalid',
	noNumber: 'common.validation.missingNumber',
	noSpecialCharacters: 'common.validation.missingSpecialChar',
	notEnoughCharactersPassword: 'common.validation.passwordTooShort',
	notEqualPassword: 'common.validation.passwordMismatch',
	noUppercase: 'common.validation.missingUppercase',
	pattern: 'common.validation.wrongFormat',
	required: 'common.validation.required',
	startBeforeEnd: 'common.validation.mustBeBeforeEnd',
	startInPast: 'common.validation.mustBeInPast',
	toAfterFrom: 'common.validation.toMustBeAfterFrom',
}

export const FormErrorBadge = ({ error, id }: FormErrorBadgeProps) => {
	const { t } = useTranslation('common')

	if (!error) return null
	logger.info('[form][FormErrorBadge]', error.type)

	const getErrorMessage = (): string => {
		if (error.message && typeof error.message === 'string') return error.message

		const errorType = String(error.type || '')
		const translationKey = errorTypeToTranslationKey[errorType]
		if (translationKey) {
			return t(translationKey as Parameters<typeof t>[0])
		}

		// Fallback to error type if no translation found
		return errorType
	}

	return (
		<div className="-mt-2" id={id}>
			<div className="badge badge-warning">
				<ErrorSign />
				{getErrorMessage()}
			</div>
		</div>
	)
}
