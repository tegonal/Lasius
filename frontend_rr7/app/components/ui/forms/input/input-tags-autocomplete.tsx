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

import { type FieldMetadata, useInputControl } from '@conform-to/react'
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { XCircleIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tag, TagList } from '~/components/ui/data-display/tag-list'
import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { DropdownList } from '~/components/ui/forms/input/shared/dropdown-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cleanStrForCmp } from '~/lib/utils/strings'
import { isImporterTag } from '~/lib/utils/tag-helpers'
import { type ModelsSimpleTag, type ModelsTag } from '~/services/api/lasius'

type ModelsTagWithSummary = ModelsTag & { summary?: string }

const noop = () => {}

const sortById = (items: ModelsTag[]) =>
  [...items].toSorted((a, b) => a.id.localeCompare(b.id))

const differenceById = (
  arr: ModelsTagWithSummary[],
  exclude: ModelsTag[],
): ModelsTagWithSummary[] => {
  const excludeIds = new Set(exclude.map((t) => t.id))
  return arr.filter((item) => !excludeIds.has(item.id))
}

const uniqById = (arr: ModelsTag[]): ModelsTag[] => {
  const seen = new Set<string>()
  return arr.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

type InputTagsAutocompleteProps = {
  field: FieldMetadata<string>
  id?: string
  /** Context value for projectId — in Conform mode there's no shared form context */
  projectId?: string
  suggestions: ModelsTag[] | undefined
}

/**
 * Shared combobox UI for tag selection — receives tags and callbacks from mode-specific wrapper.
 */
const TagsComboboxCore = ({
  id,
  inputRef,
  onTagsChange,
  projectId,
  selectedTags,
  suggestions = [],
}: {
  id?: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onTagsChange: (tags: ModelsTag[]) => void
  projectId: string | undefined
  selectedTags: ModelsTag[]
  suggestions: ModelsTag[] | undefined
}) => {
  const { t } = useTranslation('common')
  const [inputText, setInputText] = useState<string>('')
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const filteredSuggestions = differenceById(
    suggestions as ModelsTagWithSummary[],
    selectedTags ?? [],
  ).filter((tag: ModelsTagWithSummary) => {
    if (!inputText) return true
    return (
      cleanStrForCmp(tag.summary || '').includes(cleanStrForCmp(inputText)) ||
      cleanStrForCmp(tag.id).includes(cleanStrForCmp(inputText))
    )
  })

  const { nonPlatformTags, platformTags } = useMemo(() => {
    const nonPlatform: ModelsTag[] = []
    const platform: ModelsTag[] = []

    for (const tag of filteredSuggestions) {
      if (isImporterTag(tag)) {
        platform.push(tag)
      } else {
        nonPlatform.push(tag)
      }
    }

    return {
      nonPlatformTags: sortById(nonPlatform),
      platformTags: sortById(platform),
    }
  }, [filteredSuggestions])

  const removeTag = (tag: ModelsTag) => {
    onTagsChange(selectedTags.filter((s) => s.id !== tag.id))
  }

  const handleChange = (newTags: ModelsTag[]) => {
    const tags = uniqById(newTags)
    setInputText('')
    onTagsChange(tags)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const inputTag: ModelsSimpleTag = { id: inputText, type: 'SimpleTag' }

  const displayCreateTag =
    inputText.length > 0 && !selectedTags.some((s) => s && s.id === inputText)

  const hasAnySuggestions =
    nonPlatformTags.length > 0 || platformTags.length > 0

  const inputValueChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.currentTarget.value)
  }

  return (
    <div>
      {selectedTags.length > 0 && (
        <div className="my-2">
          <TagList clickHandler={removeTag} items={selectedTags} width="sm" />
        </div>
      )}
      <div className="relative">
        <Combobox multiple onChange={handleChange} value={selectedTags}>
          {({ open }) => (
            <>
              <ComboboxInput
                autoComplete="off"
                className="input input-bordered w-full pr-10 text-sm"
                displayValue={() => inputText}
                id={id}
                onBlur={() => setIsFocused(false)}
                onChange={inputValueChanged}
                onFocus={() => setIsFocused(true)}
                placeholder={t('tag-manager:chooseOrEnter', {
                  defaultValue: 'Choose or enter tags',
                })}
                ref={inputRef}
                value={inputText}
              />
              {inputText && (
                <div
                  className="hover:text-accent absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setInputText('')}
                >
                  <LucideIcon icon={XCircleIcon} size={20} />
                </div>
              )}
              <ComboboxOptions
                as="div"
                static={isFocused && !!projectId && !open}
              >
                {(open || (isFocused && projectId)) &&
                  (displayCreateTag || hasAnySuggestions) && (
                    <DropdownList className="flex flex-wrap gap-0 px-2">
                      {displayCreateTag && (
                        <ComboboxOption
                          as="div"
                          className="mb-2 flex w-fit basis-full items-center gap-2 p-1"
                          key="create_tag"
                          value={inputTag}
                        >
                          {({ focus }) => (
                            <>
                              <div className="text-sm">{`${t('tag-manager:customTag', { defaultValue: 'Custom tag' })}: `}</div>
                              <Tag
                                active={focus}
                                clickHandler={noop}
                                hideRemoveIcon
                                item={inputTag}
                              />
                            </>
                          )}
                        </ComboboxOption>
                      )}
                      {nonPlatformTags.map((item: ModelsTag) => (
                        <ComboboxOption
                          as="div"
                          className="w-fit p-1"
                          key={item.id}
                          value={item}
                        >
                          {({ focus }: { focus: boolean }) => (
                            <Tag
                              active={focus}
                              clickHandler={noop}
                              hideRemoveIcon
                              item={item}
                            />
                          )}
                        </ComboboxOption>
                      ))}
                      {platformTags.map((item: ModelsTag) => (
                        <ComboboxOption
                          as="div"
                          className="w-fit p-1"
                          key={item.id}
                          value={item}
                        >
                          {({ focus }: { focus: boolean }) => (
                            <Tag
                              active={focus}
                              clickHandler={noop}
                              hideRemoveIcon
                              item={item}
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
    </div>
  )
}

export const InputTagsAutocomplete = ({
  field,
  id,
  projectId,
  suggestions,
}: InputTagsAutocompleteProps) => {
  const control = useInputControl(field)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTags: ModelsTag[] = useMemo(() => {
    if (!control.value) return []
    try {
      return JSON.parse(control.value) as ModelsTag[]
    } catch {
      return []
    }
  }, [control.value])

  const handleTagsChange = (tags: ModelsTag[]) => {
    control.change(tags.length > 0 ? JSON.stringify(tags) : '')
  }

  return (
    <>
      <input name={field.name} type="hidden" value={control.value ?? ''} />
      <TagsComboboxCore
        id={id || field.id}
        inputRef={inputRef}
        onTagsChange={handleTagsChange}
        projectId={projectId}
        selectedTags={selectedTags}
        suggestions={suggestions}
      />
      <FormFieldErrors errors={field.errors} />
    </>
  )
}
