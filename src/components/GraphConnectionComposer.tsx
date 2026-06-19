import { X } from 'lucide-react'
import type { EdgeVisualStyle } from '../types'
import EdgeStyleControls from './EdgeStyleControls'

export type GraphConnectionDraft = {
  sourceId: string
  targetId: string
  type: string
  description: string
  style?: EdgeVisualStyle
}

type Option = {
  id: string
  label: string
}

type Props = {
  open: boolean
  title: string
  sourceLabel: string
  targetLabel: string
  submitLabel: string
  draft: GraphConnectionDraft
  nodes: Option[]
  types: string[]
  onDraftChange: (draft: GraphConnectionDraft) => void
  onClose: () => void
  onSubmit: () => void
}

export default function GraphConnectionComposer({
  open,
  title,
  sourceLabel,
  targetLabel,
  submitLabel,
  draft,
  nodes,
  types,
  onDraftChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null

  const canSubmit = draft.sourceId && draft.targetId && draft.sourceId !== draft.targetId && draft.type.trim()

  return (
    <section className="rounded-lg border border-goldline/30 bg-paper-50 p-4 shadow-archive">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">Composer</p>
          <h3 className="font-serif text-xl font-semibold">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="关闭连接编辑"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm">
          {sourceLabel}
          <select
            value={draft.sourceId}
            onChange={(event) => onDraftChange({ ...draft, sourceId: event.target.value })}
            className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          {targetLabel}
          <select
            value={draft.targetId}
            onChange={(event) => onDraftChange({ ...draft, targetId: event.target.value })}
            className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          类型
          <select
            value={draft.type}
            onChange={(event) => onDraftChange({ ...draft, type: event.target.value })}
            className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          说明
          <textarea
            value={draft.description}
            onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
            className="min-h-24 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
          />
        </label>
        <EdgeStyleControls value={draft.style} onChange={(style) => onDraftChange({ ...draft, style })} />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="min-h-11 rounded-lg bg-ink-900 px-4 text-sm text-paper-50 transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitLabel}
        </button>
      </div>
    </section>
  )
}
