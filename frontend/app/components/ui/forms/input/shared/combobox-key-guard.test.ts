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

import { describe, expect, it, vi } from 'vitest'

import { guardComboboxKey } from './combobox-key-guard'

const keyEvent = (key: string) => ({
  key,
  preventBaseUIHandler: vi.fn(),
  preventDefault: vi.fn(),
})

describe('guardComboboxKey', () => {
  it('blocks the form submit on Enter while the list is open', () => {
    const event = keyEvent('Enter')
    guardComboboxKey(event, true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(event.preventBaseUIHandler).not.toHaveBeenCalled()
  })

  it('lets Enter submit the form while the list is closed', () => {
    const event = keyEvent('Enter')
    guardComboboxKey(event, false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(event.preventBaseUIHandler).not.toHaveBeenCalled()
  })

  it('skips the Base UI Escape handler while the list is closed', () => {
    const event = keyEvent('Escape')
    guardComboboxKey(event, false)
    expect(event.preventBaseUIHandler).toHaveBeenCalledOnce()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('lets Base UI close an open list on Escape', () => {
    const event = keyEvent('Escape')
    guardComboboxKey(event, true)
    expect(event.preventBaseUIHandler).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('ignores other keys', () => {
    const event = keyEvent('ArrowDown')
    guardComboboxKey(event, true)
    expect(event.preventBaseUIHandler).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
