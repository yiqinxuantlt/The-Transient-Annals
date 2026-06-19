import type { ReactNode } from 'react'

export type InspectorTab = 'detail' | 'evidence' | 'style' | 'notes'

type Props = {
  activeTab: InspectorTab
  onTabChange: (tab: InspectorTab) => void
  detail: ReactNode
  evidence: ReactNode
  style: ReactNode
  notes: ReactNode
}

const tabs: Array<{ value: InspectorTab; label: string }> = [
  { value: 'detail', label: '档案详情' },
  { value: 'evidence', label: '证据链' },
  { value: 'style', label: '关系样式' },
  { value: 'notes', label: '分析笔记' },
]

export default function GraphInspectorPanel({
  activeTab,
  onTabChange,
  detail,
  evidence,
  style,
  notes,
}: Props) {
  const content = {
    detail,
    evidence,
    style,
    notes,
  }[activeTab]

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft">
      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={[
              'min-h-9 rounded-lg border px-2 text-xs transition',
              activeTab === tab.value
                ? 'border-goldline bg-goldline/15 text-ink-900'
                : 'border-ink-900/10 bg-paper-50/70 text-ink-600 hover:border-goldline/40',
            ].join(' ')}
            aria-pressed={activeTab === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="fsl-scrollbar mt-4 min-h-0 flex-1 overflow-auto pr-1">{content}</div>
    </aside>
  )
}
