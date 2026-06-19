import { describe, expect, it } from 'vitest'
import { projectTemplates, templateNavItems } from './projectTemplates'

describe('projectTemplates', () => {
  it('exposes repaired Chinese labels for the history template', () => {
    expect(projectTemplates.history.name).toBe('历史人物事件')
    expect(projectTemplates.history.shortName).toBe('历史模板')
    expect(projectTemplates.history.nav.entities).toBe('人物志')
    expect(projectTemplates.history.nav.events).toBe('纪事簿')
    expect(projectTemplates.history.nav.help).toBe('使用手册')
    expect(projectTemplates.history.pages.relationGraph.title).toBe('势力图')
    expect(projectTemplates.history.pages.eventGraph.title).toBe('因果图')
    expect(projectTemplates.history.relationTypes).toContain('联盟')
    expect(projectTemplates.history.eventLinkTypes).toContain('奠定基础')
  })

  it('exposes repaired Chinese labels for the fiction template', () => {
    expect(projectTemplates.fiction.name).toBe('小说人物情节')
    expect(projectTemplates.fiction.shortName).toBe('小说模板')
    expect(projectTemplates.fiction.nav.entities).toBe('人物志')
    expect(projectTemplates.fiction.nav.timeline).toBe('流年轴')
    expect(projectTemplates.fiction.pages.relationGraph.title).toBe('群像图')
    expect(projectTemplates.fiction.pages.eventGraph.title).toBe('因果图')
    expect(projectTemplates.fiction.entityTypeLabels.character).toBe('小说角色')
    expect(projectTemplates.fiction.defaultEntityTags).toEqual(['待完善'])
  })

  it('adds a help nav entry alongside the template workspace nav items', () => {
    expect(templateNavItems.some((item) => item.to === 'help' && item.key === 'help')).toBe(true)
  })
})
