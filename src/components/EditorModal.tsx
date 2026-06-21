import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  description?: string
  submitLabel?: string
  children: ReactNode
  onClose: () => void
  onSubmit: () => void
}

export default function EditorModal({
  open,
  title,
  description,
  submitLabel = '保存',
  children,
  onClose,
  onSubmit,
}: Props) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-goldline/30 bg-paper-50 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-900/8 px-6 py-4">
          <div>
            <h2 id="editor-modal-title" className="font-serif text-xl font-semibold tracking-wide">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-700"
            aria-label="关闭弹窗"
          >
            <X size={18} />
          </button>
        </div>
        <div className="fsl-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-ink-900/8 bg-paper-100/55 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50 px-4 text-sm text-ink-600 transition hover:border-ink-900/20 hover:bg-paper-100 hover:text-ink-800"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="min-h-10 rounded-lg bg-ink-900 px-5 text-sm text-paper-50 shadow-soft transition hover:bg-ink-700 active:scale-[0.98]"
          >
            {submitLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
