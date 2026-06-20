import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchProject } from '../lib/projectSearch'
import type { FushengProject } from '../types'

type Props = {
  project: FushengProject
  open: boolean
  onClose: () => void
}

function highlightText(text: string, query: string): ReactNode {
  const trimmed = query.trim()
  if (!trimmed) return text

  const index = text.toLocaleLowerCase('zh-CN').indexOf(trimmed.toLocaleLowerCase('zh-CN'))
  if (index < 0) return text

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-goldline/25 px-0.5 text-ink-900">
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </>
  )
}

export default function GlobalSearchDialog({ project, open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const result = useMemo(() => searchProject(project, query), [project, query])

  if (!open) return null

  const closeDialog = () => {
    onClose()
    setQuery('')
  }

  const openResult = (path: string) => {
    navigate(path)
    closeDialog()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDialog()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/25 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="全局搜索"
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-lg border border-goldline/25 bg-paper-50 shadow-archive">
        <div className="flex min-h-14 items-center gap-3 border-b border-goldline/15 px-4">
          <Search size={18} className="text-ink-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-12 flex-1 bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-500"
            placeholder="搜索当前项目"
            aria-label="搜索当前项目"
          />
          <button
            type="button"
            onClick={closeDialog}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
            aria-label="关闭搜索"
          >
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[62dvh] overflow-y-auto p-3">
          {!query.trim() ? (
            <p className="px-2 py-8 text-center text-sm text-ink-500">
              输入关键词搜索实体、事件、关系、资料和笔记。
            </p>
          ) : result.total === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-ink-500">没有匹配结果。</p>
          ) : (
            <div className="space-y-4">
              {result.groups
                .filter((group) => group.results.length)
                .map((group) => (
                  <section key={group.kind}>
                    <h3 className="px-2 text-xs font-semibold text-ink-500">{group.label}</h3>
                    <div className="mt-1 space-y-1">
                      {group.results.map((item) => (
                        <button
                          key={`${group.kind}-${item.id}`}
                          type="button"
                          onClick={() => openResult(item.path)}
                          className="block w-full rounded-lg px-3 py-2 text-left transition hover:bg-goldline/10"
                        >
                          <span className="block text-sm font-semibold text-ink-900">
                            {highlightText(item.title, query)}
                          </span>
                          {item.context ? (
                            <span className="mt-0.5 line-clamp-1 block text-xs text-ink-500">
                              {highlightText(item.context, query)}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
