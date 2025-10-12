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
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { LucideIcon } from 'components/ui/icons/LucideIcon'
import { cn } from 'lib/utils/cn'
import { Check, ChevronDown } from 'lucide-react'
import React, { Fragment } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  optionsClassName?: string
  name?: string
  id?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select options',
  disabled = false,
  className,
  buttonClassName,
  optionsClassName,
  name,
  id,
}) => {
  const selectedOptions = options.filter((option) => value.includes(option.value))

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled} name={name} multiple>
      <div className={cn('join relative w-full', className)}>
        <ListboxButton
          id={id}
          className={cn(
            'input input-bordered join-item w-full text-left',
            'focus-visible:border-primary focus:outline-none',
            'disabled:bg-base-200 disabled:text-base-content/50',
            buttonClassName,
          )}>
          <span
            className={cn(
              'block truncate',
              selectedOptions.length === 0 && 'text-base-content/50',
            )}>
            {displayText}
          </span>
        </ListboxButton>
        <ListboxButton className="btn btn-neutral join-item px-2">
          <LucideIcon icon={ChevronDown} size={20} aria-hidden="true" />
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <ListboxOptions
            className={cn(
              'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg',
              'bg-base-100 ring-base-300 py-1 shadow-lg ring-1',
              'focus:outline-none',
              optionsClassName,
            )}>
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={({ active }) =>
                  cn(
                    'relative cursor-pointer py-2 pr-4 pl-10 select-none',
                    active
                      ? 'bg-primary text-primary-content dark:bg-primary/10 dark:text-primary'
                      : 'text-base-content',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )
                }>
                {({ selected }) => (
                  <>
                    <span
                      className={cn(
                        'block truncate text-base',
                        selected ? 'font-medium' : 'font-normal',
                      )}>
                      {option.label}
                    </span>
                    {selected && (
                      <span className="text-base-content absolute inset-y-0 left-0 flex items-center pl-3">
                        <LucideIcon icon={Check} size={20} aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}
