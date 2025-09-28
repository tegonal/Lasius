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

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance based on WCAG formula
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Determine if text should be white or black for optimal contrast
 * @param backgroundColor - The background color in hex format
 * @returns '#ffffff' for dark backgrounds, '#000000' for light backgrounds
 */
export function getContrastTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return '#000000' // Default to black if parsing fails

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)

  // Use white text for dark backgrounds (luminance < 0.5)
  // Use black text for light backgrounds (luminance >= 0.5)
  return luminance < 0.5 ? '#ffffff' : '#000000'
}

/**
 * Nivo chart label text color function
 * Returns a function that determines text color based on the bar/arc color
 */
export const getContrastLabelTextColor = (datum: any) => {
  // For Nivo charts, the color is typically available in datum.color
  if (datum.color) {
    return getContrastTextColor(datum.color)
  }
  // Default to white if we can't determine the color
  return '#ffffff'
}
