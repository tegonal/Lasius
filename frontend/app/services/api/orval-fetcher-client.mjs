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

const capitalize = (value) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`

function generateFetcherHook(verbOptions, options) {
  const { body, operationName, props, queryParams, response, verb } = verbOptions
  const { route } = options

  const responseType = response.definition.success || 'void'
  // Props have the type "param", "body", "query_param", "named_path_params" or "header".
  const pathParameters = props.filter((p) => p.type === 'param' || p.type === 'named_path_params')
  const bodyOrNull = body && body.definition !== '' ? body : null

  const urlParameterNames = [
    ...pathParameters.map((p) => p.name),
    ...(queryParams ? ['params'] : []),
  ]
  const parameterDestructure =
    urlParameterNames.length > 0 ? `{ ${urlParameterNames.join(', ')} }` : ''
  const { urlBuilderFunction, urlExpression } = urlSource(
    operationName,
    route,
    pathParameters,
    queryParams,
  )
  const skipAuthLine = isPublicRoute(route) ? '\n\t\tskipAuth: true,' : ''
  const typeArgumentsString = proxyTypeArguments(
    responseType,
    bodyOrNull,
    pathParameters,
    queryParams,
  )

  const implementation = `${urlBuilderFunction}
export function use${capitalize(operationName)}(options?: ApiProxyOptions<${responseType}>) {
\treturn useApiProxy<${typeArgumentsString}>({
\t\tgetUrl: (${parameterDestructure}) => ${urlExpression},
\t\tmethod: '${verb.toUpperCase()}',${skipAuthLine}
\t}, options)
}
`

  return {
    implementation: implementation.trim(),
    imports: typeImports(responseType, bodyOrNull, pathParameters, queryParams),
  }
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

// Type arguments for useApiProxy<TResponse, TBody, TParams>, without trailing 'undefined' entries.
function proxyTypeArguments(responseType, body, pathParameters, queryParameters) {
  // A path param definition holds the name and the type, for example "orgId: string".
  const parameterFields = pathParameters.map((p) => p.definition)
  if (queryParameters) parameterFields.push(`params?: ${queryParameters.schema.name}`)

  const typeArguments = [responseType, body ? body.definition : 'undefined']
  if (parameterFields.length > 0) typeArguments.push(`{ ${parameterFields.join('; ')} }`)
  while (typeArguments.length > 1 && typeArguments.at(-1) === 'undefined') typeArguments.pop()
  return typeArguments.join(', ')
}

// Type imports of the hook. Built-in types need no import.
function typeImports(responseType, body, pathParameters, queryParameters) {
  const imports = []
  if (body) imports.push({ name: baseTypeName(body.definition) })
  if (!isBuiltinType(responseType)) imports.push({ name: baseTypeName(responseType) })
  if (queryParameters) imports.push({ name: queryParameters.schema.name })
  // A path param can carry a model type, for example "configId: ModelsIssueImporterConfigId".
  for (const p of pathParameters) {
    const parts = p.definition.split(':')
    if (parts.length < 2) continue
    const typeName = baseTypeName(parts.slice(1).join(':').trim())
    if (!BUILTIN_TYPES.has(typeName)) imports.push({ name: typeName })
  }
  return imports
}

// The URL expression of getUrl, plus a URL builder function when the endpoint has query params.
function urlSource(operationName, route, pathParameters, queryParameters) {
  const baseUrl = '`' + route + '`'
  if (!queryParameters) return { urlBuilderFunction: '', urlExpression: baseUrl }

  const urlBuilderName = `get${capitalize(operationName)}Url`
  const urlBuilderParameters = [
    ...pathParameters.map((p) => `${p.name}: string`),
    `params?: ${queryParameters.schema.name}`,
  ].join(', ')
  const urlBuilderArguments = [...pathParameters.map((p) => p.name), 'params'].join(', ')
  const urlBuilderFunction = `
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
  return { urlBuilderFunction, urlExpression: `${urlBuilderName}(${urlBuilderArguments})` }
}

export const fetcherClientBuilder = () => ({
  client: generateFetcherHook,
  dependencies: getFetcherDependencies,
  header: generateFetcherHeader,
})
