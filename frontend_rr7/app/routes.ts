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

import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  // Home / health check
  index('routes/home.tsx'),

  // Auth routes (no lang prefix — OAuth redirects are language-independent)
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('internal-oauth/login', 'routes/internal-oauth.login.tsx'),
  route('oauth/:provider/login', 'routes/oauth.$provider.login.tsx'),
  route('oauth/callback', 'routes/oauth.callback.tsx'),

  // Language-prefixed app routes (added in later tasks)
  // ...prefix(':lang', [
  //   layout('routes/app-layout.tsx', [
  //     index('routes/dashboard.tsx'),
  //   ]),
  // ]),
] satisfies RouteConfig
