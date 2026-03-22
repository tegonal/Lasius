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
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from '@headlessui/react'
import { XCircleIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Tag, TagList } from '~/components/ui/data-display/tag-list'
import { DropdownList } from '~/components/ui/forms/input/shared/dropdown-list'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cleanStrForCmp } from '~/lib/utils/strings'
import { isImporterTag } from '~/lib/utils/tag-helpers'
import { type ModelsSimpleTag, type ModelsTag } from '~/services/api/lasius'

type ModelsTagWithSummary = ModelsTag & { summary?: string }

const noop = () => {}

const sortById = (items: ModelsTag[]) =>
	[...items].sort((a, b) => a.id.localeCompare(b.id))

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

type Props = {
	id?: string
	name: string
	suggestions: ModelsTag[] | undefined
}

export const InputTagsAutocomplete = ({
	id,
	name,
	suggestions = [],
}: Props) => {
	const { t } = useTranslation('common')
	const parentFormContext = useFormContext()

	const [inputText, setInputText] = useState<string>('')
	const [selectedTags, setSelectedTags] = useState<ModelsTag[]>([])
	const [isFocused, setIsFocused] = useState<boolean>(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!parentFormContext) return () => null
		const subscription = parentFormContext.watch(
			(value, { name: fieldname }) => {
				if (name === fieldname && Array.isArray(value[name])) {
					setSelectedTags(value[name] as ModelsTag[])
				}
			},
		)
		return () => subscription.unsubscribe()
	}, [name, parentFormContext])

	// Get the current projectId from the form
	const projectId = parentFormContext?.watch('projectId') as string | undefined

	// Show all tags when focused with a project selected and no input text
	// Otherwise filter by input text
	const filteredSuggestions = differenceById(
		suggestions as ModelsTagWithSummary[],
		selectedTags ?? [],
	).filter((tag: ModelsTagWithSummary) => {
		// If no input text, show all tags
		if (!inputText) {
			return true
		}
		// Otherwise filter by input text
		return (
			cleanStrForCmp(tag.summary || '').includes(cleanStrForCmp(inputText)) ||
			cleanStrForCmp(tag.id).includes(cleanStrForCmp(inputText))
		)
	})

	// Separate platform tags (importers) from non-platform tags
	const { nonPlatformTags, platformTags } = useMemo(() => {
		const nonPlatform: ModelsTag[] = []
		const platform: ModelsTag[] = []

		filteredSuggestions.forEach((tag: ModelsTag) => {
			if (isImporterTag(tag)) {
				platform.push(tag)
			} else {
				nonPlatform.push(tag)
			}
		})

		return {
			nonPlatformTags: sortById(nonPlatform),
			platformTags: sortById(platform),
		}
	}, [filteredSuggestions])

	const removeTag = (tag: ModelsTag) => {
		const tags = selectedTags.filter((s) => s.id !== tag.id)
		setSelectedTags(tags)
		parentFormContext.setValue(name, tags)
	}

	const handleChange = (newTags: ModelsTag[]) => {
		const tags = uniqById(newTags)
		setInputText('')
		setSelectedTags(tags)
		parentFormContext.setValue(name, tags)
		// Refocus the input to allow continuous tag entry
		// Use setTimeout to ensure the focus happens after any blur events
		setTimeout(() => {
			inputRef.current?.focus()
		}, 0)
	}

	const inputTag: ModelsSimpleTag = { id: inputText, type: 'SimpleTag' }

	const displayCreateTag =
		inputText.length > 0 && !selectedTags.find((s) => s && s.id === inputText)

	const hasAnySuggestions =
		nonPlatformTags.length > 0 || platformTags.length > 0

	if (!parentFormContext) return null

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
				<Controller
					control={parentFormContext.control}
					name={name}
					render={({ field }) => (
						<Combobox multiple onChange={handleChange} value={selectedTags}>
							{({ open }) => (
								<>
									<ComboboxInput
										autoComplete="off"
										className="input input-bordered w-full pr-10 text-sm"
										displayValue={() => inputText}
										id={id || name}
										onBlur={() => setIsFocused(false)}
										onChange={inputValueChanged}
										onFocus={() => setIsFocused(true)}
										placeholder={t('tags.chooseOrEnter', {
											defaultValue: 'Choose or enter tags',
										})}
										ref={(el: HTMLInputElement | null) => {
											inputRef.current = el
											field.ref(el)
										}}
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
																	<div className="text-sm">{`${t('tags.customTag', { defaultValue: 'Custom tag' })}: `}</div>
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
					)}
				/>
			</div>
		</div>
	)
}
