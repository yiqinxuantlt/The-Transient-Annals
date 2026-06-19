import { ArrowLeft } from 'lucide-react'
import { Link, useMatch } from 'react-router-dom'
import { ArchivePageHeader } from '../components/archive'
import { helpSections } from '../content/helpContent'

export default function HelpPage() {
  const inProjectWorkspace = Boolean(useMatch('/projects/:projectId/help'))
  const backTo = inProjectWorkspace ? '..' : '/projects'
  const backLabel = inProjectWorkspace ? '返回项目工作区' : '返回图谱项目'

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-8 sm:px-8">
      <ArchivePageHeader
        eyebrow="Manual"
        title="使用手册"
        description="这份手册概括浮生录的适用场景、工作区结构、常用操作、数据保存方式，以及本地开发时最常见的排查入口。"
        ribbonLabel="手册"
        sealLabel="手册"
        actions={
          <Link
            to={backTo}
            relative={inProjectWorkspace ? 'path' : undefined}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/75 px-4 text-sm text-ink-700 shadow-soft transition hover:bg-paper-50"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
        }
      />

      <div className="mt-8 grid gap-5">
        {helpSections.map((section, index) => (
          <section
            key={section.id}
            className="archive-card paper-grain rounded-lg border border-goldline/20 p-6 shadow-soft sm:p-7"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.18em] text-cinnabar">{section.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-900">{section.title}</h2>
                </div>
                <span className="shrink-0 font-serif text-3xl text-goldline/45">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink-700">{section.description}</p>
              <ul className="mt-5 grid gap-3">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="border-l-2 border-goldline/35 bg-paper-100/45 px-4 py-3 text-sm leading-7 text-ink-700"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
