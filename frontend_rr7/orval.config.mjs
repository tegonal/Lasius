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

import { fetcherClientBuilder } from './app/services/api/orval-fetcher-client.mjs'

const input = {
	target: 'http://localhost:9000/backend/assets/swagger.json',
}

export default {
	lasius: {
		input,
		output: {
			client: 'fetch',
			mock: false,
			mode: 'tags-split',
			override: {
				mutator: {
					name: 'lasiusFetch',
					path: './app/services/api/lasius-fetch-instance.ts',
				},
			},
			schemas: './app/services/api/lasius/',
			target: './app/services/api/lasius/',
		},
	},
	lasiusHooks: {
		input,
		output: {
			client: fetcherClientBuilder,
			mock: false,
			mode: 'tags-split',
			schemas: './app/services/api/lasius/',
			target: './app/services/api/lasius-hooks/',
		},
	},
}
