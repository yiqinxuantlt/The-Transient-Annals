import { Search, X } from 'lucide-react'
import { countActiveFilters, type GraphFilterOptions, type GraphFilters } from '../lib/graphWorkbench'

type Props = {
  filters: GraphFilters
  options: GraphFilterOptions
  onChange: (filters: GraphFilters) => void
  onClear: () => void
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function FilterGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string
  values: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  if (!values.length) return null

  return (
    <div>
      <p className="mb-2 text-xs text-ink-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={[
              'min-h-8 rounded-full border px-3 text-xs transition',
              selected.includes(value)
                ? 'border-goldline bg-goldline/15 text-ink-900'
                : 'border-ink-900/10 bg-paper-50/70 text-ink-600 hover:border-goldline/40',
            ].join(' ')}
            aria-pressed={selected.includes(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GraphFilterPanel({ filters, options, onChange, onClear }: Props) {
  const activeCount = countActiveFilters(filters)

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">Filters</p>
          <h3 className="font-serif text-xl font-semibold">筛选与图层</h3>
        </div>
        {activeCount ? (
          <span className="rounded-full bg-goldline/15 px-2.5 py-1 text-xs text-ink-700">
            已应用 {activeCount} 项
          </span>
        ) : null}
      </div>

      <label className="mt-4 flex min-h-10 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm text-ink-500 focus-within:border-goldline">
        <Search size={15} />
        <input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="搜索节点、关系、标签"
          className="min-w-0 flex-1 bg-transparent text-ink-800 outline-none placeholder:text-ink-500/70"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => onChange({ ...filters, query: '' })}
            aria-label="清空搜索"
            className="text-ink-400 hover:text-ink-800"
          >
            <X size={14} />
          </button>
        ) : null}
      </label>

      <div className="fsl-scrollbar mt-4 min-h-0 flex-1 space-y-4 overflow-auto pr-1">
        <FilterGroup
          title="节点类型"
          values={options.nodeTypes}
          selected={filters.nodeTypes}
          onToggle={(value) => onChange({ ...filters, nodeTypes: toggleValue(filters.nodeTypes, value) })}
        />
        <FilterGroup
          title="连接类型"
          values={options.edgeTypes}
          selected={filters.edgeTypes}
          onToggle={(value) => onChange({ ...filters, edgeTypes: toggleValue(filters.edgeTypes, value) })}
        />
        <FilterGroup
          title="标签"
          values={options.tags}
          selected={filters.tags}
          onToggle={(value) => onChange({ ...filters, tags: toggleValue(filters.tags, value) })}
        />
        <FilterGroup
          title="阵营"
          values={options.factions}
          selected={filters.factions}
          onToggle={(value) => onChange({ ...filters, factions: toggleValue(filters.factions, value) })}
        />
        <FilterGroup
          title="地点"
          values={options.locations}
          selected={filters.locations}
          onToggle={(value) => onChange({ ...filters, locations: toggleValue(filters.locations, value) })}
        />
        {options.minYear != null && options.maxYear != null ? (
          <label className="grid gap-2 text-xs text-ink-500">
            时间截面
            <input
              type="range"
              min={options.minYear}
              max={options.maxYear}
              value={filters.year ?? options.maxYear}
              onChange={(event) => onChange({ ...filters, year: Number(event.target.value) })}
              className="w-full accent-[rgb(var(--goldline))]"
            />
            <span className="text-ink-700">{filters.year == null ? '显示全部时间' : `${filters.year}`}</span>
          </label>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={!activeCount}
        className="mt-4 min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm text-ink-700 transition hover:bg-paper-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        清空筛选
      </button>
    </aside>
  )
}
