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

interface FormErrorsMultipleProps {
	errors?: FieldError | Merge<FieldError, FieldErrors<Record<string, unknown>>>
	id?: string
}

const errorTypeToTranslationKey: Record<string, string> = {
	endAfterStart: 'common.validation.mustBeAfterStart',
	fromBeforeTo: 'common.validation.fromMustBeBeforeTo',
	isEmailAddress: 'common.validation.emailInvalid',
	noNumber: 'common.validation.missingNumber',
	noPasswordConfirmNewEqual: 'common.validation.passwordMismatch',
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

export const FormErrorsMultiple = ({
	errors: fieldErrors = undefined,
	id,
}: FormErrorsMultipleProps) => {
	const { t } = useTranslation('common')

	if (!fieldErrors) return null

	const { message, types } = fieldErrors as FieldError

	if (!types && message) {
		return (
			<div className="-mt-2" id={id}>
				<div className="badge badge-warning">
					<ErrorSign />
					{typeof message === 'string' ? message : ''}
				</div>
			</div>
		)
	}

	if (!types) return null

	return (
		<div className="-mt-2" id={id}>
			<div className="flex max-w-full flex-row flex-wrap items-center justify-end gap-2">
				{Object.keys(types).map((key) => {
					const errorValue = types[key as keyof typeof types]
					const translationKey = errorTypeToTranslationKey[key]

					if (Array.isArray(errorValue)) {
						return errorValue.map((msg, index) => (
							<div className="badge badge-warning" key={`${key}-${index}`}>
								<ErrorSign />
								{typeof msg === 'string' ? msg : String(msg)}
							</div>
						))
					}

					let displayMessage: string
					if (typeof errorValue === 'string') {
						displayMessage = errorValue
					} else if (
						typeof errorValue === 'object' &&
						errorValue &&
						'message' in errorValue
					) {
						displayMessage = String((errorValue as { message: string }).message)
					} else if (translationKey) {
						displayMessage = t(translationKey as Parameters<typeof t>[0])
					} else {
						displayMessage = key
					}

					return (
						<div className="badge badge-warning" key={key}>
							<ErrorSign />
							{displayMessage}
						</div>
					)
				})}
			</div>
		</div>
	)
}
