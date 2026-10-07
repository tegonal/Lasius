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

import { CalendarPopover } from '~/components/ui/forms/input/date-picker/calendar-popover'

type InputDateStandaloneProperties = {
  id?: string
  onChange: (value: string) => void
  value: string
}

/** A native date input with a calendar button. The value is a `yyyy-MM-dd` string. */
export const InputDateStandalone = ({ id, onChange, value }: InputDateStandaloneProperties) => (
  <div className="join w-full">
    <input
      className="input input-bordered join-item w-full"
      id={id}
      onChange={(event) => onChange(event.target.value)}
      type="date"
      value={value}
    />
    <CalendarPopover
      date={value ? new Date(value) : null}
      onSelect={(isoDateString) => onChange(isoDateString.split('T', 1)[0] || '')}
    />
  </div>
)
