import { GitBranch, Network, ScrollText, UsersRound } from 'lucide-react'
import { useState } from 'react'
import DetailPanel from '../components/DetailPanel'
import EventTimeline from '../components/EventTimeline'
import GraphCanvas from '../components/GraphCanvas'
import { useProject } from '../hooks/useProject'
import type { DetailSelection } from '../types'

export default function ProjectDashboard() {
  const project = useProject()
  const [selection, setSelection] = useState<DetailSelection>(
    project.entities[0] ? { kind: 'entity', id: project.entities[0].id } : null,
  )

  const stats = [
    { label: '人物 / 角色', value: project.entities.length, icon: UsersRound },
    { label: '事件节点', value: project.events.length, icon: ScrollText },
    { label: '人物关系', value: project.entityRelations.length, icon: Network },
    { label: '事件连接', value: project.eventLinks.length, icon: GitBranch },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-goldline/25 bg-paper-50 p-6 shadow-soft">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm text-ink-500">Dashboard</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">{project.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">{project.subtitle}</p>
          </div>
          <p className="text-sm text-ink-500">
            最近编辑：{new Date(project.updatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.label} className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
              <Icon className="text-cinnabar" size={20} />
              <strong className="mt-4 block font-serif text-3xl">{item.value}</strong>
              <span className="text-sm text-ink-500">{item.label}</span>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">简化群像图</p>
                <h3 className="font-serif text-2xl font-semibold">人物与势力的关系预览</h3>
              </div>
              <Network className="text-jade" size={22} />
            </div>
            <div className="h-[430px]">
              <GraphCanvas project={project} mode="entities" compact onSelect={setSelection} />
            </div>
          </div>

          <div className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
            <p className="text-xs text-ink-500">关键时间线</p>
            <h3 className="mt-1 font-serif text-2xl font-semibold">事件推进</h3>
            <div className="mt-5">
              <EventTimeline
                events={project.events.slice(0, 5)}
                entities={project.entities}
                selectedId={selection?.kind === 'event' ? selection.id : undefined}
                onSelect={(id) => setSelection({ kind: 'event', id })}
                compact
              />
            </div>
          </div>
        </div>
        <DetailPanel project={project} selection={selection} />
      </section>
    </div>
  )
}
