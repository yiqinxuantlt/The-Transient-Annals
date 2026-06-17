import clsx from 'clsx'
import { BookOpen, Search } from 'lucide-react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import ProjectSidebar from '../components/ProjectSidebar'
import ThemeToggle from '../components/ThemeToggle'
import { useFushengluStore } from '../store/useFushengluStore'

export default function ProjectLayout() {
  const { projectId } = useParams()
  const project = useFushengluStore((state) =>
    state.projects.find((item) => item.id === projectId),
  )
  const backendStatus = useFushengluStore((state) => state.backendStatus)

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="min-h-dvh bg-paper-100/70 text-ink-900">
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <ProjectSidebar projectId={project.id} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-ink-900/10 bg-paper-50/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-goldline/35 bg-paper-50/70 text-jade shadow-soft">
                  <BookOpen size={22} />
                </div>
                <div>
                  <p className="text-xs text-ink-500">当前案卷</p>
                  <h1 className="font-serif text-2xl font-semibold">{project.title}</h1>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <span
                  className={clsx(
                    'inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-xs shadow-sm',
                    backendStatus === 'online'
                      ? 'border-jade/25 bg-jade/10 text-jade'
                      : backendStatus === 'checking'
                        ? 'border-goldline/25 bg-goldline/10 text-ink-600'
                        : 'border-cinnabar/20 bg-cinnabar/10 text-cinnabar',
                  )}
                >
                  {backendStatus === 'online'
                    ? '案卷库已连接'
                    : backendStatus === 'checking'
                      ? '连接案卷库'
                      : '本地模式'}
                </span>
                <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm text-ink-500 shadow-sm lg:w-80">
                  <Search size={17} />
                  <input
                    className="w-full bg-transparent text-ink-700 outline-none placeholder:text-ink-500/70"
                    placeholder="搜索人物、事件、伏笔"
                    aria-label="搜索"
                  />
                </label>
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
