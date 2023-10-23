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
 * Generated by orval v6.19.0 🍺
 * Do not edit manually.
 * Lasius API
 * Track your time
 * OpenAPI spec version: 1.0.4+5-8ff3c82e+20231023-2026
 */
import useSwr from 'swr';
import type { Key, SWRConfiguration } from 'swr';
import type {
  ModelsPasswordChangeRequest,
  ModelsPersonalDataUpdate,
  ModelsUser,
  ModelsUserSettings,
} from '..';
import { lasiusAxiosInstance } from '../../lasiusAxiosInstance';
import type { ErrorType, BodyType } from '../../lasiusAxiosInstance';

// eslint-disable-next-line
  type SecondParameter<T extends (...args: any) => any> = T extends (
  config: any,
  args: infer P
) => any
  ? P
  : never;

/**
 * @summary Get current user's profile
 */
export const getUserProfile = (options?: SecondParameter<typeof lasiusAxiosInstance>) => {
  return lasiusAxiosInstance<ModelsUser>({ url: `/user/profile`, method: 'get' }, options);
};

export const getGetUserProfileKey = () => [`/user/profile`] as const;

export type GetUserProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;
export type GetUserProfileQueryError = ErrorType<unknown>;

/**
 * @summary Get current user's profile
 */
export const useGetUserProfile = <TError = ErrorType<unknown>>(options?: {
  swr?: SWRConfiguration<Awaited<ReturnType<typeof getUserProfile>>, TError> & {
    swrKey?: Key;
    enabled?: boolean;
  };
  request?: SecondParameter<typeof lasiusAxiosInstance>;
}) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false;
  const swrKey = swrOptions?.swrKey ?? (() => (isEnabled ? getGetUserProfileKey() : null));
  const swrFn = () => getUserProfile(requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

/**
 * @summary Change current user's profile
 */
export const updateUserProfile = (
  modelsPersonalDataUpdate: BodyType<ModelsPersonalDataUpdate>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsUser>(
    {
      url: `/user/profile`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsPersonalDataUpdate,
    },
    options
  );
};

/**
 * @summary Change current user's settings
 */
export const updateUserSettings = (
  modelsUserSettings: BodyType<ModelsUserSettings>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsUser>(
    {
      url: `/user/profile/settings`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsUserSettings,
    },
    options
  );
};

/**
 * @summary Change current user's password
 */
export const updateUserPassword = (
  modelsPasswordChangeRequest: BodyType<ModelsPasswordChangeRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    {
      url: `/user/update-password`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsPasswordChangeRequest,
    },
    options
  );
};
