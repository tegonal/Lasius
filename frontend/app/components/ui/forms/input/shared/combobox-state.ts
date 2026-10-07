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

import { cleanStringForComparison } from '~/lib/utils/strings'
import { type ModelsEntityReference } from '~/services/api/lasius'

export type ComboboxText = {
  filterText: string
  inputText: string
  selected: '' | ModelsEntityReference
}

/**
 * The local combobox state for a parent value. An id without a matching item shows as `[id]`, so
 * the user sees that the selection points to an unknown entity.
 */
export const deriveComboboxText = (
  value: string,
  selectedItem: ModelsEntityReference | null | undefined,
): ComboboxText => {
  if (value && selectedItem) {
    return { filterText: selectedItem.key, inputText: selectedItem.key, selected: selectedItem }
  }
  if (value) return { filterText: '', inputText: `[${value}]`, selected: '' }
  return { filterText: '', inputText: '', selected: '' }
}

/** Keeps the suggestions whose key contains the filter text, and sorts them by key. */
export const filterAndSortSuggestions = (
  suggestions: ModelsEntityReference[],
  filterText: string,
): ModelsEntityReference[] => {
  const needle = cleanStringForComparison(filterText)
  const matches = filterText
    ? suggestions.filter((item) => cleanStringForComparison(item.key).includes(needle))
    : suggestions
  return matches.toSorted((a, b) => (a.key ?? '').localeCompare(b.key ?? ''))
}
