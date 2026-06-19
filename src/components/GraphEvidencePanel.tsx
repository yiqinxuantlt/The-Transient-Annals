import { Save, Trash2, Undo2 } from 'lucide-react'
import type { EvidenceNextStep } from '../lib/graphWorkbench'
import type { AnalysisNote, GraphMode } from '../types'

type ChainState = {
  nodeIds: string[]
  edgeIds: string[]
  summary: string
}

type Props = {
  graphMode: GraphMode
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ id: string; type: string; sourceId: string; targetId: string }>
  chain: ChainState
  nextSteps: EvidenceNextStep[]
  savedNotes: AnalysisNote[]
  onAppendStep: (step: EvidenceNextStep) => void
  onRemoveLast: () => void
  onClear: () => void
  onSummaryChange: (summary: string) => void
  onSave: () => void
  onOpenNote: (note: AnalysisNote) => void
  onDeleteNote: (noteId: string) => void
}

const graphModeLabel: Record<GraphMode, string> = {
  entities: '人物关系',
  events: '事件因果',
}

export default function GraphEvidencePanel({
  graphMode,
  nodes,
  edges,
  chain,
  nextSteps,
  savedNotes,
  onAppendStep,
  onRemoveLast,
  onClear,
  onSummaryChange,
  onSave,
  onOpenNote,
  onDeleteNote,
}: Props) {
  const nodeLabel = (nodeId: string) => nodes.find((node) => node.id === nodeId)?.label || nodeId
  const edgeLabel = (edgeId: string) => edges.find((edge) => edge.id === edgeId)?.type || edgeId
  const canSave = chain.nodeIds.length > 0 && chain.summary.trim().length > 0

  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-500">{graphModeLabel[graphMode]}</p>
            <h3 className="font-serif text-xl font-semibold">当前证据链</h3>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onRemoveLast} className="graph-tool-button" aria-label="撤回一步">
              <Undo2 size={15} />
            </button>
            <button type="button" onClick={onClear} className="graph-tool-button" aria-label="清空证据链">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {chain.nodeIds.length ? (
          <ol className="mt-4 space-y-2">
            {chain.nodeIds.map((nodeId, index) => (
              <li
                key={`${nodeId}-${index}`}
                className="archive-card paper-grain rounded-lg border border-goldline/20 bg-paper-50/70 p-3 text-sm"
              >
                <strong className="text-ink-900">{nodeLabel(nodeId)}</strong>
                {chain.edgeIds[index] ? (
                  <p className="mt-1 text-xs text-ink-500">经由：{edgeLabel(chain.edgeIds[index])}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="archive-card paper-grain mt-4 rounded-lg border border-dashed border-goldline/25 bg-paper-50/65 p-4 text-sm leading-6 text-ink-500">
            在推理模式中选择一个节点作为起点，再沿关系逐步加入证据链。
          </p>
        )}

        <label className="mt-4 grid gap-2 text-sm">
          推理摘要
          <textarea
            value={chain.summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            className="archive-input min-h-24 w-full !py-3"
            placeholder="记录这条链路说明了什么"
          />
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="archive-primary-button mt-3 text-sm disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Save size={16} />
          保存证据链
        </button>
      </section>

      <section>
        <h4 className="font-serif text-lg font-semibold">可继续展开</h4>
        <div className="mt-3 space-y-2">
          {nextSteps.map((step) => (
            <button
              key={step.edgeId}
              type="button"
              onClick={() => onAppendStep(step)}
              className="archive-card paper-grain w-full rounded-lg border border-goldline/20 bg-paper-50/70 px-3 py-2 text-left text-sm transition hover:border-goldline/45 hover:bg-goldline/5"
            >
              <span className="text-ink-900">{step.label}</span>
              <span className="ml-2 text-xs text-ink-500">
                {step.direction === 'outgoing' ? '下游' : '上游'} · {step.edgeType}
              </span>
            </button>
          ))}
          {!nextSteps.length ? <p className="text-sm text-ink-500">当前节点没有可继续展开的未使用连接。</p> : null}
        </div>
      </section>

      <section>
        <h4 className="font-serif text-lg font-semibold">分析札记</h4>
        <div className="mt-3 space-y-2">
          {savedNotes.map((note) => (
            <div
              key={note.id}
              className="archive-card paper-grain rounded-lg border border-goldline/20 bg-paper-50/70 p-3"
            >
              <button type="button" onClick={() => onOpenNote(note)} className="block w-full text-left">
                <strong className="text-sm text-ink-900">{note.title}</strong>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{note.summary}</p>
              </button>
              <button
                type="button"
                onClick={() => onDeleteNote(note.id)}
                className="mt-2 text-xs text-cinnabar hover:underline"
              >
                删除札记
              </button>
            </div>
          ))}
          {!savedNotes.length ? <p className="text-sm text-ink-500">还没有保存的分析札记。</p> : null}
        </div>
      </section>
    </div>
  )
}
