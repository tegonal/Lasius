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

import { describe, expect, it } from 'vitest'

import { getRegisterDefaults } from './register-form'

describe('getRegisterDefaults', () => {
  it('prefills the email and keeps the invitation and the return path', () => {
    expect(
      getRegisterDefaults({ email: 'a@example.test', invitationId: 'abc', returnTo: '/user/home' }),
    ).toEqual({
      confirmPassword: '',
      email: 'a@example.test',
      firstName: '',
      invitationId: 'abc',
      lastName: '',
      password: '',
      returnTo: '/user/home',
    })
  })

  it('omits an empty invitation and an empty return path', () => {
    const defaults = getRegisterDefaults({ email: '', invitationId: '', returnTo: '' })
    expect(defaults.invitationId).toBeUndefined()
    expect(defaults.returnTo).toBeUndefined()
  })
})
