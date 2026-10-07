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

import { Combobox } from '@base-ui/react/combobox'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { guardComboboxKey } from '~/components/ui/forms/input/shared/combobox-key-guard'
import {
  ComboboxStatusAlert,
  type ComboboxStatusMessage,
} from '~/components/ui/forms/input/shared/combobox-status-alert'
import { DropdownList } from '~/components/ui/forms/input/shared/dropdown-list'
import { DropdownListItem } from '~/components/ui/forms/input/shared/dropdown-list-item'
import { useComboboxSelection } from '~/components/ui/forms/input/shared/use-combobox-selection'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { type ModelsEntityReference } from '~/services/api/lasius'

export type SelectAutocompleteSuggestionType = ModelsEntityReference

type InputSelectAutocompleteProperties = {
  /** Field errors to display */
  errors?: string[]
  /** HTML id for the input element */
  id?: string
  /** Field name for the hidden input */
  name: string
  /** Called when the selected value changes (receives the entity ID or empty string) */
  onChange: (value: string) => void
  selectedItem?: null | SelectAutocompleteSuggestionType
  statusMessage?: ComboboxStatusMessage | null
  suggestions: SelectAutocompleteSuggestionType[]
  /** Current value (entity ID) — controlled by parent's useInputControl */
  value: string
}

/**
 * Shared combobox UI — receives value/onChange from the mode-specific wrapper.
 */
const ComboboxCore = ({
  fieldId,
  id,
  onChange,
  selectedItem,
  statusMessage,
  suggestions,
  value,
}: {
  fieldId: string
  id?: string
  onChange: (change: null | SelectAutocompleteSuggestionType) => void
  selectedItem?: null | SelectAutocompleteSuggestionType
  statusMessage?: ComboboxStatusMessage | null
  suggestions: SelectAutocompleteSuggestionType[]
  value: string
}) => {
  const { t } = useTranslation('common')
  const {
    availableSuggestions,
    handleFocus,
    handleInputValueChange,
    handleValueChange,
    inputReference,
    inputText,
    isOpen,
    resetSelection,
    selected,
    setIsOpen,
  } = useComboboxSelection({ onChange, selectedItem, suggestions, value })

  return (
    <>
      <div className="relative">
        <Combobox.Root
          filter={null}
          inputValue={inputText}
          isItemEqualToValue={(item, current) => item.id === current.id}
          items={availableSuggestions}
          itemToStringLabel={(item: SelectAutocompleteSuggestionType) => item?.key || ''}
          onInputValueChange={(text, details) => handleInputValueChange(text, details.reason)}
          onOpenChange={setIsOpen}
          onValueChange={handleValueChange}
          open={isOpen}
          value={selected || null}>
          <Combobox.InputGroup className="join w-full">
            <div className="join-item flex-1">
              <Combobox.Input
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                id={id || fieldId}
                onFocus={handleFocus}
                onKeyDown={(event) => guardComboboxKey(event, isOpen)}
                placeholder={t('projects.selectProject', 'Select project')}
                ref={inputReference}
                render={<Input className="mb-0 w-full text-sm" />}
                spellCheck={false}
              />
            </div>

            {(selected || inputText) && (
              <button
                className="btn btn-neutral join-item px-2"
                onClick={resetSelection}
                type="button">
                <LucideIcon icon={X} size={20} />
              </button>
            )}

            <Combobox.Trigger className="btn btn-neutral join-item px-2">
              <LucideIcon icon={isOpen ? ChevronUp : ChevronDown} size={20} />
            </Combobox.Trigger>
          </Combobox.InputGroup>
          {availableSuggestions.length > 0 && (
            <DropdownList>
              {(suggestion: SelectAutocompleteSuggestionType) => (
                <Combobox.Item
                  key={suggestion.id}
                  render={(itemProperties, state) => (
                    <div {...itemProperties}>
                      <DropdownListItem
                        active={state.highlighted}
                        itemSearchString={inputText}
                        itemValue={suggestion.key}
                        selected={state.selected}
                      />
                    </div>
                  )}
                  value={suggestion}
                />
              )}
            </DropdownList>
          )}
        </Combobox.Root>
      </div>
      <ComboboxStatusAlert message={statusMessage} />
    </>
  )
}

export const InputSelectAutocomplete = ({
  errors,
  id,
  name,
  onChange,
  selectedItem,
  statusMessage,
  suggestions,
  value,
}: InputSelectAutocompleteProperties) => {
  return (
    <>
      <input name={name} type="hidden" value={value} />
      <ComboboxCore
        fieldId={id ?? name}
        id={id}
        onChange={(change) => onChange(change?.id ?? '')}
        selectedItem={selectedItem}
        statusMessage={statusMessage}
        suggestions={suggestions}
        value={value}
      />
      <FormFieldErrors errors={errors} />
    </>
  )
}
