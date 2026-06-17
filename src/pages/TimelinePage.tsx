import { useState } from 'react'
import DetailPanel from '../components/DetailPanel'
import EventTimeline from '../components/EventTimeline'
import { useProject } from '../hooks/useProject'
import type { DetailSelection } from '../types'

export default function TimelinePage() {
  const project = useProject()
  const [selection, setSelection] = useState<DetailSelection>(
    project.events[0] ? { kind: 'event', id: project.events[0].id } : null,
  )

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-ink-900/10 bg-paper-50 p-6 shadow-soft">
        <p className="text-sm text-ink-500">Timeline</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">流年轴</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700">
          按顺序整理历史时间、章节节点或幕次推进。每个事件保持独立卡片，便于阅读与回看。
        </p>
        <div className="mt-8">
          <EventTimeline
            events={project.events}
            entities={project.entities}
            selectedId={selection?.kind === 'event' ? selection.id : undefined}
            onSelect={(id) => setSelection({ kind: 'event', id })}
          />
        </div>
      </section>
      <DetailPanel project={project} selection={selection} />
    </div>
  )
}
