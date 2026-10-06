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

import { afterEach, describe, expect, it, vi } from 'vitest'

import { type ModelsTag } from '~/services/api/lasius'

import { getTagSummary, getTagText, getTagVariant, openIssueLink } from './tag-display'

const simpleTag: ModelsTag = { id: 'Billable', type: 'SimpleTag' }
const tagGroup: ModelsTag = { id: 'Support', relatedTags: [], type: 'TagGroup' }
const issueTag: ModelsTag = {
  id: 'LAS-42',
  issueLink: 'https://gitlab.example.com/lasius/-/issues/42',
  projectId: 7,
  relatedTags: [],
  summary: 'Fix the login',
  type: 'GitlabIssueTag',
}
const issueTagWithoutSummary: ModelsTag = { ...issueTag, summary: null }

describe('getTagVariant', () => {
  it('maps the simple tag and the tag group to their own variants', () => {
    expect(getTagVariant(simpleTag)).toBe('tagSimpleTag')
    expect(getTagVariant(tagGroup)).toBe('tagTagGroup')
  })

  it('uses the summary variant for an issue tag', () => {
    expect(getTagVariant(issueTag)).toBe('tagWithSummary')
  })
})

describe('getTagSummary and getTagText', () => {
  it('joins the id and the summary', () => {
    expect(getTagSummary(issueTag)).toBe('Fix the login')
    expect(getTagText(issueTag)).toBe('LAS-42: Fix the login')
  })

  it('returns the id alone when no summary exists', () => {
    expect(getTagSummary(issueTagWithoutSummary)).toBe('')
    expect(getTagText(issueTagWithoutSummary)).toBe('LAS-42')
    expect(getTagText(simpleTag)).toBe('Billable')
  })
})

describe('openIssueLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the issue in a new tab without an opener reference', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })

    openIssueLink(issueTag)

    expect(open).toHaveBeenCalledWith(
      'https://gitlab.example.com/lasius/-/issues/42',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('opens nothing for a tag without a link', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })

    openIssueLink(simpleTag)

    expect(open).not.toHaveBeenCalled()
  })
})
