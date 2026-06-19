import { Download, RotateCcw, Save, Upload, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { ArchivePageHeader } from '../components/archive'
import { useProject } from '../hooks/useProject'
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

export default function ProjectSettingsPage() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const updateProjectMeta = useFushengluStore((state) => state.updateProjectMeta)
  const replaceProjectData = useFushengluStore((state) => state.replaceProjectData)
  const restoreSampleData = useFushengluStore((state) => state.restoreSampleData)
  const clearProjectData = useFushengluStore((state) => state.clearProjectData)
  const [title, setTitle] = useState(project.title)
  const [subtitle, setSubtitle] = useState(project.subtitle)
  const [category, setCategory] = useState<ProjectCategory>(project.category)
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')

  const stats = [
    { label: '人物数量', value: project.entities.length },
    { label: '事件数量', value: project.events.length },
    { label: '人物关系数量', value: project.entityRelations.length },
    { label: '事件连接数量', value: project.eventLinks.length },
    { label: '藏卷数量', value: project.libraryItems.length },
  ]

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${project.title || 'fushenglu-project'}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importJson = () => {
    try {
      const parsed = JSON.parse(importText)
      replaceProjectData(project.id, parsed)
      setMessage('导入完成，当前项目数据已更新。')
    } catch {
      setMessage('导入失败，请检查 JSON 格式。')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <ArchivePageHeader
          eyebrow="Settings"
          title="项目设置"
          description="管理当前案卷的基础信息、本地 JSON 导入导出，以及恢复示例数据。"
          ribbonLabel="案卷校订"
          sealLabel="设置"
        />

        <section className="archive-card paper-grain rounded-lg border border-goldline/20 p-6 shadow-soft">
          <div className="relative z-10">
            <h3 className="font-serif text-2xl font-semibold text-ink-900">基础信息</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                项目名称
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="archive-input w-full"
                />
              </label>
              <label className="grid gap-2 text-sm">
                项目模板
                <input value={template.name} readOnly className="archive-input w-full text-ink-600" />
              </label>
              <label className="grid gap-2 text-sm">
                类型
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ProjectCategory)}
                  className="archive-input w-full"
                >
                  {Object.entries(categoryLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                简介
                <textarea
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  className="archive-input min-h-28 w-full !py-3"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                updateProjectMeta(project.id, { title, subtitle, category, templateId: project.templateId })
                setMessage('基础信息已保存。')
              }}
              className="archive-primary-button mt-5"
            >
              <Save size={17} />
              保存基础信息
            </button>
          </div>
        </section>

        <section className="archive-card paper-grain rounded-lg border border-goldline/20 p-6 shadow-soft">
          <div className="relative z-10">
            <h3 className="font-serif text-2xl font-semibold text-ink-900">导入 / 导出</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700">
              导出的 JSON 包含当前项目的人物、事件、关系、因果连接与藏卷。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={exportJson} className="archive-primary-button">
                <Download size={17} />
                导出 JSON
              </button>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/70 px-5 text-sm text-ink-700 shadow-soft transition hover:bg-paper-50">
                <Upload size={17} />
                选择 JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    file.text().then(setImportText)
                  }}
                />
              </label>
            </div>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="也可以把 JSON 粘贴到这里"
              className="archive-input mt-5 min-h-48 w-full !py-3 font-mono text-xs"
            />
            <button
              type="button"
              onClick={importJson}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/70 px-5 text-sm text-ink-800 transition hover:bg-paper-50"
            >
              <Upload size={17} />
              从 JSON 导入
            </button>
          </div>
        </section>
      </section>

      <aside className="space-y-5">
        <section className="archive-card paper-grain rounded-lg border border-goldline/20 p-5 shadow-soft">
          <div className="relative z-10">
            <h3 className="font-serif text-xl font-semibold text-ink-900">项目统计</h3>
            <div className="mt-4 grid gap-3">
              {stats.map((item) => (
                <div key={item.label} className="flex items-center justify-between border-l-2 border-goldline/35 bg-paper-100/45 px-4 py-3">
                  <span className="text-sm text-ink-600">{item.label}</span>
                  <strong className="font-serif text-xl text-ink-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="archive-card paper-grain rounded-lg border border-goldline/20 p-5 shadow-soft">
          <div className="relative z-10">
            <h3 className="font-serif text-xl font-semibold text-ink-900">数据操作</h3>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('确认恢复示例数据？当前项目内容会被示例覆盖。')) {
                    restoreSampleData(project.id)
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/70 px-4 text-sm text-ink-800 transition hover:bg-paper-50"
              >
                <Wand2 size={17} />
                恢复示例数据
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('确认清空当前项目的本地数据？')) {
                    clearProjectData(project.id)
                    setMessage('当前项目数据已清空。')
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cinnabar/30 bg-cinnabar/10 px-4 text-sm text-cinnabar transition hover:bg-cinnabar/15"
              >
                <RotateCcw size={17} />
                清空本地数据
              </button>
            </div>
            {message ? (
              <p className="mt-4 rounded-lg border border-jade/20 bg-jade/10 px-3 py-3 text-sm leading-6 text-jade">
                {message}
              </p>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  )
}
