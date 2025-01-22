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
 * OpenAPI spec version: 1.0.10+22-55ea4c04+20250122-1556
 */
import useSwr from 'swr';
import type { Arguments, Key, SWRConfiguration } from 'swr';
import useSWRMutation from 'swr/mutation';
import type { SWRMutationConfiguration } from 'swr/mutation';
import type { ModelsAcceptInvitationRequest, ModelsInvitation } from '..';
import { lasiusAxiosInstance } from '../../lasiusAxiosInstance';
import type { ErrorType, BodyType } from '../../lasiusAxiosInstance';

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * @summary get detail of an invitation
 */
export const getInvitation = (
  invitationId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsInvitation>(
    { url: `/invitations/${invitationId}`, method: 'GET' },
    options
  );
};

export const getGetInvitationKey = (invitationId: string) =>
  [`/invitations/${invitationId}`] as const;

export type GetInvitationQueryResult = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;
export type GetInvitationQueryError = ErrorType<void>;

/**
 * @summary get detail of an invitation
 */
export const useGetInvitation = <TError = ErrorType<void>>(
  invitationId: string,
  options?: {
    swr?: SWRConfiguration<Awaited<ReturnType<typeof getInvitation>>, TError> & {
      swrKey?: Key;
      enabled?: boolean;
    };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const isEnabled = swrOptions?.enabled !== false && !!invitationId;
  const swrKey =
    swrOptions?.swrKey ?? (() => (isEnabled ? getGetInvitationKey(invitationId) : null));
  const swrFn = () => getInvitation(invitationId, requestOptions);

  const query = useSwr<Awaited<ReturnType<typeof swrFn>>, TError>(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
export const acceptInvitation = (
  invitationId: string,
  modelsAcceptInvitationRequest: BodyType<ModelsAcceptInvitationRequest>,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsInvitation>(
    {
      url: `/invitations/${invitationId}/accept`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: modelsAcceptInvitationRequest,
    },
    options
  );
};

export const getAcceptInvitationMutationFetcher = (
  invitationId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return (_: Key, { arg }: { arg: ModelsAcceptInvitationRequest }): Promise<ModelsInvitation> => {
    return acceptInvitation(invitationId, arg, options);
  };
};
export const getAcceptInvitationMutationKey = (invitationId: string) =>
  [`/invitations/${invitationId}/accept`] as const;

export type AcceptInvitationMutationResult = NonNullable<
  Awaited<ReturnType<typeof acceptInvitation>>
>;
export type AcceptInvitationMutationError = ErrorType<unknown>;

export const useAcceptInvitation = <TError = ErrorType<unknown>>(
  invitationId: string,
  options?: {
    swr?: SWRMutationConfiguration<
      Awaited<ReturnType<typeof acceptInvitation>>,
      TError,
      Key,
      ModelsAcceptInvitationRequest,
      Awaited<ReturnType<typeof acceptInvitation>>
    > & { swrKey?: string };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const swrKey = swrOptions?.swrKey ?? getAcceptInvitationMutationKey(invitationId);
  const swrFn = getAcceptInvitationMutationFetcher(invitationId, requestOptions);

  const query = useSWRMutation(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
export const declineInvitation = (
  invitationId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return lasiusAxiosInstance<ModelsInvitation>(
    { url: `/invitations/${invitationId}/decline`, method: 'POST' },
    options
  );
};

export const getDeclineInvitationMutationFetcher = (
  invitationId: string,
  options?: SecondParameter<typeof lasiusAxiosInstance>
) => {
  return (_: Key, __: { arg: Arguments }): Promise<ModelsInvitation> => {
    return declineInvitation(invitationId, options);
  };
};
export const getDeclineInvitationMutationKey = (invitationId: string) =>
  [`/invitations/${invitationId}/decline`] as const;

export type DeclineInvitationMutationResult = NonNullable<
  Awaited<ReturnType<typeof declineInvitation>>
>;
export type DeclineInvitationMutationError = ErrorType<unknown>;

export const useDeclineInvitation = <TError = ErrorType<unknown>>(
  invitationId: string,
  options?: {
    swr?: SWRMutationConfiguration<
      Awaited<ReturnType<typeof declineInvitation>>,
      TError,
      Key,
      Arguments,
      Awaited<ReturnType<typeof declineInvitation>>
    > & { swrKey?: string };
    request?: SecondParameter<typeof lasiusAxiosInstance>;
  }
) => {
  const { swr: swrOptions, request: requestOptions } = options ?? {};

  const swrKey = swrOptions?.swrKey ?? getDeclineInvitationMutationKey(invitationId);
  const swrFn = getDeclineInvitationMutationFetcher(invitationId, requestOptions);

  const query = useSWRMutation(swrKey, swrFn, swrOptions);

  return {
    swrKey,
    ...query,
  };
};
