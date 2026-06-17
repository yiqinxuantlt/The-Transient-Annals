import { Archive, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import DetailPanel from '../components/DetailPanel'
import EditorModal from '../components/EditorModal'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
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
        <div className="rounded-lg border border-ink-900/10 bg-paper-50 p-6 shadow-soft">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-ink-500">Library</p>
              <h2 className="mt-1 font-serif text-3xl font-semibold">藏卷</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-700">
                存放资料、引用、备注、灵感片段和原文摘录，作为图谱之外的创作与研究底稿。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 text-paper-50 shadow-soft transition hover:bg-ink-700"
            >
              <Plus size={18} />
              新增藏卷
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {project.libraryItems.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive"
            >
              <button
                type="button"
                onClick={() => setSelection({ kind: 'libraryItem', id: item.id })}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-ink-500">{kindLabel[item.kind]}</p>
                    <h3 className="mt-1 font-serif text-xl font-semibold">{item.title}</h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-jade/10 text-jade">
                    <Archive size={18} />
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-700">{item.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-goldline/12 px-3 py-1 text-xs text-ink-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
              <div className="mt-5 flex justify-end border-t border-ink-900/10 pt-4">
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
      </section>

      <DetailPanel project={project} selection={selection} />

      <EditorModal
        open={open}
        title="新增藏卷"
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
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm">
            类型
            <select
              value={draft.kind}
              onChange={(event) =>
                setDraft((value) => ({ ...value, kind: event.target.value as LibraryItemKind }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
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
              className="min-h-36 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm">
            标签
            <input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              placeholder="用逗号分隔"
            />
          </label>
        </div>
      </EditorModal>
    </div>
  )
}
