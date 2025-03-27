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

import { updateUserSettings, useGetUserProfile, acceptUserTOS } from 'lib/api/lasius/user/user';
import { ModelsUserSettings, ModelsAcceptTOSRequest } from 'lib/api/lasius';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const useProfile = () => {
  const session = useSession();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(session.data?.access_token !== undefined);
  }, [session.data?.access_token]);

  const { data, mutate } = useGetUserProfile({
    swr: {
      enabled: enabled,
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
    },
  });

  const updateSettings = async (updateData: Partial<ModelsUserSettings>) => {
    if (data) {
      const modifiedSettings: ModelsUserSettings = { ...data.settings, ...updateData };
      const profile = await updateUserSettings(modifiedSettings);
      await mutate(profile);
    }
  };

  const acceptTOS = async (currentTOSVersion: string) => {
    if (data) {
      const acceptTOSRequest: ModelsAcceptTOSRequest = { version: currentTOSVersion };
      const profile = await acceptUserTOS(acceptTOSRequest);
      await mutate(profile);
    }
  };

  return {
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    email: data?.email || '',
    role: data?.role || '',
    profile: data,
    userId: data?.id || '',
    lasiusIsLoggedIn: !!data,
    updateSettings,
    acceptedTOSVersion: data?.acceptedTOS?.version || '',
    acceptTOS,
  };
};
