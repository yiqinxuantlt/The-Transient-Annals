import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProjectTemplate } from '../templates/projectTemplates'

type Props = {
  template: ProjectTemplate
}

export default function TemplateCard({ template }: Props) {
  const Icon = template.icon

  return (
    <article className="group rounded-lg border border-ink-900/10 bg-paper-50/86 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-goldline/25 bg-goldline/10 text-cinnabar">
          <Icon size={22} />
        </span>
        <span className="rounded-full bg-jade/10 px-3 py-1 text-xs text-ink-700">
          {template.projectKindLabel}
        </span>
      </div>
      <h2 className="mt-6 font-serif text-2xl font-semibold text-ink-900">{template.name}</h2>
      <p className="mt-3 min-h-[4.5rem] text-sm leading-7 text-ink-700">{template.summary}</p>
      <p className="mt-4 text-xs leading-6 text-ink-500">{template.description}</p>
      <Link
        to={`/projects/new?template=${template.id}`}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink-900 px-5 text-sm text-paper-50 shadow-soft transition hover:bg-ink-700"
      >
        使用此模板
        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </Link>
    </article>
  )
}
