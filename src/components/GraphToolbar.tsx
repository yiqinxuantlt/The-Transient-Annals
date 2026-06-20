import { Check, Focus, Fullscreen, LayoutGrid, Maximize2, Network, Plus, RotateCcw, SearchX } from 'lucide-react'
import type { GraphLayoutView } from '../lib/graphLayoutViews'

export type GraphWorkMode = 'browse' | 'reasoning' | 'organize'

type Props = {
  mode: GraphWorkMode
  activeFilterCount: number
  immersive: boolean
  hasFocus: boolean
  layoutView: GraphLayoutView
  hasLayoutPreview: boolean
  onModeChange: (mode: GraphWorkMode) => void
  onLayoutViewChange: (view: GraphLayoutView) => void
  onApplyLayoutView: () => void
  onAddConnection: () => void
  onAutoLayout: () => void
  onFitView: () => void
  onClearFilters: () => void
  onToggleImmersive: () => void
  onExitFocus: () => void
}

const modeLabels: Array<{ value: GraphWorkMode; label: string }> = [
  { value: 'browse', label: '浏览' },
  { value: 'reasoning', label: '推理' },
  { value: 'organize', label: '整理' },
]

const layoutOptions: Array<{ value: GraphLayoutView; label: string }> = [
  { value: 'free', label: '自由布局' },
  { value: 'relationship', label: '人物关系' },
  { value: 'timeline', label: '时间事件' },
  { value: 'evidence', label: '证据资料' },
]

export default function GraphToolbar({
  mode,
  activeFilterCount,
  immersive,
  hasFocus,
  layoutView,
  hasLayoutPreview,
  onModeChange,
  onLayoutViewChange,
  onApplyLayoutView,
  onAddConnection,
  onAutoLayout,
  onFitView,
  onClearFilters,
  onToggleImmersive,
  onExitFocus,
}: Props) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-goldline/30 bg-paper-50/90 p-1 shadow-soft backdrop-blur">
        {modeLabels.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onModeChange(item.value)}
            className={[
              'min-h-8 rounded-md px-3 text-xs transition',
              mode === item.value ? 'bg-ink-900 text-paper-50' : 'text-ink-700 hover:bg-ink-900/5',
            ].join(' ')}
            aria-pressed={mode === item.value}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/30 bg-paper-50/90 px-2 text-xs text-ink-600 shadow-soft backdrop-blur">
        <Network size={15} />
        <select
          value={layoutView}
          onChange={(event) => onLayoutViewChange(event.target.value as GraphLayoutView)}
          className="bg-transparent text-xs text-ink-700 outline-none"
          aria-label="布局视图"
        >
          {layoutOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {hasLayoutPreview ? (
        <button type="button" onClick={onApplyLayoutView} className="graph-tool-button">
          <Check size={16} />
          应用布局
        </button>
      ) : null}
      <button type="button" onClick={onAddConnection} className="graph-tool-button">
        <Plus size={16} />
        添加连接
      </button>
      <button type="button" onClick={onAutoLayout} className="graph-tool-button">
        <LayoutGrid size={16} />
        自动整理
      </button>
      <button type="button" onClick={onFitView} className="graph-tool-button" aria-label="适应视图">
        <Maximize2 size={16} />
      </button>
      {activeFilterCount ? (
        <button type="button" onClick={onClearFilters} className="graph-tool-button">
          <SearchX size={16} />
          清空筛选
        </button>
      ) : null}
      {hasFocus ? (
        <button type="button" onClick={onExitFocus} className="graph-tool-button">
          <Focus size={16} />
          退出聚焦
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggleImmersive}
        className="graph-tool-button"
        aria-pressed={immersive}
      >
        {immersive ? <RotateCcw size={16} /> : <Fullscreen size={16} />}
        {immersive ? '退出沉浸' : '沉浸'}
      </button>
    </div>
  )
}
