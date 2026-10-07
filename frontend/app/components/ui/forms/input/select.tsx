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

import { Select as BaseSelect } from '@base-ui/react/select'

import { ListboxOptionList, ListboxTrigger } from '~/components/ui/forms/input/listbox-parts'
import { cn } from '~/lib/utils/cn'

export interface SelectOption {
  disabled?: boolean
  label: string
  value: string
}

interface SelectProperties {
  buttonClassName?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
  onChange: (value: string) => void
  options: SelectOption[]
  optionsClassName?: string
  placeholder?: string
  value: string
}

export const Select = ({
  buttonClassName,
  className,
  disabled = false,
  id,
  name,
  onChange,
  options,
  optionsClassName,
  placeholder = 'Select an option',
  value,
}: SelectProperties) => {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <BaseSelect.Root
      disabled={disabled}
      name={name}
      onValueChange={(selected) => {
        if (selected !== null) onChange(selected)
      }}
      value={value}>
      <div className={cn('relative w-full', className)}>
        <ListboxTrigger buttonClassName={buttonClassName} id={id} isPlaceholder={!selectedOption}>
          {selectedOption?.label || placeholder}
        </ListboxTrigger>
        <ListboxOptionList options={options} optionsClassName={optionsClassName} />
      </div>
    </BaseSelect.Root>
  )
}
