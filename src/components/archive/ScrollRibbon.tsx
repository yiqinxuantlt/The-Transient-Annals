type Props = {
  label: string
  className?: string
}

export default function ScrollRibbon({ label, className = '' }: Props) {
  return (
    <span
      className={[
        'archive-ribbon hidden min-h-28 w-16 shrink-0 items-center justify-center rounded-sm border border-cinnabar/25 bg-cinnabar/8 px-2 py-4 font-serif text-sm text-cinnabar/80 md:flex',
        className,
      ].join(' ')}
    >
      <span className="[writing-mode:vertical-rl] tracking-[0.22em]">{label}</span>
    </span>
  )
}
