import { describe, expect, it } from 'vitest'
import { getProjectIdFromLocation } from './currentProjectRoute'

describe('getProjectIdFromLocation', () => {
  it('reads project IDs from normal browser paths', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/projects/project-browser/dashboard',
        hash: '',
      }),
    ).toBe('project-browser')
  })

  it('reads project IDs from desktop hash-router paths', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/C:/Program Files/Fushenglu/resources/app.asar/dist/index.html',
        hash: '#/projects/project-desktop/library',
      }),
    ).toBe('project-desktop')
  })

  it('decodes URL-encoded project IDs', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/projects/project%20with%20spaces/events',
        hash: '',
      }),
    ).toBe('project with spaces')
  })

  it('returns undefined when no project route is active', () => {
    expect(
      getProjectIdFromLocation({
        pathname: '/help',
        hash: '',
      }),
    ).toBeUndefined()
  })
})
