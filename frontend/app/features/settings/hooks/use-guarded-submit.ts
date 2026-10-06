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
import { type z } from 'zod'

import { useToast } from '~/components/ui/feedback/use-toast'
import { validateFormData } from '~/lib/conform-helpers'

/**
 * Returns the submit handler of an account form. It validates the form with the schema and passes
 * the value to `onValid`. In demo mode it shows an error toast and sends nothing.
 */
export const useGuardedSubmit = <Schema extends z.ZodType>(
  isDemoMode: boolean,
  schema: Schema,
  onValid: (value: z.output<Schema>) => void,
) => {
  const { t } = useTranslation('settings')
  const { addToast } = useToast()

  return (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
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

    const result = validateFormData(event.currentTarget, schema)
    if (result.status === 'success') onValid(result.value)
  }
}
