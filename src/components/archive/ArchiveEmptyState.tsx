import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  action?: ReactNode
}

export default function ArchiveEmptyState({ title, description, action }: Props) {
  return (
    <div className="archive-empty rounded-lg border border-dashed border-goldline/35 bg-paper-100/55 p-6 text-center">
      <p className="font-serif text-xl font-semibold text-ink-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-600">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
