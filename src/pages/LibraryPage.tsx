import { Archive, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ArchiveEmptyState, ArchivePageHeader, ArchiveTag } from '../components/archive'
import DetailPanel from '../components/DetailPanel'
import EditorModal from '../components/EditorModal'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection, LibraryItemKind } from '../types'

const kindLabel: Record<LibraryItemKind, string> = {
  note: '备注',
  quote: '摘录',
  source: '资料',
  inspiration: '灵感',
}

const parseTags = (value: string) =>
  value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

const emptyDraft = {
  title: '',
  kind: 'note' as LibraryItemKind,
  content: '',
  tags: [],
}

export default function LibraryPage() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addLibraryItem = useFushengluStore((state) => state.addLibraryItem)
  const deleteLibraryItem = useFushengluStore((state) => state.deleteLibraryItem)
  const [selection, setSelection] = useState<DetailSelection>(
    project.libraryItems[0] ? { kind: 'libraryItem', id: project.libraryItems[0].id } : null,
  )
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [tagText, setTagText] = useState('')

  const submit = () => {
    if (!draft.title.trim()) return
    const id = addLibraryItem(project.id, {
      ...draft,
      title: draft.title.trim(),
      content: draft.content.trim(),
      tags: parseTags(tagText),
    })
    setSelection({ kind: 'libraryItem', id })
    setDraft(emptyDraft)
    setTagText('')
    setOpen(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <ArchivePageHeader
          eyebrow={template.pages.library.eyebrow}
          title={template.pages.library.title}
          description={template.pages.library.description}
          ribbonLabel={template.id === 'history' ? '史料入库' : '藏卷入库'}
          sealLabel="藏卷"
          actions={
            <button type="button" onClick={() => setOpen(true)} className="archive-primary-button">
              <Plus size={18} />
              {template.pages.library.addLabel}
            </button>
          }
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {project.libraryItems.map((item) => (
            <article
              key={item.id}
              className={[
                'archive-card paper-grain rounded-lg border p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive',
                selection?.kind === 'libraryItem' && selection.id === item.id
                  ? 'border-cinnabar/50 ring-2 ring-cinnabar/10'
                  : 'border-goldline/20',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => setSelection({ kind: 'libraryItem', id: item.id })}
                className="relative z-10 block w-full text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-ink-500">{kindLabel[item.kind]}</p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-ink-900">{item.title}</h3>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-jade/20 bg-jade/10 text-jade">
                    <Archive size={18} />
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-700">{item.content}</p>
                {item.tags.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <ArchiveTag key={tag}>{tag}</ArchiveTag>
                    ))}
                  </div>
                ) : null}
              </button>
              <div className="relative z-10 mt-5 flex justify-end border-t border-goldline/15 pt-4">
                <button
                  type="button"
                  onClick={() => deleteLibraryItem(project.id, item.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-cinnabar transition hover:bg-cinnabar/10"
                  aria-label={`删除 ${item.title}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {project.libraryItems.length === 0 ? (
          <div className="mt-5">
            <ArchiveEmptyState
              title="暂无藏卷"
              description="先收入一条资料、摘录、备注或灵感片段，再与人物和事件交叉查阅。"
              action={
                <button type="button" onClick={() => setOpen(true)} className="archive-primary-button">
                  <Plus size={18} />
                  {template.pages.library.addLabel}
                </button>
              }
            />
          </div>
        ) : null}
      </section>

      <DetailPanel project={project} selection={selection} />

      <EditorModal
        open={open}
        title={template.pages.library.addLabel}
        submitLabel="保存"
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm">
            标题
            <input
              value={draft.title}
              onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
              className="archive-input w-full"
            />
          </label>
          <label className="grid gap-2 text-sm">
            类型
            <select
              value={draft.kind}
              onChange={(event) =>
                setDraft((value) => ({ ...value, kind: event.target.value as LibraryItemKind }))
              }
              className="archive-input w-full"
            >
              {Object.entries(kindLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            内容
            <textarea
              value={draft.content}
              onChange={(event) =>
                setDraft((value) => ({ ...value, content: event.target.value }))
              }
              className="archive-input min-h-36 w-full !py-3"
            />
          </label>
          <label className="grid gap-2 text-sm">
            标签
            <input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              className="archive-input w-full"
              placeholder="用逗号分隔"
            />
          </label>
        </div>
      </EditorModal>
    </div>
  )
}
