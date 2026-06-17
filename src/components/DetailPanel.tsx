import { Archive, GitBranch, Link2, ScrollText } from 'lucide-react'
import type { DetailSelection, FushengProject } from '../types'
import AvatarBadge from './AvatarBadge'

type Props = {
  project: FushengProject
  selection: DetailSelection
  title?: string
}

const entityTypeLabel = {
  person: '历史人物',
  character: '小说角色',
  organization: '组织',
  place: '地点',
  other: '其他',
}

const libraryKindLabel = {
  note: '备注',
  quote: '摘录',
  source: '资料',
  inspiration: '灵感',
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-goldline/12 px-3 py-1 text-xs text-ink-700">
          {tag}
        </span>
      ))}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === '') return null

  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink-800">{value}</p>
    </div>
  )
}

export default function DetailPanel({ project, selection, title = '档案详情' }: Props) {
  let body = (
    <div className="rounded-lg border border-dashed border-ink-900/15 bg-paper-100/55 p-5 text-sm leading-6 text-ink-500">
      请选择人物、事件、关系或线索，右侧会显示完整档案。
    </div>
  )

  if (selection?.kind === 'entity') {
    const entity = project.entities.find((item) => item.id === selection.id)
    if (entity) {
      body = (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <AvatarBadge entity={entity} size="lg" />
            <div>
              <p className="text-xs text-ink-500">{entityTypeLabel[entity.type]}</p>
              <h3 className="font-serif text-2xl font-semibold">{entity.name}</h3>
            </div>
          </div>
          <Tags tags={entity.tags} />
          <div className="grid gap-4">
            <Field label="身份" value={entity.identity} />
            <Field label="阵营 / 所属势力" value={entity.faction} />
            <Field label="动机 / 目标" value={entity.motivation} />
            <Field label="简介" value={entity.description} />
          </div>
        </div>
      )
    }
  }

  if (selection?.kind === 'event') {
    const event = project.events.find((item) => item.id === selection.id)
    if (event) {
      const relatedNames = event.relatedEntityIds
        .map((id) => project.entities.find((entity) => entity.id === id)?.name)
        .filter(Boolean)
        .join('、')

      body = (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cinnabar/10 text-cinnabar">
              <ScrollText size={20} />
            </span>
            <div>
              <p className="text-xs text-ink-500">{event.timeLabel}</p>
              <h3 className="font-serif text-2xl font-semibold">{event.title}</h3>
            </div>
          </div>
          <Tags tags={event.tags} />
          <div className="grid gap-4">
            <Field label="顺序" value={event.order} />
            <Field label="地点" value={event.location} />
            <Field label="相关人物 / 角色" value={relatedNames} />
            <Field label="事件描述" value={event.description} />
          </div>
        </div>
      )
    }
  }

  if (selection?.kind === 'entityRelation') {
    const relation = project.entityRelations.find((item) => item.id === selection.id)
    if (relation) {
      const source = project.entities.find((item) => item.id === relation.sourceId)?.name
      const target = project.entities.find((item) => item.id === relation.targetId)?.name

      body = (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-goldline/15 text-goldline">
              <Link2 size={20} />
            </span>
            <div>
              <p className="text-xs text-ink-500">人物关系</p>
              <h3 className="font-serif text-2xl font-semibold">{relation.type}</h3>
            </div>
          </div>
          <Field label="关系两端" value={`${source || '未知'} → ${target || '未知'}`} />
          <Field label="说明" value={relation.description} />
        </div>
      )
    }
  }

  if (selection?.kind === 'eventLink') {
    const link = project.eventLinks.find((item) => item.id === selection.id)
    if (link) {
      const source = project.events.find((item) => item.id === link.sourceEventId)?.title
      const target = project.events.find((item) => item.id === link.targetEventId)?.title

      body = (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cinnabar/10 text-cinnabar">
              <GitBranch size={20} />
            </span>
            <div>
              <p className="text-xs text-ink-500">事件连接</p>
              <h3 className="font-serif text-2xl font-semibold">{link.type}</h3>
            </div>
          </div>
          <Field label="连接两端" value={`${source || '未知'} → ${target || '未知'}`} />
          <Field label="说明" value={link.description} />
        </div>
      )
    }
  }

  if (selection?.kind === 'libraryItem') {
    const item = project.libraryItems.find((entry) => entry.id === selection.id)
    if (item) {
      body = (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-jade/10 text-jade">
              <Archive size={20} />
            </span>
            <div>
              <p className="text-xs text-ink-500">{libraryKindLabel[item.kind]}</p>
              <h3 className="font-serif text-2xl font-semibold">{item.title}</h3>
            </div>
          </div>
          <Tags tags={item.tags} />
          <Field label="内容" value={item.content} />
        </div>
      )
    }
  }

  return (
    <aside className="rounded-lg border border-ink-900/10 bg-paper-50 p-5 shadow-soft">
      <p className="mb-5 text-xs text-ink-500">{title}</p>
      {body}
    </aside>
  )
}
