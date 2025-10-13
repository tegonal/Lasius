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

import 'react-i18next';

import en from '../public/locales/en/common.json';
import integrations from '../public/locales/en/integrations.json';

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module 'console' {
  export = typeof import('console');
}

declare module 'i18next' {
  interface CustomTypeOptions {
    // custom namespace type if you changed it
    defaultNS: 'common';
    // custom resources type
    resources: {
      common: typeof en;
      integrations: typeof integrations;
    };
  }
}

// Declare runtime environment variables on window object
declare global {
  interface Window {
    ENV?: {
      LASIUS_API_URL: string;
      LASIUS_API_WEBSOCKET_URL: string;
      LASIUS_PUBLIC_URL: string;
      LASIUS_TELEMETRY_PLAUSIBLE_HOST: string;
      LASIUS_TELEMETRY_PLAUSIBLE_SOURCE_DOMAIN: string;
      LASIUS_DEMO_MODE: string;
      LASIUS_TERMSOFSERVICE_VERSION: string;
      LASIUS_VERSION: string;
      ENVIRONMENT: string;
    };
  }
}

