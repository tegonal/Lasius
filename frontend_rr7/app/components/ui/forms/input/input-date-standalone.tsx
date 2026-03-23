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

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CalendarIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/primitives/buttons/button'
import { CalendarDisplay } from '~/components/ui/forms/input/calendar/calendar-display'
import { LucideIcon } from '~/components/ui/icons/lucide-icon'
import { formatISOLocale } from '~/lib/utils/dates'

type InputDateStandaloneProps = {
  id?: string
  onChange: (value: string) => void
  value: string
}

export const InputDateStandalone = ({
  id,
  onChange,
  value,
}: InputDateStandaloneProps) => {
  const { t } = useTranslation('common')

  const handleCalendarChange = (isoDateString: string, close: () => void) => {
    const datePart = isoDateString.split('T')[0] || ''
    onChange(datePart)
    close()
  }

  const calendarValue = value
    ? formatISOLocale(new Date(value))
    : formatISOLocale(new Date())

  return (
    <Popover>
      <div className="join w-full">
        <input
          className="input input-bordered join-item w-full"
          id={id}
          onChange={(e) => onChange(e.target.value)}
          type="date"
          value={value}
        />
        <PopoverButton
          as={Button}
          className="px-2"
          fullWidth={false}
          join
          type="button"
          variant="neutral"
        >
          <LucideIcon icon={CalendarIcon} size={20} />
        </PopoverButton>
      </div>
      <PopoverPanel
        anchor="bottom start"
        className="bg-base-100 border-base-300 z-50 w-[360px] rounded-lg border shadow-lg [--anchor-gap:8px]"
      >
        {({ close }) => (
          <div className="relative p-4 pr-12">
            <button
              aria-label={t('common.actions.close', {
                defaultValue: 'Close',
              })}
              className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2"
              onClick={() => close()}
            >
              <LucideIcon icon={X} size={16} />
            </button>
            <CalendarDisplay
              onChange={(date) => handleCalendarChange(date, close)}
              value={calendarValue}
            />
          </div>
        )}
      </PopoverPanel>
    </Popover>
  )
}
