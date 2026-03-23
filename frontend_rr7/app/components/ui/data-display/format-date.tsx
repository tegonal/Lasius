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

import { format } from 'date-fns'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { getDateLocale } from '~/lib/utils/date-locale'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

// ─── Format map ──────────────────────────────────────────────────────────────

const dateFormats = {
  day: 'd',
  dayNameLong: 'eeee',
  dayNameShort: 'eeeeee',
  dayPadded: 'dd',
  fullDateLong: 'PPpp',
  fullDateShort: 'P',
  monthNameLong: 'MMMM',
  monthNameShort: 'MMM',
  time: 'HH:mm',
  year: 'yyyy',
} as const

export type DateFormatKey = keyof typeof dateFormats

// ─── Component ───────────────────────────────────────────────────────────────

export const FormatDate = memo(function FormatDate({
  date,
  format: formatKey,
}: {
  date: Date | IsoDateString
  format: DateFormatKey
}) {
  const { i18n } = useTranslation('common')
  const locale = getDateLocale(i18n.language)
  const dateStr = typeof date === 'string' ? date : formatISOLocale(date)
  const formatted = format(new Date(dateStr), dateFormats[formatKey], {
    locale,
  })
  return <>{formatted}</>
})
