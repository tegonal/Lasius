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

/*
Dynamic translation strings, to be picked up by the extractor:
These use semantic keys with defaultValue for the extractor
 */

const t = (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key

export const LoginError = {
  usernameOrPasswordWrong: t('auth.errors.wrongPasswordOrEmail', {
    defaultValue: 'Wrong password or e-mail. Try again.',
  }),
  oneOfCredentialsMissing: t('auth.errors.credentialsMissing', {
    defaultValue: 'Username or password missing',
  }),
}

export const FormError = {
  required: t('common.validation.required', {
    defaultValue: 'Required',
  }),
  pattern: t('common.validation.wrongFormat', {
    defaultValue: 'Wrong format',
  }),
  isEmailAddress: t('common.validation.emailInvalid', {
    defaultValue: 'Should be a valid e-mail address',
  }),
  notEnoughCharactersPassword: t('common.validation.passwordTooShort', {
    defaultValue: 'Not enough characters (min. 8)',
  }),
  noUppercase: t('common.validation.missingUppercase', {
    defaultValue: 'Missing uppercase character',
  }),
  noSpecialCharacters: t('common.validation.missingSpecialChar', {
    defaultValue: 'Missing special character',
  }),
  notEqualPassword: t('common.validation.passwordMismatch', {
    defaultValue: "Passwords don't match",
  }),
  startInPast: t('common.validation.mustBeInPast', {
    defaultValue: 'Must be in the past',
  }),
  endAfterStart: t('common.validation.mustBeAfterStart', {
    defaultValue: 'Must be after start',
  }),
  startBeforeEnd: t('common.validation.mustBeBeforeEnd', {
    defaultValue: 'Must be before end',
  }),
  noNumber: t('common.validation.missingNumber', {
    defaultValue: 'Missing number digit',
  }),
  toAfterFrom: t('common.validation.toMustBeAfterFrom', {
    defaultValue: 'Must be after the "from" date',
  }),
  fromBeforeTo: t('common.validation.fromMustBeBeforeTo', {
    defaultValue: 'Must be before the "to" date',
  }),
}

export const PageError: Record<string, string> = {
  404: t('common.errors.pageNotFound', {
    defaultValue: 'Page not found',
  }),
  500: t('common.errors.internalServerError', {
    defaultValue: 'Internal server error',
  }),
  401: t('common.errors.unauthorized', {
    defaultValue: 'Unauthorized',
  }),
  undefined: t('common.errors.somethingWentWrong', {
    defaultValue: 'Something went wrong',
  }),
}

export const UserRoles = {
  ProjectAdministrator: t('common.roles.administrator', {
    defaultValue: 'Administrator',
  }),
  ProjectMember: t('common.roles.member', {
    defaultValue: 'Member',
  }),
  OrganisationAdministrator: t('common.roles.administrator', {
    defaultValue: 'Administrator',
  }),
  OrganisationMember: t('common.roles.member', {
    defaultValue: 'Member',
  }),
}
