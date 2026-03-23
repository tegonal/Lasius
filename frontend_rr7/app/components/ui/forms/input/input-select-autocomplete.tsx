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
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/primitives/inputs/input'
import { FormErrorBadge } from '~/components/ui/forms/form-error-badge'
import { DropdownList } from '~/components/ui/forms/input/shared/dropdown-list'
import { DropdownListItem } from '~/components/ui/forms/input/shared/dropdown-list-item'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cleanStrForCmp } from '~/lib/utils/strings'
import { type ModelsEntityReference } from '~/services/api/lasius'

export type SelectAutocompleteSuggestionType = ModelsEntityReference

type InputSelectAutocompleteProps = {
  id?: string
  name: string
  required?: boolean
  selectedItem?: null | SelectAutocompleteSuggestionType
  statusMessage?: null | {
    text: string
    variant: 'error' | 'info' | 'warning'
  }
  suggestions: SelectAutocompleteSuggestionType[]
}

const alertVariantClass: Record<string, string> = {
  error: 'alert alert-error',
  info: 'alert alert-info',
  warning: 'alert alert-warning',
}

export const InputSelectAutocomplete = ({
  id,
  name,
  required = false,
  selectedItem,
  statusMessage,
  suggestions = [],
}: InputSelectAutocompleteProps) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()
  const inputRef = useRef<HTMLInputElement>(null)

  const errors = parentFormContext?.formState.errors[name]

  const [inputText, setInputText] = useState<string>('')
  const [selected, setSelected] = useState<
    '' | SelectAutocompleteSuggestionType
  >('')
  const [filterText, setFilterText] = useState<string>('')

  const resetSelection = () => {
    setSelected('')
    setInputText('')
    setFilterText('')
    parentFormContext?.setValue(name, null)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    if (!parentFormContext) return

    const formValue = parentFormContext.getValues()[name]

    if (formValue && selectedItem) {
      setSelected(selectedItem)
      setInputText(selectedItem.key)
      setFilterText(selectedItem.key)
    } else if (formValue) {
      setSelected('')
      setInputText(`[${formValue}]`)
      setFilterText('')
    } else {
      setSelected('')
      setInputText('')
      setFilterText('')
    }
  }, [name, parentFormContext, selectedItem])

  const availableSuggestions = (
    filterText
      ? suggestions.filter((item) =>
          cleanStrForCmp(item.key).includes(cleanStrForCmp(filterText)),
        )
      : suggestions
  ).sort((a, b) => (a.key ?? '').localeCompare(b.key ?? ''))

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
          control={parentFormContext.control}
          name={name}
          render={({ field: { onChange, value } }) => (
            <Combobox
              as="div"
              onChange={(change: SelectAutocompleteSuggestionType) => {
                if (change?.id) {
                  onChange(change.id)
                  setTimeout(() => {
                    inputRef.current?.blur()
                  }, 0)
                }
              }}
              value={value}
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
                        displayValue={(
                          item: SelectAutocompleteSuggestionType,
                        ) => item?.key || ''}
                        id={id || name}
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
                        placeholder={t(
                          'projects.selectProject',
                          'Select project',
                        )}
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
                      <LucideIcon
                        icon={open ? ChevronUp : ChevronDown}
                        size={20}
                      />
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
                            {({ focus, selected }) => (
                              <DropdownListItem
                                active={focus}
                                itemSearchString={inputText}
                                itemValue={suggestion.key}
                                key={suggestion.id}
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
          rules={rules}
        />
      </div>
      <FormErrorBadge error={errors} />
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
