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
 * Generated by orval v6.23.0 🍺
 * Do not edit manually.
 * Lasius API
 * Track your time
 * OpenAPI spec version: 1.0.6+10-d8bae9e1+20240827-1710
 */
import type { ControllersLoginForm } from '../controllersLoginForm';
import type { SignIn200 } from '../signIn200';
import { lasiusAxiosInstance } from '../../lasiusAxiosInstance';
import type { BodyType } from '../../lasiusAxiosInstance';

// eslint-disable-next-line
  type SecondParameter<T extends (...args: any) => any> = T extends (
  config: any,
  args: infer P
) => any
  ? P
  : never;

/**
 * @summary Log current user out
 */
export const signOut = (options?: SecondParameter<typeof lasiusAxiosInstance>) => {
  return lasiusAxiosInstance<void>({ url: `/signout`, method: 'POST' }, options);
};

/**
 * @summary Authenticate with user and password
 */
export const signIn = (
  controllersLoginForm: BodyType<ControllersLoginForm>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<SignIn200>(
    {
      url: `/signin`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: controllersLoginForm,
    },
    options
  );
};
