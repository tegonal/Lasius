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
 */

// Endpoints without security in the OpenAPI spec
const PUBLIC_ENDPOINTS = new Set([
  '/config',
  '/csrf-token',
  '/oauth2/login',
  '/oauth2/logout',
])

function isPublicRoute(route) {
  const staticRoute = route.replace(/\$\{[^}]+\}/g, '*')
  return PUBLIC_ENDPOINTS.has(staticRoute)
}

// Built-in TS types that should not be imported
const BUILTIN_TYPES = new Set([
  'any',
  'boolean',
  'never',
  'null',
  'number',
  'string',
  'undefined',
  'unknown',
  'void',
])

// Strip array suffix and generic wrappers to get the base type name for imports
function baseTypeName(type) {
  // eslint-disable-next-line sonarjs/slow-regex -- build-time code generator, no user input
  return type.replace(/\[\]$/, '').replace(/<[^>]*>$/, '')
}

function generateFetcherHeader() {
  return "import { type ApiProxyOptions, useApiProxy } from '~/hooks/use-api-proxy'\n"
}

function generateFetcherHook(verbOptions, options) {
  const { body, operationName, props, queryParams, response, verb } =
    verbOptions
  const { route } = options

  const hookName = `use${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}`
  const responseType = response.definition.success || 'void'

  // Props have type as string: "param", "body", "query_param", "named_path_params", "header"
  // Definition includes name: "orgId: string"
  const pathParams = props.filter(
    (p) => p.type === 'param' || p.type === 'named_path_params',
  )
  const hasBody = body && body.definition !== ''

  // Build TParams type fields — extract just the type from "name: type" definitions
  const paramFields = []
  for (const p of pathParams) {
    paramFields.push(p.definition)
  }
  if (queryParams) {
    paramFields.push(`params?: ${queryParams.schema.name}`)
  }

  // Build type arguments for useApiProxy<TResponse, TBody, TParams>
  const typeArgs = [responseType]
  if (hasBody) {
    typeArgs.push(body.definition)
  } else {
    typeArgs.push('undefined')
  }
  if (paramFields.length > 0) {
    typeArgs.push(`{ ${paramFields.join('; ')} }`)
  }

  // Remove trailing 'undefined' type args
  while (typeArgs.length > 1 && typeArgs[typeArgs.length - 1] === 'undefined') {
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

  // Build URL expression and optional URL builder function
  let urlExpr
  let urlBuilderFn = ''
  if (queryParams) {
    const urlBuilderName = `get${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}Url`
    const urlBuilderParams = [
      ...pathParams.map((p) => `${p.name}: string`),
      `params?: ${queryParams.schema.name}`,
    ].join(', ')
    const urlBuilderArgs = [...pathParams.map((p) => p.name), 'params'].join(
      ', ',
    )
    const baseUrl = '`' + route + '`'
    urlBuilderFn = `
function ${urlBuilderName}(${urlBuilderParams}) {
\tconst normalizedParams = new URLSearchParams()
\tObject.entries(params || {}).forEach(([key, value]) => {
\t\tif (value !== undefined) {
\t\t\tnormalizedParams.append(key, value === null ? 'null' : value.toString())
\t\t}
\t})
\tconst query = normalizedParams.toString()
\treturn query ? ${baseUrl} + '?' + query : ${baseUrl}
}
`
    urlExpr = `${urlBuilderName}(${urlBuilderArgs})`
  } else {
    urlExpr = '`' + route + '`'
  }

  const isPublic = isPublicRoute(route)
  const skipAuthLine = isPublic ? '\n\t\tskipAuth: true,' : ''

  const implementation = `${urlBuilderFn}
export function ${hookName}(options?: ApiProxyOptions<${responseType}>) {
\treturn useApiProxy<${typeArgsStr}>({
\t\tgetUrl: (${paramDestructure}) => ${urlExpr},
\t\tmethod: '${verb.toUpperCase()}',${skipAuthLine}
\t}, options)
}
`

  // Collect imports for types used — skip built-in types
  const imports = []
  if (hasBody) {
    imports.push({ name: baseTypeName(body.definition) })
  }
  if (!BUILTIN_TYPES.has(baseTypeName(responseType))) {
    imports.push({ name: baseTypeName(responseType) })
  }
  if (queryParams) {
    imports.push({ name: queryParams.schema.name })
  }
  // Import types used in path param definitions (e.g. "configId: ModelsIssueImporterConfigId")
  for (const p of pathParams) {
    const parts = p.definition.split(':')
    if (parts.length >= 2) {
      const typeName = baseTypeName(parts.slice(1).join(':').trim())
      if (!BUILTIN_TYPES.has(typeName)) {
        imports.push({ name: typeName })
      }
    }
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

export const fetcherClientBuilder = () => ({
  client: generateFetcherHook,
  dependencies: getFetcherDependencies,
  header: generateFetcherHeader,
})

export default fetcherClientBuilder
