import { describe, expect, it } from 'vitest'
import { projectTemplates, templateNavItems } from './projectTemplates'

describe('projectTemplates', () => {
  it('exposes repaired Chinese labels for the history template', () => {
    expect(projectTemplates.history.name).toBe('历史人物事件')
    expect(projectTemplates.history.shortName).toBe('历史模板')
    expect(projectTemplates.history.nav.help).toBe('使用手册')
  })

  it('exposes repaired Chinese labels for the fiction template', () => {
    expect(projectTemplates.fiction.name).toBe('小说人物情节')
    expect(projectTemplates.fiction.shortName).toBe('小说模板')
    expect(projectTemplates.fiction.pages.relationGraph.title).toBe('群像图')
    expect(projectTemplates.fiction.pages.eventGraph.title).toBe('因果图')
  })

  it('adds a help nav entry alongside the template workspace nav items', () => {
    expect(templateNavItems.some((item) => item.to === 'help' && item.key === 'help')).toBe(true)
  })
})
