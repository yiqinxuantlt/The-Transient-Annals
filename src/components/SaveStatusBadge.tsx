import clsx from 'clsx'
import { AlertCircle, CheckCircle2, CloudOff, Database, Loader2 } from 'lucide-react'
import type { ProjectSaveStatus } from '../store/projectHistory'

type Props = {
  status?: ProjectSaveStatus
}

export default function SaveStatusBadge({ status }: Props) {
  const state = status?.state ?? 'idle'
  const label =
    state === 'saving'
      ? '保存中'
      : state === 'saved'
        ? '已保存'
        : state === 'offline'
          ? '离线保存'
          : state === 'error'
            ? '保存失败'
            : '本地就绪'
  const Icon =
    state === 'saving'
      ? Loader2
      : state === 'saved'
        ? CheckCircle2
        : state === 'offline'
          ? CloudOff
          : state === 'error'
            ? AlertCircle
            : Database
  const title =
    status?.errorMessage ||
    (status?.lastSavedAt ? `上次保存：${new Date(status.lastSavedAt).toLocaleString()}` : undefined)

  return (
    <span
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-xs shadow-sm',
        state === 'saved' || state === 'idle'
          ? 'border-jade/25 bg-jade/10 text-jade'
          : state === 'saving'
            ? 'border-goldline/25 bg-goldline/10 text-ink-600'
            : 'border-cinnabar/20 bg-cinnabar/10 text-cinnabar',
      )}
      title={title}
    >
      <Icon size={15} className={state === 'saving' ? 'animate-spin' : undefined} />
      {label}
    </span>
  )
}
