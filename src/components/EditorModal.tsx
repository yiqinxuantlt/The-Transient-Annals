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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 px-4 py-8">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-lg border border-goldline/25 bg-paper-50 shadow-archive"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-900/10 px-6 py-5">
          <div>
            <h2 id="editor-modal-title" className="font-serif text-2xl font-semibold">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
            aria-label="关闭弹窗"
          >
            <X size={19} />
          </button>
        </div>
        <div className="fsl-scrollbar max-h-[62dvh] overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex justify-end gap-3 border-t border-ink-900/10 bg-paper-100/55 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-ink-900/10 px-4 text-sm text-ink-700 transition hover:bg-paper-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="min-h-11 rounded-lg bg-ink-900 px-5 text-sm text-paper-50 shadow-soft transition hover:bg-ink-700"
          >
            {submitLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
