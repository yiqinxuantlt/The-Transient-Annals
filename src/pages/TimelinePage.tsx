import { useCallback, useState } from 'react'
import { Archive, GitBranch, LayoutList, Rows3, ScrollText, UsersRound } from 'lucide-react'
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
  const [horizontal, setHorizontal] = useState(false)

  const selectEvent = useCallback((id: string) => {
    setSelection((current) => {
      if (current?.kind === 'event' && current.id === id) return current
      return { kind: 'event', id }
    })
  }, [])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="relative rounded-xl border border-ink-900/[0.06] bg-paper-50 p-5 shadow-[0_1px_3px_rgb(0_0_0/0.04)] dark:border-ink-900/[0.12] dark:shadow-none sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.6875rem] font-medium tracking-[0.2em] text-ink-500/70 uppercase">
              {template.pages.timeline.eyebrow}
            </p>
            <h2 className="mt-1.5 font-serif text-2xl font-semibold text-ink-900">
              {template.pages.timeline.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-600">
              {template.pages.timeline.description}
            </p>
          </div>
          <div className="flex items-center gap-2 lg:mt-1">
            <span className="text-xs text-ink-500/60">视图</span>
            <div className="inline-flex rounded-lg border border-ink-900/[0.08] bg-paper-100/50 p-0.5 dark:border-ink-900/[0.15]">
              <button
                type="button"
                onClick={() => setHorizontal(false)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  !horizontal
                    ? 'bg-paper-50 text-ink-900 shadow-sm ring-1 ring-ink-900/[0.06] dark:bg-paper-100'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
                aria-pressed={!horizontal}
              >
                <LayoutList size={13} />
                竖版
              </button>
              <button
                type="button"
                onClick={() => setHorizontal(true)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  horizontal
                    ? 'bg-paper-50 text-ink-900 shadow-sm ring-1 ring-ink-900/[0.06] dark:bg-paper-100'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
                aria-pressed={horizontal}
              >
                <Rows3 size={13} />
                横版
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-900/[0.05] pt-4">
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
                className="inline-flex items-center gap-2 rounded-md bg-paper-100/50 px-3 py-1.5 dark:bg-paper-100/30"
              >
                <Icon size={13} className="text-ink-500/50" />
                <span className="text-xs text-ink-500">{item.label}</span>
                <span className="text-sm font-semibold text-ink-900">{item.value}</span>
              </div>
            )
          })}
        </div>

        {/* Timeline area */}
        <div className="mt-5 rounded-lg border border-ink-900/[0.05] bg-paper-100/30 px-4 py-5 dark:border-ink-900/[0.1] dark:bg-paper-100/10 sm:px-6">
          <EventTimeline
            events={project.events}
            entities={project.entities}
            eventLinks={project.eventLinks}
            selectedId={selection?.kind === 'event' ? selection.id : undefined}
            onSelect={selectEvent}
            horizontal={horizontal}
          />
        </div>
      </section>
      <DetailPanel project={project} selection={selection} title={template.pages.timeline.detailTitle} sticky />
    </div>
  )
}
