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

import { useMemo } from 'react'

// ─── Nivo Theme ──────────────────────────────────────────────────────────────
// Uses DaisyUI CSS variables for dark/light mode support

export const nivoTheme = {
	annotations: {
		link: {
			outlineColor: 'var(--color-base-100)',
			outlineOpacity: 1,
			outlineWidth: 2,
			stroke: 'var(--color-base-content)',
			strokeWidth: 1,
		},
		outline: {
			outlineColor: 'var(--color-base-100)',
			outlineOpacity: 1,
			outlineWidth: 2,
			stroke: 'var(--color-base-content)',
			strokeWidth: 2,
		},
		symbol: {
			fill: 'var(--color-base-content)',
			outlineColor: 'var(--color-base-100)',
			outlineOpacity: 1,
			outlineWidth: 2,
		},
		text: {
			fill: 'var(--color-base-content)',
			fontSize: 14, // text-sm equivalent
			outlineColor: 'var(--color-base-100)',
			outlineOpacity: 1,
			outlineWidth: 2,
		},
	},
	axis: {
		domain: {
			line: {
				stroke: 'var(--color-base-content)',
				strokeOpacity: 0.3,
				strokeWidth: 1,
			},
		},
		legend: {
			text: {
				fill: 'var(--color-base-content)',
				fillOpacity: 0.9,
				fontSize: 14, // text-sm equivalent
				fontWeight: 500,
			},
		},
		ticks: {
			line: {
				stroke: 'var(--color-base-content)',
				strokeOpacity: 0.2,
				strokeWidth: 1,
			},
			text: {
				fill: 'var(--color-base-content)',
				fillOpacity: 0.8,
				fontSize: 14, // text-sm equivalent
			},
		},
	},
	background: 'transparent',
	fontSize: 14, // text-sm equivalent
	grid: {
		line: {
			stroke: 'var(--color-base-content)',
			strokeOpacity: 0.1,
			strokeWidth: 1,
		},
	},
	legends: {
		text: {
			fill: 'var(--color-base-content)',
			fillOpacity: 0.8,
			fontSize: 14, // text-sm equivalent
		},
		ticks: {
			line: {},
			text: {
				fill: 'var(--color-base-content)',
				fillOpacity: 0.7,
				fontSize: 14, // text-sm equivalent
			},
		},
		title: {
			text: {
				fill: 'var(--color-base-content)',
				fillOpacity: 0.8,
				fontSize: 14, // text-sm equivalent
			},
		},
	},
	textColor: 'var(--color-base-content)',
	tooltip: {
		basic: {},
		chip: {},
		container: {
			background: 'var(--color-base-200)',
			border: '1px solid var(--color-base-content)',
			borderOpacity: 0.1,
			borderRadius: 'var(--rounded-box, 0.5rem)',
			boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
			color: 'var(--color-base-content)',
			fontSize: 14, // text-sm equivalent
			padding: '8px 12px',
		},
		table: {},
		tableCell: {},
		tableCellValue: {},
	},
}

// ─── Color Palettes ──────────────────────────────────────────────────────────

const nivoPaletteDark = [
	'#262626',
	'#008586',
	'#00b2b3',
	'#ee3291',
	'#6f00df',
	'#006fed',
	'#a51aff',
	'#df0000',
	'#df6f00',
	'#ff8205',
	'#4f8c27',
	'#107bdb',
	'#55b32c',
	'#b30000',
	'#20859b',
	'#b2296d',
	'#cb3112',
	'#a17cb7',
	'#d77a6f',
	'#c37d9f',
	'#00b300',
	'#ff1a1a',
	'#ce661c',
	'#4c7f7f',
	'#d70000',
	'#7fa046',
	'#6a5db8',
	'#ce9c1e',
	'#b86fdc',
	'#d700d7',
	'#ff981a',
	'#00b7b8',
]

const nivoPalette = [
	'#4d4d4d',
	'#00d2d2',
	'#00ffff',
	'#f479b7',
	'#952cff',
	'#3a96ff',
	'#c366ff',
	'#ff2c2c',
	'#ff952c',
	'#ffa952',
	'#71c837',
	'#47a0f1',
	'#7dd656',
	'#ff0000',
	'#33b8d5',
	'#d75193',
	'#ed5a3d',
	'#c5aed2',
	'#e8b2ab',
	'#dbb1c6',
	'#00ff00',
	'#ff6666',
	'#e78f50',
	'#6ea9a9',
	'#ff2525',
	'#a4c172',
	'#9b92cf',
	'#e6bc52',
	'#d6aceb',
	'#ff25ff',
	'#ffba66',
	'#05ffff',
]

// ─── Consistent Color Helper ─────────────────────────────────────────────────

/**
 * Get a consistent color from the palette based on a string key.
 * Same key will always return the same color.
 */
export function getConsistentColor(key: string, isDark: boolean): string {
	const palette = isDark ? nivoPaletteDark : nivoPalette
	const hash = hashString(key)
	const index = hash % palette.length

	return palette[index]!
}

/**
 * Hook to get the Nivo color function that responds to theme changes.
 * Reads the current data-theme attribute from the document element.
 * Returns a memoized function that stays stable across renders.
 */
export function useNivoColors() {
	// Read theme from the data-theme attribute set on <html>
	const isDark =
		typeof document !== 'undefined'
			? document.documentElement.getAttribute('data-theme') === 'dark'
			: false

	// Memoize the function so it only changes when theme changes
	return useMemo(
		() =>
			(datum: { id: number | string }): string => {
				return getConsistentColor(String(datum.id), isDark)
			},
		[isDark],
	)
}

/**
 * Hash a string to a number
 */
function hashString(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32bit integer
	}
	return Math.abs(hash)
}
