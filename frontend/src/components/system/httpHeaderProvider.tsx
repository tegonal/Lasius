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
import { Session } from 'next-auth';
import { getCsrfToken } from 'lib/api/lasius/general/general';

type HttpHeaderProviderProps = {
  session: Session;
};

export const HttpHeaderProvider: React.FC<HttpHeaderProviderProps> = ({ session }) => {
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
    const token = session?.access_token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // legacy
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [session]);

  return null;
};
