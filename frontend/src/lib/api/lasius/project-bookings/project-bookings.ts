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
 * OpenAPI spec version: 1.0.5+2-029f03c9+20240305-0929
 */
import useSwr from 'swr';
import type { Key, SWRConfiguration } from 'swr';
import type { GetAggregatedStatisticsByProjectParams } from '../getAggregatedStatisticsByProjectParams';
import type { GetProjectBookingListParams } from '../getProjectBookingListParams';
import type { ModelsBooking } from '../modelsBooking';
import type { ModelsBookingStats } from '../modelsBookingStats';
import { lasiusAxiosInstance } from '../../lasiusAxiosInstance';
import type { ErrorType } from '../../lasiusAxiosInstance';

// eslint-disable-next-line
  type SecondParameter<T extends (...args: any) => any> = T extends (
  config: any,
  args: infer P
) => any
  ? P
  : never;

/**
 * @summary Get statistics about bookings for the selected project within the selected timeframe
 */
export const getProjectBookingList = (
  orgId: string,
  projectId: string,
  params: GetProjectBookingListParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsBooking[]>(
    {
      url: `/organisations/${orgId}/projects/${projectId}/bookings/history`,
      method: 'GET',
      params,
    },
    options
  );
};

export const getGetProjectBookingListKey = (
  orgId: string,
  projectId: string,
  params: GetProjectBookingListParams
) =>
  [
    `/organisations/${orgId}/projects/${projectId}/bookings/history`,
    ...(params ? [params] : []),
  ] as const;

export type GetProjectBookingListQueryResult = NonNullable<
  Awaited<ReturnType<typeof getProjectBookingList>>
>;
export type GetProjectBookingListQueryError = ErrorType<unknown>;

/**
 * @summary Get statistics about bookings for the selected project within the selected timeframe
 */
export const useGetProjectBookingList = <TError = ErrorType<unknown>>(
  orgId: string,
  projectId: string,
  params: GetProjectBookingListParams,
  options?: {
    swr?: SWRConfiguration<Awaited<ReturnType<typeof getProjectBookingList>>, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!(orgId && projectId);
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetProjectBookingListKey(orgId, projectId, params) : null));
  const swrFn = () => getProjectBookingList(orgId, projectId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};

export const getAggregatedStatisticsByProject = (
  orgId: string,
  projectId: string,
  params: GetAggregatedStatisticsByProjectParams,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsBookingStats[]>(
    {
      url: `/organisations/${orgId}/projects/${projectId}/bookings/stats/aggregated`,
      method: 'GET',
      params,
    },
    options
  );
};

export const getGetAggregatedStatisticsByProjectKey = (
  orgId: string,
  projectId: string,
  params: GetAggregatedStatisticsByProjectParams
) =>
  [
    `/organisations/${orgId}/projects/${projectId}/bookings/stats/aggregated`,
    ...(params ? [params] : []),
  ] as const;

export type GetAggregatedStatisticsByProjectQueryResult = NonNullable<
  Awaited<ReturnType<typeof getAggregatedStatisticsByProject>>
>;
export type GetAggregatedStatisticsByProjectQueryError = ErrorType<unknown>;

export const useGetAggregatedStatisticsByProject = <TError = ErrorType<unknown>>(
  orgId: string,
  projectId: string,
  params: GetAggregatedStatisticsByProjectParams,
  options?: {
    swr?: SWRConfiguration<Awaited<ReturnType<typeof getAggregatedStatisticsByProject>>, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!(orgId && projectId);
  const swrKey =
    swrOptions?.swrKey ??
    (() => (isEnabled ? getGetAggregatedStatisticsByProjectKey(orgId, projectId, params) : null));
  const swrFn = () => getAggregatedStatisticsByProject(orgId, projectId, params, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
