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
import { Input } from 'components/primitives/inputs/Input'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { DropdownList } from 'components/ui/forms/input/shared/dropdownList'
import { DropdownListItem } from 'components/ui/forms/input/shared/dropdownListItem'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { find, sortBy } from 'es-toolkit/compat'
import { ModelsEntityReference } from 'lib/api/lasius'
import { cleanStrForCmp } from 'lib/utils/string/strings'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

export type SelectAutocompleteSuggestionType = ModelsEntityReference

type Props = {
  suggestions: SelectAutocompleteSuggestionType[]
  name: string
  required?: boolean
  id?: string
}

export const InputSelectAutocomplete: React.FC<Props> = ({
  suggestions = [],
  name,
  required = false,
  id,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()

  const errors = parentFormContext?.formState.errors[name]

  const [inputText, setInputText] = useState<string>('')
  const [selected, setSelected] = useState<SelectAutocompleteSuggestionType | ''>('')
  const [filterText, setFilterText] = useState<string>('')

  const resetSelection = () => {
    setSelected('')
    setInputText('')
    setFilterText('')
    parentFormContext?.setValue(name, null)
    // Focus the input after resetting using the id
    setTimeout(() => {
      const inputElement = document.getElementById(id || name) as HTMLInputElement
      if (inputElement) {
        inputElement.focus()
      }
    }, 0)
  }

  useEffect(() => {
    if (!parentFormContext) return
    const formValue = parentFormContext.getValues()[name]
    if (formValue) {
      const preSelected = find(suggestions, { id: formValue })
      if (preSelected) {
        setSelected(preSelected)
        setInputText(preSelected.key)
        setFilterText(preSelected.key)
      }
    } else {
      setSelected('')
      setInputText('')
      setFilterText('')
    }
  }, [name, parentFormContext, selected, suggestions])

  // Filter suggestions based on filterText (not inputText)
  const availableSuggestions = sortBy(
    filterText
      ? suggestions.filter((item) => cleanStrForCmp(item.key).includes(cleanStrForCmp(filterText)))
      : suggestions,
    ['key'],
  )

  const rules = required
    ? {
        validate: {
          required: (v: string | undefined) => !!v,
        },
      }
    : {}

  if (!parentFormContext) return null

  return (
    <>
      <div className="relative">
        <Controller
          name={name}
          control={parentFormContext.control}
          rules={rules}
          render={({ field: { value, onChange } }) => (
            <Combobox
              value={value}
              onChange={(change: SelectAutocompleteSuggestionType) => {
                if (change?.id) {
                  onChange(change.id)
                }
              }}
              as="div">
              {({ open }) => (
                <>
                  <div className="join w-full">
                    {/* Input field as first join item - wrapped in ComboboxButton to open on click/focus */}
                    <ComboboxButton as="div" className="join-item flex-1">
                      <ComboboxInput
                        as={Input}
                        id={id || name}
                        className="mb-0 w-full text-sm"
                        onChange={(e) => {
                          const newValue = e.currentTarget.value
                          setInputText(newValue)
                          setFilterText(newValue)
                        }}
                        onFocus={() => {
                          // When focusing, if there's a selected value, clear the filter to show all options
                          if (
                            selected &&
                            inputText === (selected as SelectAutocompleteSuggestionType)?.key
                          ) {
                            setFilterText('')
                          }
                        }}
                        placeholder={t('projects.selectProject', {
                          defaultValue: 'Select project',
                        })}
                        autoComplete="off"
                        value={inputText}
                        displayValue={(item: SelectAutocompleteSuggestionType) => item?.key || ''}
                      />
                    </ComboboxButton>

                    {/* Clear button if there's a selection */}
                    {(selected || inputText) && (
                      <button
                        type="button"
                        className="btn btn-neutral join-item px-2"
                        onClick={resetSelection}>
                        <LucideIcon icon={X} size={20} />
                      </button>
                    )}

                    {/* Dropdown button as last join item */}
                    <ComboboxButton className="btn btn-neutral join-item px-2">
                      <LucideIcon icon={open ? ChevronUp : ChevronDown} size={20} />
                    </ComboboxButton>
                  </div>
                  <ComboboxOptions as="div">
                    {open && availableSuggestions.length > 0 && (
                      <DropdownList>
                        {availableSuggestions.map((suggestion) => (
                          <ComboboxOption as="div" key={suggestion.key} value={suggestion}>
                            {({ active, selected }) => (
                              <DropdownListItem
                                key={suggestion.id}
                                itemValue={suggestion.key}
                                itemSearchString={inputText}
                                active={active}
                                selected={selected}
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
          )}
        />
      </div>
      <FormErrorBadge error={errors} />
    </>
  )
}
