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
import { Check, ChevronDown } from 'lucide-react'
import { Fragment } from 'react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cn } from '~/lib/utils/cn'

export interface MultiSelectOption {
  disabled?: boolean
  label: string
  value: string
}

interface MultiSelectProps {
  buttonClassName?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  optionsClassName?: string
  placeholder?: string
  value: string[]
}

export const MultiSelect = ({
  buttonClassName,
  className,
  disabled = false,
  id,
  name,
  onChange,
  options,
  optionsClassName,
  placeholder = 'Select options',
  value,
}: MultiSelectProps) => {
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  )

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0]?.label
        : `${selectedOptions.length} selected`

  return (
    <Listbox
      disabled={disabled}
      multiple
      name={name}
      onChange={onChange}
      value={value}
    >
      <div className={cn('join relative w-full', className)}>
        <ListboxButton
          className={cn(
            'input input-bordered join-item w-full text-left',
            'focus-visible:border-primary focus:outline-none',
            'disabled:bg-base-200 disabled:text-base-content/50',
            buttonClassName,
          )}
          id={id}
        >
          <span
            className={cn(
              'block truncate',
              selectedOptions.length === 0 && 'text-base-content/50',
            )}
          >
            {displayText}
          </span>
        </ListboxButton>
        <ListboxButton className="btn btn-neutral join-item px-2">
          <LucideIcon aria-hidden="true" icon={ChevronDown} size={20} />
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            className={cn(
              'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg',
              'bg-base-100 ring-base-300 py-1 shadow-lg ring-1',
              'focus:outline-none',
              optionsClassName,
            )}
          >
            {options.map((option) => (
              <ListboxOption
                className={({ focus }) =>
                  cn(
                    'relative cursor-pointer py-2 pr-4 pl-10 select-none',
                    focus
                      ? 'bg-primary text-primary-content dark:bg-primary/10 dark:text-primary'
                      : 'text-base-content',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )
                }
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={cn(
                        'block truncate text-base',
                        selected ? 'font-medium' : 'font-normal',
                      )}
                    >
                      {option.label}
                    </span>
                    {selected && (
                      <span className="text-base-content absolute inset-y-0 left-0 flex items-center pl-3">
                        <LucideIcon aria-hidden="true" icon={Check} size={20} />
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
