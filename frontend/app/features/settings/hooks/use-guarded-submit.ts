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

import { useTranslation } from 'react-i18next'

import { useToast } from '~/components/ui/feedback/use-toast'

type SubmitContext<Value> = {
  submission?: { status: 'error' | undefined } | { status: 'success'; value: Value }
}

/**
 * Returns the `onSubmit` option for `useForm` of an account form. Conform calls it only after a
 * successful validation. In demo mode it shows an error toast and sends nothing.
 */
export const useGuardedSubmit = <Value>(isDemoMode: boolean, onValid: (value: Value) => void) => {
  const { t } = useTranslation('settings')
  const { addToast } = useToast()

  return (event: React.SyntheticEvent<HTMLFormElement>, { submission }: SubmitContext<Value>) => {
    event.preventDefault()
    if (submission?.status !== 'success') return
    if (isDemoMode) {
      addToast({
        message: t(
          'account.profileChangesNotAllowedInDemo',
          'Profile changes are not allowed in demo mode',
        ),
        type: 'ERROR',
      })
      return
    }
    onValid(submission.value)
  }
}
