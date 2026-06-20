import { useEffect, useState } from 'react'
import { BookOpen, Redo2, Search, Undo2 } from 'lucide-react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import GlobalSearchDialog from '../components/GlobalSearchDialog'
import ProjectSidebar from '../components/ProjectSidebar'
import SaveStatusBadge from '../components/SaveStatusBadge'
import ThemeToggle from '../components/ThemeToggle'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'

export default function ProjectLayout() {
  const { projectId } = useParams()
  const project = useFushengluStore((state) =>
    state.projects.find((item) => item.id === projectId),
  )
  const saveStatus = useFushengluStore((state) =>
    projectId ? state.saveStatusByProjectId[projectId] : undefined,
  )
  const undoProject = useFushengluStore((state) => state.undoProject)
  const redoProject = useFushengluStore((state) => state.redoProject)
  const canUndo = useFushengluStore((state) =>
    projectId ? state.canUndoProject(projectId) : false,
  )
  const canRedo = useFushengluStore((state) =>
    projectId ? state.canRedoProject(projectId) : false,
  )
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        Boolean(target.closest('[contenteditable="true"]'))
      )
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return

      if (key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (isEditableTarget(event.target)) return

      if (key === 'z' && projectId) {
        event.preventDefault()
        if (event.shiftKey) {
          redoProject(projectId)
        } else {
          undoProject(projectId)
        }
      }

      if (key === 'y' && projectId) {
        event.preventDefault()
        redoProject(projectId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [projectId, redoProject, undoProject])

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
              <div className="grid w-full gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto_auto] xl:w-auto xl:grid-cols-[320px_auto_auto_auto_auto]">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3 text-left text-sm text-ink-500 shadow-sm transition hover:border-goldline/45 hover:bg-paper-50"
                >
                  <Search size={17} />
                  <span className="min-w-0 flex-1 truncate">{template.searchPlaceholder}</span>
                  <kbd className="hidden rounded border border-ink-900/10 bg-paper-100 px-1.5 py-0.5 text-[10px] text-ink-500 sm:inline">
                    Ctrl K
                  </kbd>
                </button>
                <div className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-goldline/25 bg-paper-50/70 px-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => undoProject(project.id)}
                    disabled={!canUndo}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="撤销"
                  >
                    <Undo2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => redoProject(project.id)}
                    disabled={!canRedo}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-600 transition hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="重做"
                  >
                    <Redo2 size={17} />
                  </button>
                </div>
                <SaveStatusBadge status={saveStatus} />
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
      <GlobalSearchDialog project={project} open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
