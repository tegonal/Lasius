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

import { DurationSegmentInput } from './date-picker/shared/duration-segment-input'

type DurationInputProperties = {
  error?: boolean
  id?: string
  onChange: (milliseconds: number) => void
  value: number // value in milliseconds
}

/**
 * Interactive duration input component with HH:MM format and arrow controls.
 * Works with milliseconds internally but displays as hours:minutes.
 */
export const DurationInput = ({ error, id, onChange, value }: DurationInputProperties) => (
  <DurationSegmentInput
    durationMinutes={Math.round(value / 60_000)}
    id={id}
    isInvalid={!!error}
    onDurationChange={(minutes) => onChange(minutes * 60_000)}
  />
)
