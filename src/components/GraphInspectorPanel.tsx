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
  { value: 'detail', label: '详情' },
  { value: 'evidence', label: '证据链' },
  { value: 'style', label: '样式' },
  { value: 'notes', label: '分析札记' },
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
    <aside className="archive-card paper-grain flex h-full min-h-0 flex-col rounded-lg border border-goldline/25 bg-paper-50/75 p-4 shadow-soft">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-goldline/30 bg-paper-50/90 p-1 shadow-soft backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={[
              'min-h-9 rounded-md px-2 text-xs transition',
              activeTab === tab.value
                ? 'bg-ink-900 text-paper-50 shadow-sm'
                : 'text-ink-600 hover:bg-goldline/10 hover:text-ink-900',
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
