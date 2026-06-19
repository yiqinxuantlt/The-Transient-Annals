import clsx from 'clsx'

type Props = {
  children: string
  tone?: 'gold' | 'jade' | 'cinnabar' | 'ink'
}

const toneClass = {
  gold: 'border-goldline/25 bg-goldline/12 text-ink-700',
  jade: 'border-jade/25 bg-jade/10 text-jade',
  cinnabar: 'border-cinnabar/25 bg-cinnabar/10 text-cinnabar',
  ink: 'border-ink-900/10 bg-ink-900/5 text-ink-700',
}

export default function ArchiveTag({ children, tone = 'gold' }: Props) {
  return (
    <span className={clsx('inline-flex min-h-7 items-center rounded-full border px-3 text-xs', toneClass[tone])}>
      {children}
    </span>
  )
}
