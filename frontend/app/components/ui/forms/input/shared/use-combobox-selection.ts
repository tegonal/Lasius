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

import { useRef, useState } from 'react'

import {
  type ComboboxText,
  deriveComboboxText,
  filterAndSortSuggestions,
} from '~/components/ui/forms/input/shared/combobox-state'
import { type ModelsEntityReference } from '~/services/api/lasius'

type UseComboboxSelectionOptions = {
  onChange: (change: ModelsEntityReference | null) => void
  selectedItem: ModelsEntityReference | null | undefined
  suggestions: ModelsEntityReference[]
  value: string
}

/** Owns the input text, the filter, the selection and the open state of one entity combobox. */
export const useComboboxSelection = ({
  onChange,
  selectedItem,
  suggestions,
  value,
}: UseComboboxSelectionOptions) => {
  const inputReference = useRef<HTMLInputElement>(null)
  const [text, setText] = useState<ComboboxText>(() => deriveComboboxText('', null))
  const [isOpen, setIsOpen] = useState(false)

  // Sync the local state during render when the parent value or the selected item changes.
  const [synced, setSynced] = useState<null | {
    selectedItem: typeof selectedItem
    value: string
  }>(null)
  if (synced?.value !== value || synced.selectedItem !== selectedItem) {
    setSynced({ selectedItem, value })
    setText(deriveComboboxText(value, selectedItem))
  }

  const resetSelection = () => {
    setText(deriveComboboxText('', null))
    onChange(null)
    setTimeout(() => {
      inputReference.current?.focus()
    }, 0)
  }

  // Base UI also writes the label on select and on close. Only typing changes the filter.
  const handleInputValueChange = (inputText: string, reason: string) => {
    if (reason !== 'input-change') return
    setText((current) => ({ ...current, filterText: inputText, inputText }))
  }

  const handleValueChange = (change: ModelsEntityReference | null) => {
    if (!change?.id) return
    setText(deriveComboboxText(change.id, change))
    onChange(change)
    setTimeout(() => {
      inputReference.current?.blur()
    }, 0)
  }

  // A focus on an unchanged selection shows the full list again.
  const handleFocus = () => {
    if (text.selected && text.inputText === text.selected.key) {
      setText((current) => ({ ...current, filterText: '' }))
    }
  }

  return {
    availableSuggestions: filterAndSortSuggestions(suggestions, text.filterText),
    handleFocus,
    handleInputValueChange,
    handleValueChange,
    inputReference,
    inputText: text.inputText,
    isOpen,
    resetSelection,
    selected: text.selected,
    setIsOpen,
  }
}
