import { Archive, Crosshair, GitBranch, Link2, ScrollText } from 'lucide-react'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection, EntityRelation, FushengProject } from '../types'
import AvatarBadge from './AvatarBadge'

type Props = {
  project: FushengProject
  selection: DetailSelection
  title?: string
  sticky?: boolean
  onRelationClick?: (relation: EntityRelation) => void
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
        <span
          key={tag}
          className="inline-flex min-h-7 items-center rounded-full bg-goldline/12 px-3 text-xs text-ink-700"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === '') return null

  return (
    <div className="rounded-lg border border-ink-900/8 bg-paper-50/55 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink-800">{value}</p>
    </div>
  )
}

export default function DetailPanel({
  project,
  selection,
  title = '案前档案',
  sticky = false,
  onRelationClick,
}: Props) {
  const template = getProjectTemplate(project.templateId, project.category)

  let body = (
    <div className="rounded-lg border border-dashed border-ink-900/15 bg-paper-100/55 p-5 text-sm leading-6 text-ink-500">
      请选择人物、事件、关系或线索，右侧会显示完整档案。
    </div>
  )

  if (selection?.kind === 'entity') {
    const entity = project.entities.find((item) => item.id === selection.id)
    if (entity) {
      const relatedRelations = project.entityRelations.filter(
        (relation) => relation.sourceId === entity.id || relation.targetId === entity.id,
      )

      body = (
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <AvatarBadge entity={entity} size="lg" />
            <div>
              <p className="text-xs text-ink-500">{template.entityTypeLabels[entity.type]}</p>
              <h3 className="font-serif text-2xl font-semibold">{entity.name}</h3>
            </div>
          </div>
          <Tags tags={entity.tags} />
          <div className="grid gap-3">
            <Field label="身份" value={entity.identity} />
            <Field label="时代 / 朝代" value={entity.dynasty} />
            <Field label="生年" value={entity.birth} />
            <Field label="卒年" value={entity.death} />
            <Field label="阵营 / 所属势力" value={entity.faction} />
            <Field
              label={template.id === 'history' ? '政治目标 / 主要诉求' : '动机 / 目标'}
              value={entity.motivation}
            />
            <Field label="人物弧光" value={entity.roleArc} />
            <Field label="简介" value={entity.description} />
          </div>
          {relatedRelations.length > 0 && onRelationClick ? (
            <div>
              <p className="mb-2 text-xs tracking-wide text-ink-500">关联关系</p>
              <div className="space-y-1.5">
                {relatedRelations.map((relation) => {
                  const otherName =
                    relation.sourceId === entity.id
                      ? project.entities.find((item) => item.id === relation.targetId)?.name
                      : project.entities.find((item) => item.id === relation.sourceId)?.name

                  return (
                    <button
                      key={relation.id}
                      type="button"
                      onClick={() => onRelationClick(relation)}
                      className="flex w-full items-center gap-2 rounded-lg border border-ink-900/8 bg-paper-50/55 px-3 py-2 text-left text-sm transition hover:border-goldline/40 hover:bg-goldline/5"
                    >
                      <Crosshair size={13} className="shrink-0 text-ink-400" />
                      <span className="text-ink-800">{relation.type}</span>
                      <span className="ml-auto text-xs text-ink-500">→ {otherName || '未知'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
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
          <div className="grid gap-3">
            <Field label="顺序" value={event.order} />
            <Field label="章节 / 幕次" value={event.chapter} />
            <Field label={template.id === 'history' ? '事件类型' : '情节类型'} value={event.eventType} />
            <Field label="地点" value={event.location} />
            <Field label={`相关${template.entityPlural}`} value={relatedNames} />
            <Field
              label={template.id === 'history' ? '事件经过与影响' : '事件描述'}
              value={event.description}
            />
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
              <p className="text-xs text-ink-500">{template.relationLabel}</p>
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
              <p className="text-xs text-ink-500">{template.eventLinkLabel}</p>
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
    <aside
      className={[
        'archive-card paper-grain rounded-lg border border-goldline/25 p-5 shadow-archive',
        sticky ? 'xl:sticky xl:top-28 xl:max-h-[calc(100dvh-8rem)] xl:overflow-auto' : '',
      ].join(' ')}
    >
      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-ink-900/10 pb-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-cinnabar">CASE FILE</p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-ink-900">{title}</h2>
          </div>
          <div className="seal-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-sm font-serif text-xs font-semibold leading-4">
            已归档
          </div>
        </div>
        {body}
      </div>
    </aside>
  )
}
