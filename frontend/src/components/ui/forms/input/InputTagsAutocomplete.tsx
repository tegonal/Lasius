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

import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { Tag, TagList } from 'components/ui/data-display/TagList'
import { DropdownList } from 'components/ui/forms/input/shared/dropdownList'
import { Icon } from 'components/ui/icons/Icon'
import { differenceBy, filter, noop, sortBy, uniqBy } from 'es-toolkit/compat'
import { ModelsSimpleTag } from 'lib/api/lasius'
import { cleanStrForCmp } from 'lib/utils/string/strings'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { ModelsTags, ModelsTagWithSummary } from 'types/common'

const sortById = (items: ModelsTags[]) => sortBy(items, ['id'])

type Props = {
  suggestions: ModelsTags[] | undefined
  name: string
  id?: string
}

export const InputTagsAutocomplete: React.FC<Props> = ({ suggestions = [], name, id }) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()

  const [inputText, setInputText] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<ModelsTags[]>([])
  const [isFocused, setIsFocused] = useState<boolean>(false)

  useEffect(() => {
    if (!parentFormContext) return () => null
    const subscription = parentFormContext.watch((value, { name: fieldname }) => {
      if (name === fieldname) {
        setSelectedTags(value[name])
      }
    })
    return () => subscription.unsubscribe()
  }, [name, parentFormContext])

  // Get the current projectId from the form
  const projectId = parentFormContext?.watch('projectId')

  // Control whether to show the dropdown
  // const shouldShowDropdown = isFocused && projectId // Commented out - not currently used

  // Show all tags when focused with a project selected and no input text
  // Otherwise filter by input text
  const availableSuggestions = sortById(
    differenceBy(suggestions as ModelsTagWithSummary[], selectedTags ?? [], 'id').filter((tag) => {
      // If no input text, show all tags
      if (!inputText) {
        return true
      }
      // Otherwise filter by input text
      return (
        cleanStrForCmp(tag.summary || '').includes(cleanStrForCmp(inputText)) ||
        cleanStrForCmp(tag.id).includes(cleanStrForCmp(inputText))
      )
    }),
  )

  const removeTag = (tag: ModelsTags) => {
    const toRemove = filter(selectedTags, { id: tag.id })
    const tags = differenceBy(selectedTags, toRemove, 'id')
    setSelectedTags(tags)
    parentFormContext.setValue(name, tags)
  }

  const addTag = (tag: any) => {
    if (tag) {
      const tags = uniqBy([...selectedTags, tag], 'id')
      setInputText('')
      setSelectedTags(tags)
      parentFormContext.setValue(name, tags)
    }
  }

  const inputTag: ModelsSimpleTag = { id: inputText, type: 'SimpleTag' }

  const displayCreateTag =
    inputText.length > 0 && !selectedTags.find((s) => s && s.id === inputText)

  if (!parentFormContext) return null

  // const preventDefault = (e: any) => {
  //   if (inputText) e.preventDefault()
  // } // Commented out - not currently used

  const inputValueChanged = (e: any) => {
    setInputText(e.currentTarget.value)
  }

  return (
    <div>
      {selectedTags.length > 0 && (
        <div className="my-2">
          <TagList items={selectedTags} clickHandler={removeTag} />
        </div>
      )}
      <div className="relative">
        <Controller
          name={name}
          control={parentFormContext.control}
          render={() => (
            <Combobox value={selectedTags} onChange={addTag}>
              {({ open }) => (
                <>
                  <ComboboxInput
                    id={id || name}
                    className="input input-bordered w-full pr-10 text-sm"
                    onChange={inputValueChanged}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    displayValue={() => inputText}
                    placeholder={t('tags.chooseOrEnter', { defaultValue: 'Choose or enter tags' })}
                    autoComplete="off"
                    value={inputText}
                  />
                  {inputText && (
                    <div
                      className="hover:text-accent absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                      onClick={() => setInputText('')}>
                      <Icon name="remove-circle-interface-essential" size={20} />
                    </div>
                  )}
                  <ComboboxOptions as="div" static={isFocused && projectId && !open}>
                    {(open || (isFocused && projectId)) &&
                      (displayCreateTag || availableSuggestions.length > 0) && (
                        <DropdownList className="flex flex-wrap gap-0 px-2">
                          {displayCreateTag && (
                            <ComboboxOption
                              as="div"
                              key="create_tag"
                              className="mb-2 flex w-fit basis-full items-center gap-2 p-1"
                              value={inputTag}>
                              {({ focus }) => (
                                <>
                                  <div className="text-sm">{`${t('tags.customTag', { defaultValue: 'Custom tag' })}: `}</div>
                                  <Tag
                                    active={focus}
                                    item={inputTag}
                                    clickHandler={noop}
                                    hideRemoveIcon
                                  />
                                </>
                              )}
                            </ComboboxOption>
                          )}
                          {availableSuggestions.map((item) => (
                            <ComboboxOption
                              as="div"
                              key={item.id}
                              value={item}
                              className="w-fit p-1">
                              {({ active }) => (
                                <Tag
                                  active={active}
                                  item={item}
                                  clickHandler={noop}
                                  hideRemoveIcon
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
    </div>
  )
}
