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

import React from 'react'

interface TooltipContainerProps {
  title?: string
  children: React.ReactNode
}

export const TooltipContainer: React.FC<TooltipContainerProps> = ({ title, children }) => (
  <div className="bg-base-100 border-base-200 w-auto rounded border p-2 shadow-lg">
    {title && (
      <div className="text-base-content mb-2 text-sm font-medium whitespace-nowrap">{title}</div>
    )}
    {children}
  </div>
)

interface TooltipItemProps {
  color?: string
  label: string
  value: string | number
}

export const TooltipItem: React.FC<TooltipItemProps> = ({ color, label, value }) => (
  <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
    {color && (
      <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
    )}
    <span className="text-base-content/90 truncate text-xs">
      {label}: {value}
    </span>
  </div>
)

interface StackTooltipData {
  slice: {
    index?: number
    stack: Array<{
      id: string
      color: string
      value: number
    }>
  }
}

interface SingleTooltipData {
  point: {
    id: string
    color: string
    value: number
    data: {
      x: string | number
      y: number
    }
  }
}

interface ChartStackTooltipProps extends StackTooltipData {
  getTitle?: (index?: number) => string
  formatValue?: (value: number) => string
  formatLabel?: (id: string) => string
}

interface ChartSingleTooltipProps extends SingleTooltipData {
  formatValue?: (value: number) => string
}

export const ChartStackTooltip: React.FC<ChartStackTooltipProps> = ({
  slice,
  getTitle,
  formatValue = (val) => `${val}h`,
  formatLabel = (id) => id,
}) => {
  if (!slice) return null

  const title = getTitle ? getTitle(slice.index) : `Item ${(slice.index || 0) + 1}`

  return (
    <TooltipContainer title={title}>
      <div className="space-y-1">
        {slice.stack &&
          slice.stack
            .filter((point) => point && point.value > 0)
            .map((point) => (
              <TooltipItem
                key={point.id}
                color={point.color}
                label={formatLabel(point.id)}
                value={formatValue(point.value)}
              />
            ))}
      </div>
    </TooltipContainer>
  )
}

export const ChartSingleTooltip: React.FC<ChartSingleTooltipProps> = ({
  point,
  formatValue = (val) => `${val}h`,
}) => {
  if (!point) return null

  return (
    <TooltipContainer>
      <TooltipItem
        color={point.color}
        label={point.data.x.toString()}
        value={formatValue(point.value)}
      />
    </TooltipContainer>
  )
}
