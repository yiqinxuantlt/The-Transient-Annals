import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function ArchiveToolbar({ children }: Props) {
  return (
    <div className="archive-toolbar mt-5 flex flex-col gap-3 rounded-lg border border-goldline/20 bg-paper-100/48 p-3 shadow-sm md:flex-row md:items-center">
      {children}
    </div>
  )
}
