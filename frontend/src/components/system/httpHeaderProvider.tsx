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

import React, { useEffect } from 'react';
import axios from 'axios';
import { getCsrfToken } from 'lib/api/lasius/general/general';
import { signOut, useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { removeAccessibleCookies } from 'lib/removeAccessibleCookies';

type HttpHeaderProviderProps = {
  initialSession: Session;
};

export const HttpHeaderProvider: React.FC<HttpHeaderProviderProps> = ({ initialSession }) => {
  const { data: session } = useSession();

  const getCSRFToken = async () => {
    const response = await getCsrfToken();
    axios.defaults.headers.post['Csrf-token'] = response.value;
    axios.defaults.headers.put['Csrf-token'] = response.value;
    axios.defaults.headers.delete['Csrf-token'] = response.value;
  };

  useEffect(() => {
    getCSRFToken();
  }, []);

  // Set the token for client side requests to use
  useEffect(() => {
    console.error('session changed', session, initialSession);
    const token = session?.user?.access_token || initialSession?.user?.access_token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // workaround: update client session cookie as session cookie doesn't get updated with
      // refreshing a token through the jwt callback of next-auth
      fetch('/api/session_cookie').then((res) =>
        console.log('session changed. Updated session coookie', res)
      );
    } else {
      // legacy
      delete axios.defaults.headers.common['Authorization'];
    }
    if (session?.error && session?.user?.access_token) {
      console.error('Updating session failed', session.error);
      //removeAccessibleCookies();
      //signOut();
    }
  }, [initialSession?.user?.access_token, session?.user?.access_token, session?.error]);

  return null;
};
