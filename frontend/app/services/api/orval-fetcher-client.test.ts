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

import { describe, expect, it } from 'vitest'

import { fetcherClientBuilder } from './orval-fetcher-client.mjs'

type FakeProperty = { definition: string; name: string; type: string }

type FakeVerbOptions = {
  body?: { definition: string }
  operationName: string
  props: FakeProperty[]
  queryParams?: { schema: { name: string } }
  response: { definition: { success: string } }
  verb: string
}

const { client: generateFetcherHook, dependencies, header } = fetcherClientBuilder()

const orgId: FakeProperty = { definition: 'orgId: string', name: 'orgId', type: 'param' }
const configId: FakeProperty = {
  definition: 'configId: ModelsIssueImporterConfigId',
  name: 'configId',
  type: 'named_path_params',
}

const verbOptionsOf = (overrides: Partial<FakeVerbOptions>): FakeVerbOptions => ({
  operationName: 'getThing',
  props: [],
  response: { definition: { success: 'ModelsThing' } },
  verb: 'get',
  ...overrides,
})

const generate = (overrides: Partial<FakeVerbOptions>, route = '/things') =>
  generateFetcherHook(verbOptionsOf(overrides), { route })

const typeArgumentsOf = (implementation: string) =>
  /useApiProxy<(.*)>\(\{/.exec(implementation)?.[1]

describe('fetcherClientBuilder', () => {
  it('imports useApiProxy in the header', () => {
    expect(header()).toBe(
      "import { type ApiProxyOptions, useApiProxy } from '~/hooks/use-api-proxy'\n",
    )
  })

  it('declares the react-router dependency', () => {
    expect(dependencies()).toEqual([
      { dependency: 'react-router', exports: [{ name: 'useFetcher', values: true }] },
    ])
  })
})

describe('generateFetcherHook', () => {
  it('generates a hook for an endpoint without parameters', () => {
    const { implementation } = generate({})
    expect(implementation).toBe(
      [
        'export function useGetThing(options?: ApiProxyOptions<ModelsThing>) {',
        '\treturn useApiProxy<ModelsThing>({',
        '\t\tgetUrl: () => `/things`,',
        "\t\tmethod: 'GET',",
        '\t}, options)',
        '}',
      ].join('\n'),
    )
  })

  it('destructures the path params in getUrl', () => {
    const { implementation } = generate(
      { props: [orgId, configId] },
      '/organisations/${orgId}/configs/${configId}',
    )
    expect(implementation).toContain(
      'getUrl: ({ orgId, configId }) => `/organisations/${orgId}/configs/${configId}`,',
    )
  })

  it('ignores props that are no path params', () => {
    const { implementation } = generate({
      props: [orgId, { definition: 'body: X', name: 'body', type: 'body' }],
    })
    expect(implementation).toContain('getUrl: ({ orgId }) =>')
  })

  it('emits a URL builder for query params', () => {
    const { implementation } = generate(
      { props: [orgId], queryParams: { schema: { name: 'GetThingParams' } } },
      '/organisations/${orgId}/things',
    )
    expect(implementation).toContain(
      'function getGetThingUrl(orgId: string, params?: GetThingParams) {',
    )
    expect(implementation).toContain(
      'getUrl: ({ orgId, params }) => getGetThingUrl(orgId, params),',
    )
  })

  it('upper-cases the verb', () => {
    expect(generate({ verb: 'delete' }).implementation).toContain("method: 'DELETE',")
  })

  it('skips the auth for a public endpoint', () => {
    expect(generate({}, '/config').implementation).toContain('skipAuth: true,')
    expect(generate({}, '/things').implementation).not.toContain('skipAuth')
  })

  it('uses void for an endpoint without a success type', () => {
    const { implementation } = generate({ response: { definition: { success: '' } } })
    expect(implementation).toContain('options?: ApiProxyOptions<void>')
  })

  it('treats an empty body definition as no body', () => {
    const { implementation, imports } = generate({ body: { definition: '' } })
    expect(typeArgumentsOf(implementation)).toBe('ModelsThing')
    expect(imports).toEqual([{ name: 'ModelsThing' }])
  })
})

describe('proxyTypeArguments (through the generated hook)', () => {
  it('keeps only the response type when there is no body and no params', () => {
    expect(typeArgumentsOf(generate({}).implementation)).toBe('ModelsThing')
  })

  it('adds the body type', () => {
    const { implementation } = generate({ body: { definition: 'ModelsThingInput' } })
    expect(typeArgumentsOf(implementation)).toBe('ModelsThing, ModelsThingInput')
  })

  it('keeps an undefined body before the params', () => {
    const { implementation } = generate({ props: [orgId] })
    expect(typeArgumentsOf(implementation)).toBe('ModelsThing, undefined, { orgId: string }')
  })

  it('joins the path params and the query params', () => {
    const { implementation } = generate({
      body: { definition: 'ModelsThingInput' },
      props: [orgId, configId],
      queryParams: { schema: { name: 'GetThingParams' } },
    })
    expect(typeArgumentsOf(implementation)).toBe(
      'ModelsThing, ModelsThingInput, { orgId: string; configId: ModelsIssueImporterConfigId; params?: GetThingParams }',
    )
  })
})

describe('typeImports (through the generated hook)', () => {
  it('imports the body, the response, the query params and the path param models', () => {
    const { imports } = generate({
      body: { definition: 'ModelsThingInput[]' },
      props: [orgId, configId],
      queryParams: { schema: { name: 'GetThingParams' } },
      response: { definition: { success: 'ModelsThing[]' } },
    })
    expect(imports).toEqual([
      { name: 'ModelsThingInput' },
      { name: 'ModelsThing' },
      { name: 'GetThingParams' },
      { name: 'ModelsIssueImporterConfigId' },
    ])
  })

  it('skips built-in response types, including unions', () => {
    expect(generate({ response: { definition: { success: 'string' } } }).imports).toEqual([])
    expect(generate({ response: { definition: { success: 'string | void' } } }).imports).toEqual([])
  })

  it('strips a generic wrapper from the response type', () => {
    const { imports } = generate({ response: { definition: { success: 'Paged<ModelsThing>' } } })
    expect(imports).toEqual([{ name: 'Paged' }])
  })

  it('skips a path param without a type annotation', () => {
    const { imports } = generate({
      props: [{ definition: 'orgId', name: 'orgId', type: 'param' }],
      response: { definition: { success: 'void' } },
    })
    expect(imports).toEqual([])
  })
})
