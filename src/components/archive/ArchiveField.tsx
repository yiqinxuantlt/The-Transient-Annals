import type { ReactNode } from 'react'

type Props = {
  label: string
  value?: ReactNode
  wide?: boolean
}

export default function ArchiveField({ label, value, wide = false }: Props) {
  if (value === undefined || value === null || value === '') return null

  return (
    <div
      className={[
        'archive-field rounded-lg border border-ink-900/8 bg-paper-50/62 p-3',
        wide ? 'md:col-span-2' : '',
      ].join(' ')}
    >
      <p className="text-xs tracking-[0.12em] text-ink-500">{label}</p>
      <div className="mt-1 text-sm leading-6 text-ink-800">{value}</div>
    </div>
  )
}
