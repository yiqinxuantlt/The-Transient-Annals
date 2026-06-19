import { ArrowRight, BookMarked, FolderKanban, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArchivePageHeader } from '../components/archive'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { ProjectCategory } from '../types'

const categoryLabel: Record<ProjectCategory, string> = {
  history: '历史专题',
  novel: '小说作品',
  script: '剧本项目',
  worldbuilding: '世界观设定',
  research: '研究资料',
}

export default function ProjectsPage() {
  const projects = useFushengluStore((state) => state.projects)

  return (
    <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8">
      <ArchivePageHeader
        eyebrow="Projects"
        title="图谱项目"
        description="每个项目都是独立案卷。新建时可选择历史或小说模板，字段、导航和示例数据会随模板变化。"
        ribbonLabel="案卷库"
        sealLabel="项目"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/help"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/80 px-5 text-ink-800 shadow-soft transition hover:bg-paper-50"
            >
              <BookMarked size={18} />
              使用手册
            </Link>
            <Link to="/projects/new" className="archive-primary-button">
              <Plus size={18} />
              新建图谱
            </Link>
          </div>
        }
      />

      <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const template = getProjectTemplate(project.templateId, project.category)

          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}/dashboard`}
              className="archive-card paper-grain group rounded-lg border border-goldline/20 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive"
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-jade/20 bg-jade/10 text-jade">
                    <FolderKanban size={22} />
                  </span>
                  <span className="rounded-full border border-goldline/25 bg-goldline/12 px-3 py-1 text-xs text-ink-700">
                    {template.shortName} · {categoryLabel[project.category]}
                  </span>
                </div>
                <h2 className="mt-6 font-serif text-2xl font-semibold text-ink-900">{project.title}</h2>
                <p className="mt-3 min-h-[3.5rem] text-sm leading-7 text-ink-700">{project.subtitle}</p>
                <div className="mt-6 grid grid-cols-2 gap-2 text-center text-xs text-ink-500 sm:grid-cols-4">
                  <span className="border-l-2 border-goldline/30 bg-paper-100/45 px-2 py-3">
                    <strong className="block text-base text-ink-900">{project.entities.length}</strong>
                    {template.entityPlural}
                  </span>
                  <span className="border-l-2 border-goldline/30 bg-paper-100/45 px-2 py-3">
                    <strong className="block text-base text-ink-900">{project.events.length}</strong>
                    {template.eventPlural}
                  </span>
                  <span className="border-l-2 border-goldline/30 bg-paper-100/45 px-2 py-3">
                    <strong className="block text-base text-ink-900">{project.entityRelations.length}</strong>
                    关系
                  </span>
                  <span className="border-l-2 border-goldline/30 bg-paper-100/45 px-2 py-3">
                    <strong className="block text-base text-ink-900">{project.eventLinks.length}</strong>
                    线索
                  </span>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm text-cinnabar">
                  打开案卷
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
