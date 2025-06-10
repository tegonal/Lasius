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

import { combinedColorPalette } from 'styles/theme/colors';
import { createHash } from 'crypto';

function generateNumericHash(input: string): number {
  const hash = createHash('sha256');
  hash.update(input);
  const hexHash = hash.digest('hex');

  // Convert hex hash to a numeric value
  return parseInt(hexHash.slice(0, 15), 16); // Limit to 15 digits
}

export const colorById: (item: { id?: string | number }) => string = ({ id }) => {
  // calculate hash of id
  const hash = generateNumericHash(id?.toString() || '');
  // partition hash by modula operation
  const index = hash % combinedColorPalette.length;
  const color = combinedColorPalette[index];
  return color;
};
