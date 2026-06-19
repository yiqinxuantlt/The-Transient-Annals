import clsx from 'clsx'
import { BookOpen, CircleCheck, Database, Search } from 'lucide-react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import ProjectSidebar from '../components/ProjectSidebar'
import ThemeToggle from '../components/ThemeToggle'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'

export default function ProjectLayout() {
  const { projectId } = useParams()
  const project = useFushengluStore((state) =>
    state.projects.find((item) => item.id === projectId),
  )
  const backendStatus = useFushengluStore((state) => state.backendStatus)

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  const template = getProjectTemplate(project.templateId, project.category)

  return (
    <div className="archive-shell min-h-dvh text-ink-900">
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <ProjectSidebar projectId={project.id} templateId={template.id} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-goldline/20 bg-paper-50/90 px-4 py-4 shadow-[0_12px_35px_rgb(var(--shadow-soft)/0.08)] backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-goldline/35 bg-paper-50/75 text-jade shadow-soft">
                  <BookOpen size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs tracking-[0.18em] text-ink-500">当前案卷</p>
                  <h1 className="truncate font-serif text-2xl font-semibold">{project.title}</h1>
                </div>
              </div>
              <div className="grid w-full gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto] xl:w-auto xl:grid-cols-[320px_auto_auto_auto]">
                <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3 text-sm text-ink-500 shadow-sm transition focus-within:border-goldline/45 focus-within:bg-paper-50">
                  <Search size={17} />
                  <input
                    className="w-full bg-transparent text-ink-700 outline-none placeholder:text-ink-500/70"
                    placeholder={template.searchPlaceholder}
                    aria-label={template.searchPlaceholder}
                  />
                </label>
                <span
                  className={clsx(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs shadow-sm',
                    backendStatus === 'online'
                      ? 'border-jade/25 bg-jade/10 text-jade'
                      : backendStatus === 'checking'
                        ? 'border-goldline/25 bg-goldline/10 text-ink-600'
                        : 'border-cinnabar/20 bg-cinnabar/10 text-cinnabar',
                  )}
                >
                  {backendStatus === 'online' ? <CircleCheck size={15} /> : <Database size={15} />}
                  {backendStatus === 'online'
                    ? '案卷库已连接'
                    : backendStatus === 'checking'
                      ? '连接案卷库'
                      : '本地模式'}
                </span>
                <div className="hidden min-h-11 items-center gap-2 rounded-lg border border-goldline/25 bg-goldline/10 px-3 text-xs text-ink-700 shadow-sm sm:inline-flex">
                  <span className="font-serif text-lg text-ink-900">{project.events.length}</span>
                  <span>{template.eventPlural}</span>
                  <span className="text-ink-500">/</span>
                  <span className="font-serif text-lg text-ink-900">{project.eventLinks.length}</span>
                  <span>线索</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
            <Outlet context={project} />
          </main>
        </div>
      </div>
    </div>
  )
}
