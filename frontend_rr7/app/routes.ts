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

import {
  index,
  layout,
  prefix,
  route,
  type RouteConfig,
} from '@react-router/dev/routes'

export default [
  // Auth routes (public)
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),
  route('join/:invitationId', 'routes/join.$invitationId.tsx'),
  route('auth/error', 'routes/auth.error.tsx'),
  ...prefix('internal-oauth', [
    route('login', 'routes/internal-oauth.login.tsx'),
    route('register', 'routes/internal-oauth.register.tsx'),
  ]),
  ...prefix('oauth', [
    route(':provider/login', 'routes/oauth.$provider.login.tsx'),
    route('callback', 'routes/oauth.callback.tsx'),
  ]),

  // API resource routes
  ...prefix('api', [
    route('session-status', 'routes/api.session-status.tsx'),
    route('locales/:lang/:ns', 'routes/api.locales.$lang.$ns.ts'),
    route('help/:locale/:slug', 'routes/api.help.$locale.$slug.ts'),
    route('theme', 'routes/api.theme.ts'),
    route('calendar-bookings', 'routes/api.calendar-bookings.ts'),
    route('org-switch', 'routes/api.org-switch.ts'),
    route('proxy', 'routes/api.proxy.ts'),
    route('ws-ticket', 'routes/api.ws-ticket.ts'),
    route('locale', 'routes/api.locale.ts'),
    route('health', 'routes/api.health.ts'),
    route('export', 'routes/api.export.ts'),
  ]),

  // Authenticated app routes — requireUser redirects to /login if unauthenticated
  layout('routes/app-layout.tsx', [
    // / → /user/home (matches Next.js index redirect)
    index('routes/index-redirect.ts'),

    ...prefix('user', [
      layout('routes/user.layout.tsx', [
        route('home', 'routes/user.layout._index.tsx'),
        ...prefix('dashboard', [
          layout('routes/user.dashboard.tsx', [
            index('routes/user.dashboard._index.tsx'),
            route('day', 'routes/user.dashboard.day.tsx'),
            route('week', 'routes/user.dashboard.week.tsx'),
            route('month', 'routes/user.dashboard.month.tsx'),
            route('6months', 'routes/user.dashboard.6months.tsx'),
            route('year', 'routes/user.dashboard.year.tsx'),
          ]),
        ]),
        route('lists', 'routes/user.lists.tsx'),
        ...prefix('stats', [
          layout('routes/user.stats.tsx', [
            index('routes/user.stats._index.tsx'),
            route('projects', 'routes/user.stats.projects.tsx'),
            route('tags', 'routes/user.stats.tags.tsx'),
          ]),
        ]),
      ]),
      layout('routes/user.projects.tsx', [
        route('projects', 'routes/user.projects._index.tsx'),
      ]),
    ]),

    ...prefix('organisation', [
      layout('routes/organisation.layout.tsx', [
        route('current', 'routes/organisation.current.tsx'),
        route('integrations', 'routes/organisation.integrations.tsx'),
        route('lists', 'routes/organisation.lists.tsx'),
        route('projects', 'routes/organisation.projects._index.tsx'),
        ...prefix('stats', [
          layout('routes/organisation.stats.tsx', [
            index('routes/organisation.stats._index.tsx'),
            route('projects', 'routes/organisation.stats.projects.tsx'),
            route('users', 'routes/organisation.stats.users.tsx'),
            route('tags', 'routes/organisation.stats.tags.tsx'),
          ]),
        ]),
      ]),
    ]),

    ...prefix('settings', [
      layout('routes/settings.layout.tsx', [
        route('account', 'routes/settings.account.tsx'),
        route('account-security', 'routes/settings.account-security.tsx'),
        route('app', 'routes/settings.app.tsx'),
        route('working-hours', 'routes/settings.working-hours.tsx'),
      ]),
    ]),
  ]),
] satisfies RouteConfig
