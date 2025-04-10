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
 * Generated by orval v7.4.0 🍺
 * Do not edit manually.
 * Lasius API
 * Track your time
 * OpenAPI spec version: 1.1.0+38-bb6ecdec+20250320-1641
 */
import useSwr from 'swr';
import type { Key, SWRConfiguration } from 'swr';
import type {
  GetOrganisationBookingAggregatedStatsParams,
  GetOrganisationBookingListParams,
  ModelsBooking,
  ModelsBookingStats,
} from '..';
import { lasiusAxiosInstance } from '../../lasiusAxiosInstance';
import type { ErrorType } from '../../lasiusAxiosInstance';

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * @summary Get bookings for the selected organisation within the selected timeframe
 */
export const getOrganisationBookingList = (
  orgId: string,
  params: GetOrganisationBookingListParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsBooking[]>(
    {
      url: `/organisation-bookings/organisations/${orgId}/bookings/history`,
      method: 'GET',
      params,
    },
    options
  );
};

export const getGetOrganisationBookingListKey = (
  orgId: string,
  params: GetOrganisationBookingListParams
) =>
  [
    `/organisation-bookings/organisations/${orgId}/bookings/history`,
    ...(params ? [params] : []),
  ] as const;

export type GetOrganisationBookingListQueryResult = NonNullable<
  Awaited<ReturnType<typeof getOrganisationBookingList>>
>;
export type GetOrganisationBookingListQueryError = ErrorType<unknown>;

/**
 * @summary Get bookings for the selected organisation within the selected timeframe
 */
export const useGetOrganisationBookingList = <TError = ErrorType<unknown>>(
  orgId: string,
  params: GetOrganisationBookingListParams,
  options?: {
    swr?: SWRConfiguration<Awaited<ReturnType<typeof getOrganisationBookingList>>, TError> & {
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
    (() => (isEnabled ? getGetOrganisationBookingListKey(orgId, params) : null));
  const swrFn = () => getOrganisationBookingList(orgId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
/**
 * @summary Get aggregated statistics about bookings for the selected organisation within the selected timeframe
 */
export const getOrganisationBookingAggregatedStats = (
  orgId: string,
  params: GetOrganisationBookingAggregatedStatsParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsBookingStats[]>(
    {
      url: `/organisation-bookings/organisations/${orgId}/bookings/stats/aggregated`,
      method: 'GET',
      params,
    },
    options
  );
};

export const getGetOrganisationBookingAggregatedStatsKey = (
  orgId: string,
  params: GetOrganisationBookingAggregatedStatsParams
) =>
  [
    `/organisation-bookings/organisations/${orgId}/bookings/stats/aggregated`,
    ...(params ? [params] : []),
  ] as const;

export type GetOrganisationBookingAggregatedStatsQueryResult = NonNullable<
  Awaited<ReturnType<typeof getOrganisationBookingAggregatedStats>>
>;
export type GetOrganisationBookingAggregatedStatsQueryError = ErrorType<unknown>;

/**
 * @summary Get aggregated statistics about bookings for the selected organisation within the selected timeframe
 */
export const useGetOrganisationBookingAggregatedStats = <TError = ErrorType<unknown>>(
  orgId: string,
  params: GetOrganisationBookingAggregatedStatsParams,
  options?: {
    swr?: SWRConfiguration<
      Awaited<ReturnType<typeof getOrganisationBookingAggregatedStats>>,
      TError
    > & { swrKey?: Key; enabled?: boolean };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!orgId;
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetOrganisationBookingAggregatedStatsKey(orgId, params) : null));
  const swrFn = () => getOrganisationBookingAggregatedStats(orgId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
