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
	addMonths,
	format,
	isSameDay,
	isToday,
	setHours,
	setMinutes,
	startOfMonth,
	subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCalendarMonth } from '~/hooks/use-calendar-month'
import { cn } from '~/lib/utils/cn'
import { formatISOLocale, type IsoDateString } from '~/lib/utils/dates'

type CalendarDisplayProps = {
	onChange: (date: IsoDateString) => void
	value: IsoDateString
}

export const CalendarDisplay = ({ onChange, value }: CalendarDisplayProps) => {
	const { t } = useTranslation('common')
	const selectedDate = new Date(value)
	const [originalTime, setOriginalTime] = useState<number[]>([0, 0])

	const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate))
	const { monthDays, startOffset, weekDays } = useCalendarMonth(viewDate)

	// Store the original time when the value changes
	useEffect(() => {
		if (value) {
			const date = new Date(value)
			setOriginalTime([date.getHours(), date.getMinutes()])
			setViewDate(startOfMonth(date))
		}
	}, [value])

	const handlePrevMonth = () => setViewDate((prev) => subMonths(prev, 1))
	const handleNextMonth = () => setViewDate((prev) => addMonths(prev, 1))

	const handleDayClick = (day: Date) => {
		// Preserve the original time when selecting a new date
		const updatedDate = setMinutes(
			setHours(day, originalTime[0] ?? 0),
			originalTime[1] ?? 0,
		)
		onChange(formatISOLocale(updatedDate))
	}

	const handleToday = () => {
		const today = new Date()
		setViewDate(startOfMonth(today))
		const updatedDate = setMinutes(
			setHours(today, originalTime[0] ?? 0),
			originalTime[1] ?? 0,
		)
		onChange(formatISOLocale(updatedDate))
	}

	const showTodayButton = !isToday(selectedDate)

	return (
		<div className="w-full select-none">
			<div className="mb-3 flex items-center justify-between">
				<button
					aria-label={t('calendar.navigation.previousMonth', {
						defaultValue: 'Previous month',
					})}
					className="btn btn-ghost btn-sm btn-circle"
					onClick={handlePrevMonth}
				>
					<ChevronLeft size={16} />
				</button>
				<div className="flex flex-col items-center">
					<div className="text-sm font-medium">{format(viewDate, 'MMMM')}</div>
					<div className="text-base-content/60 text-xs">
						{format(viewDate, 'yyyy')}
					</div>
				</div>
				<button
					aria-label={t('calendar.navigation.nextMonth', {
						defaultValue: 'Next month',
					})}
					className="btn btn-ghost btn-sm btn-circle"
					onClick={handleNextMonth}
				>
					<ChevronRight size={16} />
				</button>
			</div>

			{showTodayButton && (
				<div className="mb-2 flex justify-center">
					<button
						aria-label={t('common.time.today', {
							defaultValue: 'Today',
						})}
						className="btn btn-ghost btn-xs"
						onClick={handleToday}
					>
						{t('common.time.today', { defaultValue: 'Today' })}
					</button>
				</div>
			)}

			<div className="mb-1 grid grid-cols-7 gap-1 text-center">
				{weekDays.map((day, index) => (
					<div className="text-base-content/60 text-xs font-medium" key={index}>
						{day}
					</div>
				))}
			</div>

			<div className="grid w-full grid-cols-7 gap-1">
				{Array.from({ length: startOffset }, (_, i) => (
					<div key={`filler-${i}`} />
				))}
				{monthDays.map((day) => {
					const isSelected = isSameDay(day, selectedDate)
					const isTodayDate = isToday(day)

					return (
						<button
							aria-label={`Select ${day.toLocaleDateString()}`}
							className={cn(
								'flex h-8 w-full cursor-pointer items-center justify-center rounded text-sm transition-colors',
								isSelected && 'bg-secondary text-secondary-content',
								!isSelected && 'hover:bg-base-200',
								isTodayDate && !isSelected && 'text-secondary font-bold',
							)}
							key={day.toISOString()}
							onClick={() => handleDayClick(day)}
						>
							{day.getDate()}
						</button>
					)
				})}
			</div>
		</div>
	)
}
