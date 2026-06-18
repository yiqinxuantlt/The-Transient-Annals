import { Pencil, Trash2 } from 'lucide-react'
import type { Entity } from '../types'
import AvatarBadge from './AvatarBadge'

const entityTypeLabel: Record<Entity['type'], string> = {
  person: '历史人物',
  character: '小说角色',
  organization: '组织',
  place: '地点',
  other: '其他',
}

type Props = {
  entity: Entity
  typeLabel?: string
  selected?: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function EntityCard({ entity, typeLabel, selected, onSelect, onEdit, onDelete }: Props) {
  return (
    <article
      className={[
        'rounded-lg border bg-paper-50 p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive',
        selected ? 'border-cinnabar/50 ring-2 ring-cinnabar/10' : 'border-ink-900/10',
      ].join(' ')}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-ink-500">{typeLabel || entityTypeLabel[entity.type]}</p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink-900">{entity.name}</h3>
          </div>
          <AvatarBadge entity={entity} />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-700">
          {entity.description || entity.identity || '尚未补充档案。'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {entity.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-goldline/12 px-3 py-1 text-xs text-ink-700">
              {tag}
            </span>
          ))}
        </div>
      </button>
      <div className="mt-5 flex justify-end gap-2 border-t border-ink-900/10 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
          aria-label={`编辑 ${entity.name}`}
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-cinnabar transition hover:bg-cinnabar/10"
          aria-label={`删除 ${entity.name}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </article>
  )
}
