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
 * Generated by orval v7.9.0 🍺
 * Do not edit manually.
 * Lasius API
 * Track your time
 * OpenAPI spec version: 2.0.0+4-3a603fde+20250602-1535
 */
import useSwr from 'swr';
import type { Arguments, Key, SWRConfiguration } from 'swr';

import useSWRMutation from 'swr/mutation';
import type { SWRMutationConfiguration } from 'swr/mutation';

import type { ModelsTag, ModelsUpdateUserOrganisation, ModelsUser } from '..';

import { lasiusAxiosInstance } from '../../lasiusAxiosInstance';
import type { ErrorType, BodyType } from '../../lasiusAxiosInstance';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

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

export const getUpdateWorkingHoursByOrganisationMutationFetcher = (
  orgId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return (_: Key, { arg }: { arg: ModelsUpdateUserOrganisation }): Promise<ModelsUser> => {
    return updateWorkingHoursByOrganisation(orgId, arg, options);
  };
};
export const getUpdateWorkingHoursByOrganisationMutationKey = (orgId: string) =>
  [`/user-organisations/organisations/${orgId}/working-hours`] as const;

export type UpdateWorkingHoursByOrganisationMutationResult = NonNullable<
  Awaited<ReturnType<typeof updateWorkingHoursByOrganisation>>
>;
export type UpdateWorkingHoursByOrganisationMutationError = ErrorType<unknown>;

/**
 * @summary Change current user's working hours for the selected organisation
 */
export const useUpdateWorkingHoursByOrganisation = <TError = ErrorType<unknown>>(
  orgId: string,
  options?: {
    swr?: SWRMutationConfiguration<
      Awaited<ReturnType<typeof updateWorkingHoursByOrganisation>>,
      TError,
      Key,
      ModelsUpdateUserOrganisation,
      Awaited<ReturnType<typeof updateWorkingHoursByOrganisation>>
    > & { swrKey?: string };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const swrKey = swrOptions?.swrKey ?? getUpdateWorkingHoursByOrganisationMutationKey(orgId);
  const swrFn = getUpdateWorkingHoursByOrganisationMutationFetcher(orgId, requestOptions);

  const query = useSWRMutation(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
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

export const getDeleteUserMembershipByOrganisationMutationFetcher = (
  orgId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return (_: Key, __: { arg: Arguments }): Promise<void> => {
    return deleteUserMembershipByOrganisation(orgId, options);
  };
};
export const getDeleteUserMembershipByOrganisationMutationKey = (orgId: string) =>
  [`/user-organisations/organisations/${orgId}/leave`] as const;

export type DeleteUserMembershipByOrganisationMutationResult = NonNullable<
  Awaited<ReturnType<typeof deleteUserMembershipByOrganisation>>
>;
export type DeleteUserMembershipByOrganisationMutationError = ErrorType<unknown>;

/**
 * @summary Remove current user's membership from selected organisation
 */
export const useDeleteUserMembershipByOrganisation = <TError = ErrorType<unknown>>(
  orgId: string,
  options?: {
    swr?: SWRMutationConfiguration<
      Awaited<ReturnType<typeof deleteUserMembershipByOrganisation>>,
      TError,
      Key,
      Arguments,
      Awaited<ReturnType<typeof deleteUserMembershipByOrganisation>>
    > & { swrKey?: string };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const swrKey = swrOptions?.swrKey ?? getDeleteUserMembershipByOrganisationMutationKey(orgId);
  const swrFn = getDeleteUserMembershipByOrganisationMutationFetcher(orgId, requestOptions);

  const query = useSWRMutation(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
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
