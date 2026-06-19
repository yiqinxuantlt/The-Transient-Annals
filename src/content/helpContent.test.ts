import { describe, expect, it } from 'vitest'
import { helpSections } from './helpContent'

describe('helpSections', () => {
  it('contains the six required manual sections in order', () => {
    expect(helpSections.map((section) => section.id)).toEqual([
      'overview',
      'quick-start',
      'workspace-guide',
      'common-actions',
      'data-and-storage',
      'development-and-troubleshooting',
    ])
  })

  it('uses the approved Chinese section titles', () => {
    expect(helpSections.map((section) => section.title)).toEqual([
      '产品概览',
      '快速开始',
      '工作区页面说明',
      '常用操作',
      '数据与保存',
      '开发说明与常见问题',
    ])
  })

  it('keeps user-facing help copy readable', () => {
    const serialized = JSON.stringify(helpSections)
    expect(serialized).toContain('浮生录用于整理历史、小说、剧本与世界观设定')
    expect(serialized).toContain('新增、编辑和删除人物、事件、关系与资料条目')
    expect(serialized).not.toMatch(/鍘|妗|璇|鈥|锛|鐨|绌|鎼/)
  })
})
