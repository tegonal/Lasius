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
import { Check, ChevronDown } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { cn } from '~/lib/utils/cn'

type ListboxTriggerProperties = {
  buttonClassName?: string
  children: ReactNode
  id?: string
  isPlaceholder: boolean
}

/** The trigger of `Select` and `MultiSelect`: a text field look with a chevron button look. */
export const ListboxTrigger = ({
  buttonClassName,
  children,
  id,
  isPlaceholder,
}: ListboxTriggerProperties) => (
  <BaseSelect.Trigger className="group join w-full cursor-pointer focus:outline-none" id={id}>
    <span
      className={cn(
        'input input-bordered join-item w-full text-left',
        'group-focus-visible:border-primary',
        'group-data-[disabled]:bg-base-200 group-data-[disabled]:text-base-content/50',
        buttonClassName,
      )}>
      <span className={cn('block truncate', isPlaceholder && 'text-base-content/50')}>
        {children}
      </span>
    </span>
    <span className="btn btn-neutral join-item px-2">
      <LucideIcon aria-hidden="true" icon={ChevronDown} size={20} />
    </span>
  </BaseSelect.Trigger>
)

type ListboxOptionListProperties = {
  options: { disabled?: boolean; label: string; value: string }[]
  optionsClassName?: string
}

/** The option list of `Select` and `MultiSelect`, with a check mark on each selected option. */
export const ListboxOptionList = ({ options, optionsClassName }: ListboxOptionListProperties) => {
  const anchorReference = useRef<HTMLSpanElement>(null)
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(null)

  // Inside a modal dialog, the portal must render in the dialog focus trap.
  // Decision: rr7-context-menu-popover.
  useEffect(() => {
    const dialog = anchorReference.current?.closest('[role="dialog"]')
    if (dialog instanceof HTMLElement) {
      setDialogContainer(dialog)
    }
  }, [])

  return (
    <>
      <span className="hidden" ref={anchorReference} />
      {/* Base UI renders no portal for a null container; undefined means document.body. */}
      <BaseSelect.Portal container={dialogContainer ?? undefined}>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          className="z-50 w-[var(--anchor-width)]"
          side="bottom"
          sideOffset={4}>
          <BaseSelect.Popup
            className={cn(
              'max-h-60 w-full overflow-auto rounded-lg',
              'bg-base-100 ring-base-300 py-1 shadow-lg ring-1',
              'focus:outline-none',
              optionsClassName,
            )}>
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  className={cn(
                    'group text-base-content relative cursor-pointer py-2 pr-4 pl-10 select-none',
                    'data-[highlighted]:bg-primary data-[highlighted]:text-primary-content',
                    'dark:data-[highlighted]:bg-primary/10 dark:data-[highlighted]:text-primary',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                  disabled={option.disabled}
                  key={option.value}
                  label={option.label}
                  value={option.value}>
                  <BaseSelect.ItemText className="block truncate text-base font-normal group-data-[selected]:font-medium">
                    {option.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="text-base-content absolute inset-y-0 left-0 flex items-center pl-3">
                    <LucideIcon aria-hidden="true" icon={Check} size={20} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </>
  )
}
