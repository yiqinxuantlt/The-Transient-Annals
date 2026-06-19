import { Building2, MapPin, UserRound } from 'lucide-react'
import type { Entity } from '../types'

type Props = {
  entity: Pick<Entity, 'name' | 'type' | 'avatarUrl'>
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
}

export default function AvatarBadge({ entity, size = 'md' }: Props) {
  const initial = entity.name.trim().slice(0, 1) || '录'

  return (
    <span
      className={[
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-goldline/35 bg-goldline/14 font-serif font-semibold text-ink-900 shadow-soft ring-1 ring-paper-50/60',
        sizeClass[size],
      ].join(' ')}
      aria-hidden="true"
    >
      {entity.avatarUrl ? (
        <img src={entity.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : entity.type === 'organization' ? (
        <Building2 size={size === 'lg' ? 24 : 18} className="text-jade" />
      ) : entity.type === 'place' ? (
        <MapPin size={size === 'lg' ? 24 : 18} className="text-cinnabar" />
      ) : entity.type === 'other' ? (
        <UserRound size={size === 'lg' ? 24 : 18} className="text-ink-500" />
      ) : (
        initial
      )}
    </span>
  )
}
