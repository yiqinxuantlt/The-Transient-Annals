import { describe, expect, it } from 'vitest'
import {
  createFictionSampleProject,
  createHistorySampleProject,
  sampleProjects,
} from './sampleData'

describe('sampleData', () => {
  it('ships repaired sample project titles', () => {
    expect(sampleProjects.map((project) => project.title)).toEqual(
      expect.arrayContaining(['浮生录示例案卷', '楚汉旧闻', '星海边境设定']),
    )
  })

  it('ships repaired representative entity and event copy', () => {
    expect(createHistorySampleProject().entities[0]?.name).toBe('刘邦')
    expect(createHistorySampleProject().entities[1]?.name).toBe('项羽')
    expect(createFictionSampleProject().events[0]?.title).toBe('神秘信件出现')
    expect(createFictionSampleProject().libraryItems[0]?.title).toBe('主题札记：身份与选择')
  })

  it('does not serialize replacement characters into shipped sample data', () => {
    expect(JSON.stringify(sampleProjects)).not.toContain('\uFFFD')
  })
})
