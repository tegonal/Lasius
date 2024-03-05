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
import type { ModelsTag } from '../modelsTag';
import type { ModelsUpdateUserOrganisation } from '../modelsUpdateUserOrganisation';
import type { ModelsUser } from '../modelsUser';
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
 * @summary Change current user's working hours for the selected organisation
 */
export const updateWorkingHoursByOrganisation = (
  orgId: string,
  modelsUpdateUserOrganisation: BodyType<ModelsUpdateUserOrganisation>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsUser>(
    {
      url: `/user-organisations/organisations/${orgId}/working-hours`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: modelsUpdateUserOrganisation,
    },
    options
  );
};

/**
 * @summary Remove current user's membership from selected organisation
 */
export const deleteUserMembershipByOrganisation = (
  orgId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<void>(
    { url: `/user-organisations/organisations/${orgId}/leave`, method: 'DELETE' },
    options
  );
};

/**
 * @summary Get tags by organisation and project
 */
export const getTagsByProject = (
  orgId: string,
  projectId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsTag[]>(
    { url: `/user-organisations/organisations/${orgId}/projects/${projectId}/tags`, method: 'GET' },
    options
  );
};

export const getGetTagsByProjectKey = (orgId: string, projectId: string) =>
  [`/user-organisations/organisations/${orgId}/projects/${projectId}/tags`] as const;

export type GetTagsByProjectQueryResult = NonNullable<Awaited<ReturnType<typeof getTagsByProject>>>;
export type GetTagsByProjectQueryError = ErrorType<unknown>;

/**
 * @summary Get tags by organisation and project
 */
export const useGetTagsByProject = <TError = ErrorType<unknown>>(
  orgId: string,
  projectId: string,
  options?: {
    swr?: SWRConfiguration<Awaited<ReturnType<typeof getTagsByProject>>, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!(orgId && projectId);
  const swrKey =
    swrOptions?.swrKey ?? (() => (isEnabled ? getGetTagsByProjectKey(orgId, projectId) : null));
  const swrFn = () => getTagsByProject(orgId, projectId, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
