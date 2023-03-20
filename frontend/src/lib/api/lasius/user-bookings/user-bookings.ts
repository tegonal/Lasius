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
 * Generated by orval v6.12.0 🍺
 * Do not edit manually.
 * Lasius API
 * Track your time
 * OpenAPI spec version: 0.0.1beta1+1-02a49bcf+20230307-0901
 */
import useSwr from 'swr';
import type { SWRConfiguration, Key } from 'swr';
import type {
  ModelsStartBookingRequest,
  ModelsStopBookingRequest,
  ModelsBookingChangeStartRequest,
  ModelsEditBookingRequest,
  ModelsAddBookingRequest,
  ModelsBooking,
  GetUserBookingListByOrganisationParams,
  ModelsBookingStats,
  GetUserBookingAggregatedStatsByOrganisationParams,
  ModelsCurrentUserTimeBooking,
  ModelsCurrentOrganisationTimeBookings,
  GetUserBookingLatestListByOrganisationParams,
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
 * @summary Start booking time on selected organisation for the current user
 */
export const startUserBookingCurrent = (
  orgId: string,
  modelsStartBookingRequest: BodyType<ModelsStartBookingRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    {
      url: `/user-bookings/organisations/${orgId}/bookings/start`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsStartBookingRequest,
    },
    options
  );
};

/**
 * @summary Stop the currently running booking by organisation and booking id for the current user
 */
export const stopUserBookingCurrent = (
  orgId: string,
  bookingId: string,
  modelsStopBookingRequest: BodyType<ModelsStopBookingRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    {
      url: `/user-bookings/organisations/${orgId}/bookings/${bookingId}/stop`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsStopBookingRequest,
    },
    options
  );
};

/**
 * @summary Change the currently running booking by organisation and booking id for the current user
 */
export const updateUserBookingCurrent = (
  orgId: string,
  bookingId: string,
  modelsBookingChangeStartRequest: BodyType<ModelsBookingChangeStartRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    {
      url: `/user-bookings/organisations/${orgId}/bookings/${bookingId}/start-time`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsBookingChangeStartRequest,
    },
    options
  );
};

/**
 * @summary Change a booking by organisation for the current user
 */
export const updateUserBooking = (
  orgId: string,
  bookingId: string,
  modelsEditBookingRequest: BodyType<ModelsEditBookingRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    {
      url: `/user-bookings/organisations/${orgId}/bookings/${bookingId}`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsEditBookingRequest,
    },
    options
  );
};

/**
 * @summary Remove a booking by organisation and booking id for the current user
 */
export const deleteUserBooking = (
  orgId: string,
  bookingId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    { url: `/user-bookings/organisations/${orgId}/bookings/${bookingId}`, method: 'delete' },
    options
  );
};

/**
 * @summary Create a booking by organisation for the current user
 */
export const addUserBookingByOrganisation = (
  orgId: string,
  modelsAddBookingRequest: BodyType<ModelsAddBookingRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    {
      url: `/user-bookings/organisations/${orgId}/bookings`,
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: modelsAddBookingRequest,
    },
    options
  );
};

/**
 * @summary Get current user's booking history for selected organisation
 */
export const getUserBookingListByOrganisation = (
  orgId: string,
  params: GetUserBookingListByOrganisationParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsBooking[]>(
    { url: `/user-bookings/organisations/${orgId}/bookings/history`, method: 'get', params },
    options
  );
};

export const getGetUserBookingListByOrganisationKey = (
  orgId: string,
  params: GetUserBookingListByOrganisationParams
) => [`/user-bookings/organisations/${orgId}/bookings/history`, ...(params ? [params] : [])];

export type GetUserBookingListByOrganisationQueryResult = NonNullable<
  Awaited<ReturnType<typeof getUserBookingListByOrganisation>>
>;
export type GetUserBookingListByOrganisationQueryError = ErrorType<unknown>;

export const useGetUserBookingListByOrganisation = <TError = ErrorType<unknown>>(
  orgId: string,
  params: GetUserBookingListByOrganisationParams,
  options?: {
    swr?: SWRConfiguration<Awaited<ReturnType<typeof getUserBookingListByOrganisation>>, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!orgId;
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetUserBookingListByOrganisationKey(orgId, params) : null));
  const swrFn = () => getUserBookingListByOrganisation(orgId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

/**
 * @summary Get aggregated stats for current user in selected organisation
 */
export const getUserBookingAggregatedStatsByOrganisation = (
  orgId: string,
  params: GetUserBookingAggregatedStatsByOrganisationParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsBookingStats[]>(
    {
      url: `/user-bookings/organisations/${orgId}/bookings/stats/aggregated`,
      method: 'get',
      params,
    },
    options
  );
};

export const getGetUserBookingAggregatedStatsByOrganisationKey = (
  orgId: string,
  params: GetUserBookingAggregatedStatsByOrganisationParams
) => [
  `/user-bookings/organisations/${orgId}/bookings/stats/aggregated`,
  ...(params ? [params] : []),
];

export type GetUserBookingAggregatedStatsByOrganisationQueryResult = NonNullable<
  Awaited<ReturnType<typeof getUserBookingAggregatedStatsByOrganisation>>
>;
export type GetUserBookingAggregatedStatsByOrganisationQueryError = ErrorType<unknown>;

export const useGetUserBookingAggregatedStatsByOrganisation = <TError = ErrorType<unknown>>(
  orgId: string,
  params: GetUserBookingAggregatedStatsByOrganisationParams,
  options?: {
    swr?: SWRConfiguration<
      Awaited<ReturnType<typeof getUserBookingAggregatedStatsByOrganisation>>,
      TError
    > & { swrKey?: Key; enabled?: boolean };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!orgId;
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetUserBookingAggregatedStatsByOrganisationKey(orgId, params) : null));
  const swrFn = () => getUserBookingAggregatedStatsByOrganisation(orgId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

/**
 * @summary Get current user's currently running booking
 */
export const getUserBookingCurrent = (options?: SecondParameter<typeof lasiusAxiosInstance>) => {
  return lasiusAxiosInstance<ModelsCurrentUserTimeBooking>(
    { url: `/user-bookings/current`, method: 'get' },
    options
  );
};

export const getGetUserBookingCurrentKey = () => [`/user-bookings/current`];

export type GetUserBookingCurrentQueryResult = NonNullable<
  Awaited<ReturnType<typeof getUserBookingCurrent>>
>;
export type GetUserBookingCurrentQueryError = ErrorType<unknown>;

export const useGetUserBookingCurrent = <TError = ErrorType<unknown>>(options?: {
  swr?: SWRConfiguration<Awaited<ReturnType<typeof getUserBookingCurrent>>, TError> & {
    swrKey?: Key;
    enabled?: boolean;
  };
  request?: SecondParameter<typeof lasiusAxiosInstance>;
}) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false;
  const swrKey = swrOptions?.swrKey ?? (() => (isEnabled ? getGetUserBookingCurrentKey() : null));
  const swrFn = () => getUserBookingCurrent(requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

/**
 * @summary Get currently running bookings of members in selected organisation
 */
export const getUserBookingCurrentListByOrganisation = (
  orgId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsCurrentOrganisationTimeBookings>(
    { url: `/user-bookings/organisations/${orgId}/current`, method: 'get' },
    options
  );
};

export const getGetUserBookingCurrentListByOrganisationKey = (orgId: string) => [
  `/user-bookings/organisations/${orgId}/current`,
];

export type GetUserBookingCurrentListByOrganisationQueryResult = NonNullable<
  Awaited<ReturnType<typeof getUserBookingCurrentListByOrganisation>>
>;
export type GetUserBookingCurrentListByOrganisationQueryError = ErrorType<unknown>;

export const useGetUserBookingCurrentListByOrganisation = <TError = ErrorType<unknown>>(
  orgId: string,
  options?: {
    swr?: SWRConfiguration<
      Awaited<ReturnType<typeof getUserBookingCurrentListByOrganisation>>,
      TError
    > & { swrKey?: Key; enabled?: boolean };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!orgId;
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetUserBookingCurrentListByOrganisationKey(orgId) : null));
  const swrFn = () => getUserBookingCurrentListByOrganisation(orgId, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

/**
 * @summary Get latest bookings of members in selected organisation
 */
export const getUserBookingLatestListByOrganisation = (
  orgId: string,
  params?: GetUserBookingLatestListByOrganisationParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    { url: `/user-bookings/organisations/${orgId}/latest`, method: 'get', params },
    options
  );
};

export const getGetUserBookingLatestListByOrganisationKey = (
  orgId: string,
  params?: GetUserBookingLatestListByOrganisationParams
) => [`/user-bookings/organisations/${orgId}/latest`, ...(params ? [params] : [])];

export type GetUserBookingLatestListByOrganisationQueryResult = NonNullable<
  Awaited<ReturnType<typeof getUserBookingLatestListByOrganisation>>
>;
export type GetUserBookingLatestListByOrganisationQueryError = ErrorType<unknown>;

export const useGetUserBookingLatestListByOrganisation = <TError = ErrorType<unknown>>(
  orgId: string,
  params?: GetUserBookingLatestListByOrganisationParams,
  options?: {
    swr?: SWRConfiguration<
      Awaited<ReturnType<typeof getUserBookingLatestListByOrganisation>>,
      TError
    > & { swrKey?: Key; enabled?: boolean };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!orgId;
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetUserBookingLatestListByOrganisationKey(orgId, params) : null));
  const swrFn = () => getUserBookingLatestListByOrganisation(orgId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
