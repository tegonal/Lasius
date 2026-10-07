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

import { Listbox } from '@headlessui/react'
import { useTranslation } from 'react-i18next'

import { ListboxOptionList, ListboxTrigger } from '~/components/ui/forms/input/listbox-parts'
import { cn } from '~/lib/utils/cn'

export interface MultiSelectOption {
  disabled?: boolean
  label: string
  value: string
}

interface MultiSelectProperties {
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
  placeholder,
  value,
}: MultiSelectProperties) => {
  const { t } = useTranslation('common')
  const selectedOptions = options.filter((option) => value.includes(option.value))

  const displayText =
    selectedOptions.length === 0
      ? (placeholder ?? t('forms.multiSelect.placeholder', 'Select options'))
      : selectedOptions.length === 1
        ? selectedOptions[0]?.label
        : t('forms.multiSelect.selectedCount', '{{count}} selected', {
            count: selectedOptions.length,
          })

  return (
    <Listbox disabled={disabled} multiple name={name} onChange={onChange} value={value}>
      <div className={cn('join relative w-full', className)}>
        <ListboxTrigger
          buttonClassName={buttonClassName}
          id={id}
          isPlaceholder={selectedOptions.length === 0}>
          {displayText}
        </ListboxTrigger>
        <ListboxOptionList options={options} optionsClassName={optionsClassName} />
      </div>
    </Listbox>
  )
}
