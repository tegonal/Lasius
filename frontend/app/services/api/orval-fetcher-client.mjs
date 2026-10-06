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
const PUBLIC_ENDPOINTS = new Set(['/config', '/csrf-token', '/oauth2/login', '/oauth2/logout'])

function isPublicRoute(route) {
  const staticRoute = route.replaceAll(/\$\{[^}]+\}/g, '*')
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
  return type.replace(/\[\]$/, '').replace(/<[^>]*>$/, '')
}

function generateFetcherHeader() {
  return "import { type ApiProxyOptions, useApiProxy } from '~/hooks/use-api-proxy'\n"
}

function generateFetcherHook(verbOptions, options) {
  const { body, operationName, props, queryParams, response, verb } = verbOptions
  const { route } = options

  const hookName = `use${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}`
  const responseType = response.definition.success || 'void'

  // Props have type as string: "param", "body", "query_param", "named_path_params", "header"
  // Definition includes name: "orgId: string"
  const pathParameters = props.filter((p) => p.type === 'param' || p.type === 'named_path_params')
  const hasBody = body && body.definition !== ''

  // Build TParams type fields — extract just the type from "name: type" definitions
  const parameterFields = Array.from(pathParameters, (p) => p.definition)
  if (queryParams) {
    parameterFields.push(`params?: ${queryParams.schema.name}`)
  }

  // Build type arguments for useApiProxy<TResponse, TBody, TParams>
  const typeArguments = [responseType]
  if (hasBody) {
    typeArguments.push(body.definition)
  } else {
    typeArguments.push('undefined')
  }
  if (parameterFields.length > 0) {
    typeArguments.push(`{ ${parameterFields.join('; ')} }`)
  }

  // Remove trailing 'undefined' type args
  while (typeArguments.length > 1 && typeArguments.at(-1) === 'undefined') {
    typeArguments.pop()
  }

  const typeArgumentsString = typeArguments.join(', ')

  // Build getUrl parameter destructure
  const urlParameterNames = [
    ...pathParameters.map((p) => p.name),
    ...(queryParams ? ['params'] : []),
  ]
  const parameterDestructure =
    urlParameterNames.length > 0 ? `{ ${urlParameterNames.join(', ')} }` : ''

  // Build URL expression and optional URL builder function
  let urlExpression
  let urlBuilderFunction = ''
  if (queryParams) {
    const urlBuilderName = `get${operationName.charAt(0).toUpperCase()}${operationName.slice(1)}Url`
    const urlBuilderParameters = [
      ...pathParameters.map((p) => `${p.name}: string`),
      `params?: ${queryParams.schema.name}`,
    ].join(', ')
    const urlBuilderArguments = [...pathParameters.map((p) => p.name), 'params'].join(', ')
    const baseUrl = '`' + route + '`'
    urlBuilderFunction = `
function ${urlBuilderName}(${urlBuilderParameters}) {
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
    urlExpression = `${urlBuilderName}(${urlBuilderArguments})`
  } else {
    urlExpression = '`' + route + '`'
  }

  const isPublic = isPublicRoute(route)
  const skipAuthLine = isPublic ? '\n\t\tskipAuth: true,' : ''

  const implementation = `${urlBuilderFunction}
export function ${hookName}(options?: ApiProxyOptions<${responseType}>) {
\treturn useApiProxy<${typeArgumentsString}>({
\t\tgetUrl: (${parameterDestructure}) => ${urlExpression},
\t\tmethod: '${verb.toUpperCase()}',${skipAuthLine}
\t}, options)
}
`

  // Collect imports for types used — skip built-in types
  const imports = []
  if (hasBody) {
    imports.push({ name: baseTypeName(body.definition) })
  }
  if (!isBuiltinType(responseType)) {
    imports.push({ name: baseTypeName(responseType) })
  }
  if (queryParams) {
    imports.push({ name: queryParams.schema.name })
  }
  // Import types used in path param definitions (e.g. "configId: ModelsIssueImporterConfigId")
  for (const p of pathParameters) {
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

// Check if a type string is entirely built-in (handles unions like "string | void")
function isBuiltinType(type) {
  return type
    .split('|')
    .map((t) => t.trim())
    .every((t) => BUILTIN_TYPES.has(baseTypeName(t)))
}

export const fetcherClientBuilder = () => ({
  client: generateFetcherHook,
  dependencies: getFetcherDependencies,
  header: generateFetcherHeader,
})

export default fetcherClientBuilder
