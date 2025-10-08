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

export const nivoTheme = {
  background: 'transparent',
  textColor: 'var(--color-base-content)',
  fontSize: 14, // text-sm equivalent
  axis: {
    domain: {
      line: {
        stroke: 'var(--color-base-content)',
        strokeWidth: 1,
        strokeOpacity: 0.3,
      },
    },
    legend: {
      text: {
        fontSize: 14, // text-sm equivalent
        fill: 'var(--color-base-content)',
        fillOpacity: 0.9,
        fontWeight: 500,
      },
    },
    ticks: {
      line: {
        stroke: 'var(--color-base-content)',
        strokeWidth: 1,
        strokeOpacity: 0.2,
      },
      text: {
        fontSize: 14, // text-sm equivalent
        fill: 'var(--color-base-content)',
        fillOpacity: 0.8,
      },
    },
  },
  grid: {
    line: {
      stroke: 'var(--color-base-content)',
      strokeWidth: 1,
      strokeOpacity: 0.1,
    },
  },
  legends: {
    title: {
      text: {
        fontSize: 14, // text-sm equivalent
        fill: 'var(--color-base-content)',
        fillOpacity: 0.8,
      },
    },
    text: {
      fontSize: 14, // text-sm equivalent
      fill: 'var(--color-base-content)',
      fillOpacity: 0.8,
    },
    ticks: {
      line: {},
      text: {
        fontSize: 14, // text-sm equivalent
        fill: 'var(--color-base-content)',
        fillOpacity: 0.7,
      },
    },
  },
  annotations: {
    text: {
      fontSize: 14, // text-sm equivalent
      fill: 'var(--color-base-content)',
      outlineWidth: 2,
      outlineColor: 'var(--color-base-100)',
      outlineOpacity: 1,
    },
    link: {
      stroke: 'var(--color-base-content)',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: 'var(--color-base-100)',
      outlineOpacity: 1,
    },
    outline: {
      stroke: 'var(--color-base-content)',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: 'var(--color-base-100)',
      outlineOpacity: 1,
    },
    symbol: {
      fill: 'var(--color-base-content)',
      outlineWidth: 2,
      outlineColor: 'var(--color-base-100)',
      outlineOpacity: 1,
    },
  },
  tooltip: {
    container: {
      background: 'var(--color-base-200)',
      color: 'var(--color-base-content)',
      fontSize: 14, // text-sm equivalent
      borderRadius: 'var(--rounded-box, 0.5rem)',
      padding: '8px 12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      border: '1px solid var(--color-base-content)',
      borderOpacity: 0.1,
    },
    basic: {},
    chip: {},
    table: {},
    tableCell: {},
    tableCellValue: {},
  },
}
