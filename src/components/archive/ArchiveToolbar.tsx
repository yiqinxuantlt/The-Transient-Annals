import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function ArchiveToolbar({ children }: Props) {
  return (
    <div className="archive-toolbar mt-5 flex flex-col gap-3 rounded-xl border border-goldline/15 bg-paper-50/60 p-3 shadow-sm backdrop-blur-sm md:flex-row md:items-center">
      {children}
    </div>
  )
}
