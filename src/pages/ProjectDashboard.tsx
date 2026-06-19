import { GitBranch, Network, ScrollText, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { ArchivePageHeader } from '../components/archive'
import DetailPanel from '../components/DetailPanel'
import EventTimeline from '../components/EventTimeline'
import GraphCanvas from '../components/GraphCanvas'
import { useProject } from '../hooks/useProject'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection } from '../types'

export default function ProjectDashboard() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const [selection, setSelection] = useState<DetailSelection>(
    project.entities[0] ? { kind: 'entity', id: project.entities[0].id } : null,
  )

  const stats = [
    { label: template.entityPlural, value: project.entities.length, icon: UsersRound },
    { label: template.eventPlural, value: project.events.length, icon: ScrollText },
    { label: template.relationLabel, value: project.entityRelations.length, icon: Network },
    { label: template.eventLinkLabel, value: project.eventLinks.length, icon: GitBranch },
  ]

  return (
    <div className="space-y-6">
      <ArchivePageHeader
        eyebrow={template.dashboard.eyebrow}
        title={project.title}
        description={project.subtitle}
        ribbonLabel="案卷总览"
        sealLabel="总览"
        actions={
          <p className="max-w-48 text-right text-sm leading-6 text-ink-500 sm:max-w-none">
            最近编辑：{new Date(project.updatedAt).toLocaleString('zh-CN')}
          </p>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.label}
              className="archive-card paper-grain rounded-lg border border-goldline/20 p-5 shadow-soft"
            >
              <div className="relative z-10">
                <Icon className="text-cinnabar" size={20} />
                <strong className="mt-4 block font-serif text-3xl text-ink-900">{item.value}</strong>
                <span className="text-sm text-ink-500">{item.label}</span>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="archive-card paper-grain rounded-lg border border-goldline/20 p-5 shadow-soft">
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">{template.pages.relationGraph.eyebrow}</p>
                <h3 className="font-serif text-2xl font-semibold">
                  {template.dashboard.relationPreviewTitle}
                </h3>
              </div>
              <Network className="text-jade" size={22} />
            </div>
            <div className="relative z-10 h-[430px]">
              <GraphCanvas project={project} mode="entities" compact onSelect={setSelection} />
            </div>
          </div>

          <div className="archive-card paper-grain rounded-lg border border-goldline/20 p-5 shadow-soft">
            <div className="relative z-10">
              <p className="text-xs text-ink-500">{template.pages.timeline.eyebrow}</p>
              <h3 className="mt-1 font-serif text-2xl font-semibold">
                {template.dashboard.timelinePreviewTitle}
              </h3>
            </div>
            <div className="relative z-10 mt-5">
              <EventTimeline
                events={project.events.slice(0, 5)}
                entities={project.entities}
                eventLinks={project.eventLinks}
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
