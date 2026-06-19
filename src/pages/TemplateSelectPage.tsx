import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArchivePageHeader } from '../components/archive'
import TemplateCard from '../components/TemplateCard'
import { projectTemplates, templateOptions } from '../templates/projectTemplates'
import { useFushengluStore } from '../store/useFushengluStore'
import type { ProjectTemplateId } from '../types'

export default function TemplateSelectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const addProject = useFushengluStore((state) => state.addProject)
  const selectedTemplateId = searchParams.get('template') as ProjectTemplateId | null
  const template =
    selectedTemplateId === 'history' || selectedTemplateId === 'fiction'
      ? projectTemplates[selectedTemplateId]
      : null
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')

  const examples = useMemo(
    () =>
      template?.id === 'history'
        ? ['楚汉人物谱', '晚唐藩镇纪事', '明末辽东战局']
        : ['长安夜雨', '星海边境', '雾港来信'],
    [template?.id],
  )

  const submit = () => {
    if (!template) return

    const projectId = addProject({
      templateId: template.id,
      category: template.category,
      title: title.trim() || template.defaultTitle,
      subtitle: subtitle.trim() || template.defaultSubtitle,
    })
    navigate(`/projects/${projectId}/dashboard`)
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8">
        <ArchivePageHeader
          eyebrow="项目模板"
          title="选择项目模板"
          description="不同模板会影响导航名称、表单字段、默认标签、关系类型、事件连接类型和示例数据。"
          ribbonLabel="模板"
          sealLabel="选择"
          actions={
            <Link
              to="/projects"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/70 px-4 text-sm text-ink-700 transition hover:bg-paper-50"
            >
              <ArrowLeft size={16} />
              返回项目
            </Link>
          }
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {templateOptions.map((item) => (
            <TemplateCard key={item.id} template={item} />
          ))}
        </div>
      </div>
    )
  }

  const Icon = template.icon

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-8 sm:px-8">
      <Link
        to="/projects/new"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/70 px-4 text-sm text-ink-700 shadow-soft transition hover:bg-paper-50"
      >
        <ArrowLeft size={16} />
        重选模板
      </Link>

      <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="archive-card paper-grain rounded-lg border border-goldline/20 p-6 shadow-soft">
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-goldline/25 bg-goldline/10 text-cinnabar">
                <Icon size={22} />
              </span>
              <div>
                <p className="text-sm text-ink-500">{template.shortName}</p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-ink-900">
                  创建{template.name}项目
                </h1>
                <p className="mt-2 text-sm leading-7 text-ink-700">{template.description}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm text-ink-800">
                项目名称
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="archive-input w-full"
                  placeholder={template.defaultTitle}
                />
              </label>
              <label className="grid gap-2 text-sm text-ink-800">
                项目简介
                <textarea
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  className="archive-input min-h-28 w-full !py-3"
                  placeholder={template.defaultSubtitle}
                />
              </label>
              <button type="button" onClick={submit} className="archive-primary-button">
                <CheckCircle2 size={18} />
                创建并进入
              </button>
            </div>
          </div>
        </div>

        <aside className="archive-card paper-grain rounded-lg border border-goldline/20 p-5 shadow-soft">
          <div className="relative z-10">
            <h2 className="font-serif text-xl font-semibold text-ink-900">模板会预设</h2>
            <div className="mt-4 grid gap-3 text-sm text-ink-700">
              <p className="border-l-2 border-goldline/35 bg-paper-100/45 p-3">
                导航：{Object.values(template.nav).join('、')}
              </p>
              <p className="border-l-2 border-goldline/35 bg-paper-100/45 p-3">
                关系类型：{template.relationTypes.slice(0, 5).join('、')}
              </p>
              <p className="border-l-2 border-goldline/35 bg-paper-100/45 p-3">
                事件连接：{template.eventLinkTypes.slice(0, 5).join('、')}
              </p>
            </div>
            <div className="mt-5">
              <p className="text-xs text-ink-500">项目名示例</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setTitle(example)}
                    className="rounded-full border border-goldline/25 bg-goldline/12 px-3 py-1 text-xs text-ink-700 transition hover:bg-goldline/20"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
