import { ArrowLeft, BookOpenText } from 'lucide-react'
import { Link, useMatch } from 'react-router-dom'
import { helpSections } from '../content/helpContent'

export default function HelpPage() {
  const inProjectWorkspace = Boolean(useMatch('/projects/:projectId/help'))
  const backTo = inProjectWorkspace ? '..' : '/projects'
  const backLabel = inProjectWorkspace ? '返回项目工作区' : '返回图谱项目'

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-8 sm:px-8">
      <Link
        to={backTo}
        relative={inProjectWorkspace ? 'path' : undefined}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/75 px-4 text-sm text-ink-700 shadow-soft transition hover:bg-paper-50"
      >
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

      <header className="mt-7 rounded-lg border border-goldline/25 bg-paper-50/82 p-6 shadow-soft sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-goldline/25 bg-goldline/10 text-cinnabar">
            <BookOpenText size={22} />
          </span>
          <div>
            <p className="text-sm text-ink-500">Manual</p>
            <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-900">使用手册</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">
              这份手册概括浮生录的适用场景、工作区结构、常用操作、数据保存方式，以及本地开发时最常见的排查入口。
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-5">
        {helpSections.map((section) => (
          <section
            key={section.id}
            className="rounded-lg border border-ink-900/10 bg-paper-50/82 p-6 shadow-soft sm:p-7"
          >
            <p className="text-xs tracking-[0.18em] text-ink-500">{section.eyebrow}</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-ink-700">{section.description}</p>
            <ul className="mt-4 grid gap-3">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-lg bg-paper-100/65 px-4 py-3 text-sm leading-7 text-ink-700"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
