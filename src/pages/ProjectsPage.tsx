import { ArrowRight, FolderKanban, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EditorModal from '../components/EditorModal'
import { useFushengluStore } from '../store/useFushengluStore'
import type { ProjectCategory } from '../types'

const categoryLabel: Record<ProjectCategory, string> = {
  history: '历史专题',
  novel: '小说作品',
  script: '剧本项目',
  worldbuilding: '世界观设定',
  research: '研究资料',
}

const emptyDraft = {
  title: '',
  subtitle: '',
  category: 'novel' as ProjectCategory,
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const projects = useFushengluStore((state) => state.projects)
  const addProject = useFushengluStore((state) => state.addProject)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)

  const createProject = () => {
    const projectId = addProject({
      title: draft.title.trim() || '未命名图谱',
      subtitle: draft.subtitle.trim() || '一份新的叙事案卷。',
      category: draft.category,
    })
    setDraft(emptyDraft)
    setOpen(false)
    navigate(`/projects/${projectId}/dashboard`)
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-ink-500">Projects</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">图谱项目</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700">
            每个项目都是独立案卷，人物、事件、关系和资料会分别保存在本地。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 text-paper-50 shadow-soft transition hover:bg-ink-700"
        >
          <Plus size={18} />
          新建图谱
        </button>
      </div>

      <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}/dashboard`}
            className="group rounded-lg border border-ink-900/10 bg-paper-50/82 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-jade/10 text-jade">
                <FolderKanban size={22} />
              </span>
              <span className="rounded-full bg-goldline/12 px-3 py-1 text-xs text-ink-700">
                {categoryLabel[project.category]}
              </span>
            </div>
            <h2 className="mt-6 font-serif text-2xl font-semibold">{project.title}</h2>
            <p className="mt-3 min-h-[3.5rem] text-sm leading-7 text-ink-700">{project.subtitle}</p>
            <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs text-ink-500">
              <span className="rounded-lg bg-paper-100/65 px-2 py-3">
                <strong className="block text-base text-ink-900">{project.entities.length}</strong>
                人物
              </span>
              <span className="rounded-lg bg-paper-100/65 px-2 py-3">
                <strong className="block text-base text-ink-900">{project.events.length}</strong>
                事件
              </span>
              <span className="rounded-lg bg-paper-100/65 px-2 py-3">
                <strong className="block text-base text-ink-900">{project.entityRelations.length}</strong>
                关系
              </span>
              <span className="rounded-lg bg-paper-100/65 px-2 py-3">
                <strong className="block text-base text-ink-900">{project.eventLinks.length}</strong>
                线索
              </span>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-sm text-cinnabar">
              打开案卷
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      <EditorModal
        open={open}
        title="新建图谱项目"
        description="为历史专题、小说作品、剧本或世界观建立一份独立案卷。"
        submitLabel="创建并进入"
        onClose={() => setOpen(false)}
        onSubmit={createProject}
      >
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm">
            项目名称
            <input
              value={draft.title}
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              placeholder="例如：长安夜雨"
            />
          </label>
          <label className="grid gap-2 text-sm">
            类型
            <select
              value={draft.category}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  category: event.target.value as ProjectCategory,
                }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            >
              {Object.entries(categoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            简介
            <textarea
              value={draft.subtitle}
              onChange={(event) => setDraft((value) => ({ ...value, subtitle: event.target.value }))}
              className="min-h-28 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
              placeholder="这个图谱要整理什么叙事脉络？"
            />
          </label>
        </div>
      </EditorModal>
    </div>
  )
}
