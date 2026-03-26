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

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DropdownList } from '~/components/ui/forms/input/shared/dropdown-list'
import { DropdownListItem } from '~/components/ui/forms/input/shared/dropdown-list-item'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cleanStrForCmp } from '~/lib/utils/strings'
import { type ModelsEntityReference } from '~/services/api/lasius'

export type SelectAutocompleteSuggestionType = ModelsEntityReference

type InputSelectAutocompleteProps = {
  /** Field errors to display */
  errors?: string[]
  /** HTML id for the input element */
  id?: string
  /** Field name for the hidden input */
  name: string
  /** Called when the selected value changes (receives the entity ID or empty string) */
  onChange: (value: string) => void
  selectedItem?: null | SelectAutocompleteSuggestionType
  statusMessage?: null | {
    text: string
    variant: 'error' | 'info' | 'warning'
  }
  suggestions: SelectAutocompleteSuggestionType[]
  /** Current value (entity ID) — controlled by parent's useInputControl */
  value: string
}

const alertVariantClass: Record<string, string> = {
  error: 'alert alert-error',
  info: 'alert alert-info',
  warning: 'alert alert-warning',
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
  statusMessage?: null | {
    text: string
    variant: 'error' | 'info' | 'warning'
  }
  suggestions: SelectAutocompleteSuggestionType[]
  value: string
}) => {
  const { t } = useTranslation('common')
  const inputRef = useRef<HTMLInputElement>(null)

  const [inputText, setInputText] = useState<string>('')
  const [selected, setSelected] = useState<
    '' | SelectAutocompleteSuggestionType
  >('')
  const [filterText, setFilterText] = useState<string>('')

  const resetSelection = () => {
    setSelected('')
    setInputText('')
    setFilterText('')
    onChange(null)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    if (value && selectedItem) {
      setSelected(selectedItem)
      setInputText(selectedItem.key)
      setFilterText(selectedItem.key)
    } else if (value) {
      setSelected('')
      setInputText(`[${value}]`)
      setFilterText('')
    } else {
      setSelected('')
      setInputText('')
      setFilterText('')
    }
  }, [value, selectedItem])

  const availableSuggestions = (
    filterText
      ? suggestions.filter((item) =>
          cleanStrForCmp(item.key).includes(cleanStrForCmp(filterText)),
        )
      : suggestions
  ).toSorted((a, b) => (a.key ?? '').localeCompare(b.key ?? ''))

  return (
    <>
      <div className="relative">
        <Combobox
          as="div"
          onChange={(change: null | SelectAutocompleteSuggestionType) => {
            if (change?.id) {
              setSelected(change)
              setInputText(change.key)
              setFilterText(change.key)
              onChange(change)
              setTimeout(() => {
                inputRef.current?.blur()
              }, 0)
            }
          }}
          value={selected || null}
        >
          {({ open }) => (
            <>
              <div className="join w-full">
                <ComboboxButton as="div" className="join-item flex-1">
                  <ComboboxInput
                    as={Input}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    className="mb-0 w-full text-sm"
                    displayValue={(item: SelectAutocompleteSuggestionType) =>
                      item?.key || ''
                    }
                    id={id || fieldId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValue = e.currentTarget.value
                      setInputText(newValue)
                      setFilterText(newValue)
                    }}
                    onFocus={() => {
                      if (selected && inputText === selected?.key) {
                        setFilterText('')
                      }
                    }}
                    placeholder={t('projects.selectProject', 'Select project')}
                    ref={inputRef}
                    spellCheck={false}
                    value={inputText}
                  />
                </ComboboxButton>

                {(selected || inputText) && (
                  <button
                    className="btn btn-neutral join-item px-2"
                    onClick={resetSelection}
                    type="button"
                  >
                    <LucideIcon icon={X} size={20} />
                  </button>
                )}

                <ComboboxButton className="btn btn-neutral join-item px-2">
                  <LucideIcon icon={open ? ChevronUp : ChevronDown} size={20} />
                </ComboboxButton>
              </div>
              <ComboboxOptions as="div">
                {open && availableSuggestions.length > 0 && (
                  <DropdownList>
                    {availableSuggestions.map((suggestion) => (
                      <ComboboxOption
                        as="div"
                        key={suggestion.key}
                        value={suggestion}
                      >
                        {({ focus, selected: isSelected }) => (
                          <DropdownListItem
                            active={focus}
                            itemSearchString={inputText}
                            itemValue={suggestion.key}
                            key={suggestion.id}
                            selected={isSelected}
                          />
                        )}
                      </ComboboxOption>
                    ))}
                  </DropdownList>
                )}
              </ComboboxOptions>
            </>
          )}
        </Combobox>
      </div>
      {statusMessage && (
        <div
          className={`${alertVariantClass[statusMessage.variant] || 'alert'} mt-2`}
        >
          {statusMessage.text}
        </div>
      )}
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
}: InputSelectAutocompleteProps) => {
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
