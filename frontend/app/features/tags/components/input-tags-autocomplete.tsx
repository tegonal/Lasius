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
import { type FieldMetadata, useInputControl } from '@conform-to/react'
import { XCircleIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FormFieldErrors } from '~/components/ui/forms/form-field-errors'
import { guardComboboxKey } from '~/components/ui/forms/input/shared/combobox-key-guard'
import { DropdownList } from '~/components/ui/forms/input/shared/dropdown-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { Tag, TagList } from '~/features/tags/components/tag-list'
import { cleanStringForComparison } from '~/lib/utils/strings'
import { isImporterTag } from '~/lib/utils/tag-helpers'
import { type ModelsSimpleTag, type ModelsTag } from '~/services/api/lasius'

type ModelsTagWithSummary = ModelsTag & { summary?: string }

const noop = () => {}

const NO_SUGGESTIONS: ModelsTag[] = []

const sortById = (items: ModelsTag[]) => [...items].toSorted((a, b) => a.id.localeCompare(b.id))

const differenceById = (
  array: ModelsTagWithSummary[],
  exclude: ModelsTag[],
): ModelsTagWithSummary[] => {
  const excludeIds = new Set(exclude.map((t) => t.id))
  return array.filter((item) => !excludeIds.has(item.id))
}

const uniqById = (array: ModelsTag[]): ModelsTag[] => {
  const seen = new Set<string>()
  return array.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

type InputTagsAutocompleteProperties = {
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
  suggestions = NO_SUGGESTIONS,
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
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const filteredSuggestions = differenceById(
    suggestions as ModelsTagWithSummary[],
    selectedTags ?? [],
  ).filter((tag: ModelsTagWithSummary) => {
    if (!inputText) return true
    return (
      cleanStringForComparison(tag.summary || '').includes(cleanStringForComparison(inputText)) ||
      cleanStringForComparison(tag.id).includes(cleanStringForComparison(inputText))
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

  const isDisplayCreateTag =
    inputText.length > 0 && selectedTags.every((s) => !(s && s.id === inputText))

  // The custom tag option comes first, then the tags without and with an importer platform.
  const listItems: ModelsTag[] = [
    ...(isDisplayCreateTag ? [inputTag] : []),
    ...nonPlatformTags,
    ...platformTags,
  ]

  return (
    <div>
      {selectedTags.length > 0 && (
        <div className="my-2">
          <TagList clickHandler={removeTag} items={selectedTags} width="sm" />
        </div>
      )}
      <div className="relative">
        <Combobox.Root
          filter={null}
          inputValue={inputText}
          isItemEqualToValue={(item: ModelsTag, current: ModelsTag) => item.id === current.id}
          items={listItems}
          itemToStringLabel={(item: ModelsTag) => item.id}
          multiple
          onInputValueChange={(text, details) => {
            // Base UI also clears the text on select. handleChange does that itself.
            if (details.reason === 'input-change') setInputText(text)
          }}
          onOpenChange={setIsOpen}
          onValueChange={handleChange}
          // The list also shows while the input has the focus and a project is set.
          open={isOpen || (isFocused && !!projectId)}
          value={selectedTags}>
          <Combobox.InputGroup>
            <Combobox.Input
              autoComplete="off"
              className="input input-bordered w-full pr-10 text-sm"
              id={id}
              onBlur={() => setIsFocused(false)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={(event) => guardComboboxKey(event, isOpen)}
              placeholder={t('tag-manager:chooseOrEnter', {
                defaultValue: 'Choose or enter tags',
              })}
              ref={inputRef}
            />
            {inputText && (
              <div
                className="hover:text-accent absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
                onClick={() => setInputText('')}>
                <LucideIcon icon={XCircleIcon} size={20} />
              </div>
            )}
          </Combobox.InputGroup>
          {listItems.length > 0 && (
            <DropdownList className="flex flex-wrap gap-0 px-2">
              {(item: ModelsTag, index: number) =>
                isDisplayCreateTag && index === 0 ? (
                  <Combobox.Item
                    className="mb-2 flex w-fit basis-full items-center gap-2 p-1"
                    key="create_tag"
                    render={(itemProperties, state) => (
                      <div {...itemProperties}>
                        <div className="text-sm">{`${t('tag-manager:customTag', { defaultValue: 'Custom tag' })}: `}</div>
                        <Tag
                          active={state.highlighted}
                          clickHandler={noop}
                          hideRemoveIcon
                          item={inputTag}
                        />
                      </div>
                    )}
                    value={inputTag}
                  />
                ) : (
                  <Combobox.Item
                    className="w-fit p-1"
                    key={`${isImporterTag(item) ? 'platform' : 'tag'}-${item.id}`}
                    render={(itemProperties, state) => (
                      <div {...itemProperties}>
                        <Tag
                          active={state.highlighted}
                          clickHandler={noop}
                          hideRemoveIcon
                          item={item}
                        />
                      </div>
                    )}
                    value={item}
                  />
                )
              }
            </DropdownList>
          )}
        </Combobox.Root>
      </div>
    </div>
  )
}

export const InputTagsAutocomplete = ({
  field,
  id,
  projectId,
  suggestions,
}: InputTagsAutocompleteProperties) => {
  const control = useInputControl(field)
  const inputReference = useRef<HTMLInputElement>(null)

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
        inputRef={inputReference}
        onTagsChange={handleTagsChange}
        projectId={projectId}
        selectedTags={selectedTags}
        suggestions={suggestions}
      />
      <FormFieldErrors errors={field.errors} />
    </>
  )
}
