type Props = {
  children: string
  className?: string
}

export default function SealBadge({ children, className = '' }: Props) {
  return (
    <span
      className={[
        'seal-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-cinnabar/55 font-serif text-xs font-semibold leading-4 text-cinnabar/80',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}
