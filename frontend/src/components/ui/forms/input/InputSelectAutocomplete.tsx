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
import { Alert } from 'components/ui/feedback/Alert'
import { FormErrorBadge } from 'components/ui/forms/formErrorBadge'
import { DropdownList } from 'components/ui/forms/input/shared/dropdownList'
import { DropdownListItem } from 'components/ui/forms/input/shared/dropdownListItem'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { sortBy } from 'es-toolkit/compat'
import { ModelsEntityReference } from 'lib/api/lasius'
import { cleanStrForCmp } from 'lib/utils/string/strings'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

export type SelectAutocompleteSuggestionType = ModelsEntityReference

type Props = {
  suggestions: SelectAutocompleteSuggestionType[]
  name: string
  required?: boolean
  id?: string
  selectedItem?: SelectAutocompleteSuggestionType | null // Pre-resolved selected item (wrapper handles finding logic)
  statusMessage?: {
    text: string
    variant: 'info' | 'warning' | 'error'
  } | null
}

export const InputSelectAutocomplete: React.FC<Props> = ({
  suggestions = [],
  name,
  required = false,
  id,
  selectedItem,
  statusMessage,
}) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const errors = parentFormContext?.formState.errors[name]

  const [inputText, setInputText] = useState<string>('')
  const [selected, setSelected] = useState<SelectAutocompleteSuggestionType | ''>('')
  const [filterText, setFilterText] = useState<string>('')

  const resetSelection = () => {
    setSelected('')
    setInputText('')
    setFilterText('')
    parentFormContext?.setValue(name, null)
    // Focus the input after resetting
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    if (!parentFormContext) return

    const formValue = parentFormContext.getValues()[name]

    if (formValue && selectedItem) {
      // Wrapper component has already resolved the item
      setSelected(selectedItem)
      setInputText(selectedItem.key)
      setFilterText(selectedItem.key)
    } else if (formValue) {
      // No selected item provided, show ID as placeholder
      setSelected('')
      setInputText(`[${formValue}]`)
      setFilterText('')
    } else {
      setSelected('')
      setInputText('')
      setFilterText('')
    }
  }, [name, parentFormContext, selectedItem])

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
                  // Blur the input after selection
                  setTimeout(() => {
                    inputRef.current?.blur()
                  }, 0)
                }
              }}
              as="div">
              {({ open }) => (
                <>
                  <div className="join w-full">
                    <ComboboxButton as="div" className="join-item flex-1">
                      <ComboboxInput
                        as={Input}
                        ref={inputRef}
                        id={id || name}
                        className="mb-0 w-full text-sm"
                        onChange={(e) => {
                          const newValue = e.currentTarget.value
                          setInputText(newValue)
                          setFilterText(newValue)
                        }}
                        onFocus={() => {
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

                    {(selected || inputText) && (
                      <button
                        type="button"
                        className="btn btn-neutral join-item px-2"
                        onClick={resetSelection}>
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
      {statusMessage && (
        <Alert variant={statusMessage.variant} className="mt-2">
          {statusMessage.text}
        </Alert>
      )}
    </>
  )
}
