import { useCallback, useState } from 'react'
import { Archive, GitBranch, ScrollText, UsersRound } from 'lucide-react'
import DetailPanel from '../components/DetailPanel'
import EventTimeline from '../components/EventTimeline'
import { useProject } from '../hooks/useProject'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection } from '../types'

export default function TimelinePage() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const [selection, setSelection] = useState<DetailSelection>(
    project.events[0] ? { kind: 'event', id: project.events[0].id } : null,
  )
  const selectEvent = useCallback((id: string) => {
    setSelection((current) => {
      if (current?.kind === 'event' && current.id === id) return current
      return { kind: 'event', id }
    })
  }, [])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="timeline-workspace rounded-lg border border-goldline/25 bg-paper-50/82 p-4 shadow-archive sm:p-6">
        <div className="relative z-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs tracking-[0.24em] text-cinnabar">{template.pages.timeline.eyebrow}</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-ink-900">{template.pages.timeline.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700">
                {template.pages.timeline.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[480px]">
              {[
                { label: template.eventPlural, value: project.events.length, icon: ScrollText },
                { label: template.entityPlural, value: project.entities.length, icon: UsersRound },
                { label: '线索', value: project.eventLinks.length, icon: GitBranch },
                { label: template.libraryLabel, value: project.libraryItems.length, icon: Archive },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-ink-500">
                      <span className="text-xs">{item.label}</span>
                      <Icon size={15} />
                    </div>
                    <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-ink-900/10 bg-paper-100/35 px-3 py-5 sm:px-5">
            <EventTimeline
              events={project.events}
              entities={project.entities}
              eventLinks={project.eventLinks}
              selectedId={selection?.kind === 'event' ? selection.id : undefined}
              onSelect={selectEvent}
            />
          </div>
        </div>
      </section>
      <DetailPanel project={project} selection={selection} title={template.pages.timeline.detailTitle} sticky />
    </div>
  )
}
