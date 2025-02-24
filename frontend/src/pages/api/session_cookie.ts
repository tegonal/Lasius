'use server';
import { serialize } from 'cookie';
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

import { NextApiRequest, NextApiResponse } from 'next';
import { decode, encode } from 'next-auth/jwt';
import { getSession } from 'next-auth/react';

export type NextApiHealthResponse = {
  status: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const session = await getSession({ req });

  if (!session?.user) {
    res.status(401).json({});
    return;
  }

  const sessionCookie = 'lasius-session';

  const currentCookie = await decode({
    secret: process.env.NEXTAUTH_SECRET || '',
    token: req.cookies[sessionCookie],
  });

  const newSessionCookie = await encode({
    secret: process.env.NEXTAUTH_SECRET || '',
    token: {
      ...currentCookie,
      user: session.user,
      access_token: session.user?.access_token,
    },
  });

  // update session token with new access token
  const cookie = serialize(sessionCookie, newSessionCookie, {
    httpOnly: true,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
  res.status(200).json({ message: 'Successfully updated session cookie!' });
};

export default handler;
