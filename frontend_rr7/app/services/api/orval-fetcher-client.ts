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
 * Custom Orval client builder that generates useFetcher-based hooks.
 *
 * Each endpoint produces a `useXxx()` hook that wraps `useApiProxy`.
 * These hooks submit typed JSON payloads to `/api/proxy` via useFetcher.
 *
 * Usage in orval.config.mjs:
 *   import { fetcherClientBuilder } from './app/services/api/orval-fetcher-client.ts'
 *   output: { client: fetcherClientBuilder, ... }
 */

// Endpoints without security in the OpenAPI spec
const PUBLIC_ENDPOINTS = new Set([
  '/config',
  '/csrf-token',
  '/oauth2/login',
  '/oauth2/logout',
])

/**
 * Detect if a route template matches a public endpoint.
 * Route templates use ${paramName} interpolation.
 */
function isPublicRoute(route: string): boolean {
  const staticRoute = route.replaceAll(/\$\{[^}]+\}/g, '*')
  return PUBLIC_ENDPOINTS.has(staticRoute)
}

// These match @orval/core GetterPropType values
const PROP_TYPE = {
  BODY: 4,
  HEADER: 5,
  NAMED_PATH_PARAMS: 1,
  PARAM: 0,
  QUERY_PARAM: 2,
} as const

type GeneratorOptions = {
  context: { output: Record<string, unknown> }
  route: string
}

type Import = {
  name: string
  values?: boolean
}

type Prop = {
  definition: string
  destructured?: string
  implementation: string
  name: string
  type: number
}

type VerbOptions = {
  body: undefined | { definition: string; implementation: string }
  deprecated?: string
  operationName: string
  override: Record<string, unknown>
  params: Array<{ definition: string; name: string }>
  props: Prop[]
  queryParams?: { schema: { name: string } }
  response: { definition: { success: string } }
  summary?: string
  verb: string
}

function generateFetcherHeader(): string {
  return "import { type ApiProxyOptions, useApiProxy } from '~/hooks/use-api-proxy'\n"
}

function generateFetcherHook(
  verbOptions: VerbOptions,
  options: GeneratorOptions,
): { implementation: string; imports: Import[] } {
  const { body, operationName, props, queryParams, response, verb } =
    verbOptions
  const { route } = options

  const hookName = `use${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}`
  const responseType = response.definition.success || `${operationName}Response`

  // Collect path params
  const pathParams = props.filter(
    (p) => p.type === PROP_TYPE.PARAM || p.type === PROP_TYPE.NAMED_PATH_PARAMS,
  )

  // Build TParams type fields
  const paramFields: string[] = []
  for (const p of pathParams) {
    paramFields.push(`${p.name}: ${p.definition}`)
  }
  if (queryParams) {
    paramFields.push(`params?: ${queryParams.schema.name}`)
  }

  // Build type arguments for useApiProxy<TResponse, TBody, TParams>
  const typeArgs: string[] = [responseType]
  if (body) {
    typeArgs.push(body.definition)
  } else {
    typeArgs.push('undefined')
  }
  if (paramFields.length > 0) {
    typeArgs.push(`{ ${paramFields.join('; ')} }`)
  }

  // Remove trailing 'undefined' type args
  while (typeArgs.length > 1 && typeArgs.at(-1) === 'undefined') {
    typeArgs.pop()
  }

  const typeArgsStr = typeArgs.join(', ')

  // Build getUrl parameter destructure
  const urlParamNames = [
    ...pathParams.map((p) => p.name),
    ...(queryParams ? ['params'] : []),
  ]
  const paramDestructure =
    urlParamNames.length > 0 ? `{ ${urlParamNames.join(', ')} }` : ''

  // Build URL expression
  let urlExpr: string
  if (queryParams) {
    // Use the generated URL builder for query param serialization
    const urlBuilderName = `get${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}Url`
    const urlBuilderArgs = [...pathParams.map((p) => p.name), 'params'].join(
      ', ',
    )
    urlExpr = `${urlBuilderName}(${urlBuilderArgs})`
  } else {
    urlExpr = '`' + route + '`'
  }

  const isPublic = isPublicRoute(route)
  const skipAuthLine = isPublic ? '\n\t\tskipAuth: true,' : ''

  const implementation = `
export function ${hookName}(options?: ApiProxyOptions<${responseType}>) {
\treturn useApiProxy<${typeArgsStr}>({
\t\tgetUrl: (${paramDestructure}) => ${urlExpr},
\t\tmethod: '${verb.toUpperCase()}',${skipAuthLine}
\t}, options)
}
`

  // Collect imports for types used
  const imports: Import[] = []
  if (body) {
    imports.push({ name: body.definition })
  }
  imports.push({ name: responseType })
  if (queryParams) {
    imports.push({ name: queryParams.schema.name })
  }

  return { implementation: implementation.trim(), imports }
}

function getFetcherDependencies() {
  return [
    {
      dependency: 'react-router',
      exports: [{ name: 'useFetcher', values: true }],
    },
  ]
}

const fetcherClientBuilder = () => () => ({
  client: generateFetcherHook,
  dependencies: getFetcherDependencies,
  header: generateFetcherHeader,
})

export { fetcherClientBuilder }
export default fetcherClientBuilder
