import type { ReactNode } from 'react'
import SealBadge from './SealBadge'
import ScrollRibbon from './ScrollRibbon'

type Props = {
  eyebrow: string
  title: string
  description: string
  ribbonLabel: string
  sealLabel?: string
  actions?: ReactNode
}

export default function ArchivePageHeader({
  eyebrow,
  title,
  description,
  ribbonLabel,
  sealLabel = '浮生',
  actions,
}: Props) {
  return (
    <section className="archive-page-header archive-card paper-grain rounded-lg border border-goldline/25 p-5 shadow-soft md:p-6">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <ScrollRibbon label={ribbonLabel} />
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-cinnabar">{eyebrow}</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink-900">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actions}
          <SealBadge>{sealLabel}</SealBadge>
        </div>
      </div>
    </section>
  )
}
