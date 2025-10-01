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
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { differenceBy, filter, noop, uniqBy } from 'es-toolkit/compat'
import { ModelsSimpleTag } from 'lib/api/lasius'
import { XCircle } from 'lucide-react'
import { useTranslation } from 'next-i18next'
import React, { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { ModelsTags } from 'types/common'

type Props = {
  name: 'tagGroups' | 'simpleTags'
  tags: ModelsTags[] | []
  tagGroupIndex?: number
}

export const InputTagsAdmin: React.FC<Props> = ({ name, tags = [], tagGroupIndex = 0 }) => {
  const { t } = useTranslation('common')
  const parentFormContext = useFormContext()
  const [inputText, setInputText] = useState<string>('')

  const [selectedTags, setSelectedTags] = useState<ModelsTags[]>(tags)

  useEffect(() => {
    if (!parentFormContext) return () => null
    const subscription = parentFormContext.watch((value, { name: fieldname }) => {
      if (name === fieldname) {
        if (
          fieldname === 'tagGroups' &&
          Array.isArray(value[name]) &&
          value[name][tagGroupIndex]?.relatedTags
        ) {
          setSelectedTags(value[name][tagGroupIndex].relatedTags)
        } else {
          setSelectedTags(value[name])
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [name, parentFormContext, tagGroupIndex])

  const updateTags = (tags: ModelsTags[]) => {
    if (name === 'tagGroups') {
      const currentTags = parentFormContext.getValues(name)
      currentTags[tagGroupIndex].relatedTags = tags
      parentFormContext.setValue(name, currentTags)
    } else {
      parentFormContext.setValue(name, tags)
    }
    setSelectedTags(tags)
  }

  const removeTag = (tag: ModelsTags) => {
    const toRemove = filter(selectedTags, { id: tag.id })
    const tags = differenceBy(selectedTags, toRemove, 'id')

    updateTags(tags)
  }

  const addTag = (tag: any) => {
    if (tag) {
      const tags = uniqBy([...selectedTags, tag], 'id')
      setInputText('')
      updateTags(tags)
    }
  }

  const inputTag: ModelsSimpleTag = { id: inputText, type: 'SimpleTag' }

  const displayCreateTag = inputText.length > 0 && !selectedTags.find((s) => s.id === inputText)

  if (!parentFormContext) return null

  const preventDefault = (e: any) => {
    if (inputText) e.preventDefault()
  }

  const inputValueChanged = (e: any) => {
    if (e.currentTarget.value == ' ') {
      // ignore initial space as this should only open the combobox
      setInputText('')
    } else {
      setInputText(e.currentTarget.value)
    }
  }

  return (
    <div>
      {Array.isArray(selectedTags) && selectedTags.length > 0 && (
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
                    className="input input-bordered w-full pr-10 text-sm"
                    onChange={inputValueChanged}
                    onClick={preventDefault}
                    displayValue={() => inputText}
                    placeholder={t('tags.enterToAdd', { defaultValue: 'Enter a tag to add it' })}
                    autoComplete="off"
                  />
                  {inputText && (
                    <div
                      className="hover:text-accent absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                      onClick={() => setInputText('')}>
                      <LucideIcon icon={XCircle} size={20} />
                    </div>
                  )}
                  <ComboboxOptions as="div">
                    {open && displayCreateTag && (
                      <DropdownList className="flex flex-wrap gap-0 px-2">
                        {displayCreateTag && (
                          <ComboboxOption
                            as="div"
                            key="create_tag"
                            className="mb-2 flex w-fit basis-full items-center gap-2 p-1"
                            value={inputTag}>
                            {({ active }) => (
                              <>
                                <div className="text-sm">{`${t('tags.customTag', { defaultValue: 'Custom tag' })}: `}</div>
                                <Tag
                                  active={active}
                                  item={inputTag}
                                  clickHandler={noop}
                                  hideRemoveIcon
                                />
                              </>
                            )}
                          </ComboboxOption>
                        )}
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
