import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AvatarBadge from '../components/AvatarBadge'
import DetailPanel from '../components/DetailPanel'
import EditorModal from '../components/EditorModal'
import EntityCard from '../components/EntityCard'
import { ArchiveEmptyState, ArchivePageHeader, ArchiveToolbar } from '../components/archive'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { DetailSelection, Entity, EntityDraft, EntityType } from '../types'

const emptyEntity = (type: EntityType, tags: string[]): EntityDraft => ({
  name: '',
  type,
  identity: '',
  faction: '',
  motivation: '',
  birth: '',
  death: '',
  dynasty: '',
  roleArc: '',
  description: '',
  avatarUrl: '',
  tags,
})

const parseTags = (value: string) =>
  value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

const toDraft = (entity: Entity): EntityDraft => ({
  name: entity.name,
  type: entity.type,
  identity: entity.identity || '',
  faction: entity.faction || '',
  motivation: entity.motivation || '',
  birth: entity.birth || '',
  death: entity.death || '',
  dynasty: entity.dynasty || '',
  roleArc: entity.roleArc || '',
  description: entity.description || '',
  avatarUrl: entity.avatarUrl || '',
  tags: entity.tags,
})

export default function EntitiesPage() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addEntity = useFushengluStore((state) => state.addEntity)
  const updateEntity = useFushengluStore((state) => state.updateEntity)
  const deleteEntity = useFushengluStore((state) => state.deleteEntity)
  const addRelation = useFushengluStore((state) => state.addEntityRelation)
  const deleteRelation = useFushengluStore((state) => state.deleteEntityRelation)
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<DetailSelection>(
    project.entities[0] ? { kind: 'entity', id: project.entities[0].id } : null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EntityDraft>(() =>
    emptyEntity(template.defaultEntityType, template.defaultEntityTags),
  )
  const [tagText, setTagText] = useState('')
  const initialRelation = useMemo(
    () => ({
      sourceId: project.entities[0]?.id || '',
      targetId: project.entities[1]?.id || '',
      type: template.relationTypes[0] || '',
      description: '',
    }),
    [project.entities, template.relationTypes],
  )
  const [relationDraft, setRelationDraft] = useState(initialRelation)

  const filteredEntities = project.entities.filter((entity) => {
    const text = `${entity.name} ${entity.identity || ''} ${entity.faction || ''} ${entity.tags.join(' ')}`
    return text.toLowerCase().includes(query.toLowerCase())
  })

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyEntity(template.defaultEntityType, template.defaultEntityTags))
    setTagText(template.defaultEntityTags.join('，'))
    setModalOpen(true)
  }

  const openEdit = (entity: Entity) => {
    setEditingId(entity.id)
    setDraft(toDraft(entity))
    setTagText(entity.tags.join('，'))
    setModalOpen(true)
  }

  const saveEntity = () => {
    const nextDraft = {
      ...draft,
      name: draft.name.trim(),
      tags: parseTags(tagText),
    }
    if (!nextDraft.name) return

    if (editingId) {
      updateEntity(project.id, editingId, nextDraft)
      setSelection({ kind: 'entity', id: editingId })
    } else {
      const id = addEntity(project.id, nextDraft)
      setSelection({ kind: 'entity', id })
    }
    setModalOpen(false)
  }

  const uploadAvatar = (file?: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      window.alert('请选择图片文件。')
      return
    }

    if (file.size > 900 * 1024) {
      window.alert('头像图片建议小于 900KB，避免占用过多本地存储。')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setDraft((value) => ({
        ...value,
        avatarUrl: typeof reader.result === 'string' ? reader.result : '',
      }))
    }
    reader.readAsDataURL(file)
  }

  const submitRelation = () => {
    if (
      !relationDraft.sourceId ||
      !relationDraft.targetId ||
      !relationDraft.type.trim() ||
      relationDraft.sourceId === relationDraft.targetId
    ) {
      return
    }
    const id = addRelation(project.id, { ...relationDraft, type: relationDraft.type.trim() })
    setSelection({ kind: 'entityRelation', id })
    setRelationDraft(initialRelation)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <ArchivePageHeader
          eyebrow={template.pages.entities.eyebrow}
          title={template.pages.entities.title}
          description={template.pages.entities.description}
          ribbonLabel={template.id === 'history' ? '人物入卷' : '角色入卷'}
          sealLabel={template.id === 'history' ? '人物' : '角色'}
          actions={
            <button type="button" onClick={openCreate} className="archive-primary-button">
              <Plus size={18} />
              {template.pages.entities.addLabel}
            </button>
          }
        />

        <ArchiveToolbar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={template.pages.entities.search}
            className="archive-input w-full"
          />
        </ArchiveToolbar>

        {filteredEntities.length > 0 ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredEntities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                typeLabel={template.entityTypeLabels[entity.type]}
                selected={selection?.kind === 'entity' && selection.id === entity.id}
                onSelect={() => setSelection({ kind: 'entity', id: entity.id })}
                onEdit={() => openEdit(entity)}
                onDelete={() => {
                  if (window.confirm(`确认删除「${entity.name}」？相关人物关系也会移除。`)) {
                    deleteEntity(project.id, entity.id)
                    setSelection(null)
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <ArchiveEmptyState
              title="暂无匹配人物"
              description={
                query
                  ? '清空搜索条件后再查看完整人物谱。'
                  : '先新增人物，再补充身份、阵营和关系。'
              }
            />
          </div>
        )}
      </section>

      <div className="space-y-5">
        <DetailPanel project={project} selection={selection} />
        <section className="archive-card paper-grain rounded-lg border border-goldline/25 p-5 shadow-soft">
          <h3 className="font-serif text-xl font-semibold">关系快记</h3>
          <div className="mt-4 grid gap-3">
            <select
              value={relationDraft.sourceId}
              onChange={(event) =>
                setRelationDraft((value) => ({ ...value, sourceId: event.target.value }))
              }
              className="archive-input w-full text-sm"
            >
              {project.entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <select
              value={relationDraft.targetId}
              onChange={(event) =>
                setRelationDraft((value) => ({ ...value, targetId: event.target.value }))
              }
              className="archive-input w-full text-sm"
            >
              {project.entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <select
              value={relationDraft.type}
              onChange={(event) =>
                setRelationDraft((value) => ({ ...value, type: event.target.value }))
              }
              className="archive-input w-full text-sm"
            >
              {template.relationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <textarea
              value={relationDraft.description}
              onChange={(event) =>
                setRelationDraft((value) => ({ ...value, description: event.target.value }))
              }
              placeholder="关系说明"
              className="min-h-24 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={submitRelation}
              className="archive-primary-button text-sm"
            >
              添加关系
            </button>
          </div>
          <div className="mt-5 space-y-2">
            {project.entityRelations.map((relation) => (
              <div
                key={relation.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-goldline/15 bg-paper-100/65 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'entityRelation', id: relation.id })}
                  className="text-left text-ink-700"
                >
                  {relation.type}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRelation(project.id, relation.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-cinnabar hover:bg-cinnabar/10"
                  aria-label="删除关系"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <EditorModal
        open={modalOpen}
        title={editingId ? `编辑${template.entitySingular}档案` : `新增${template.entitySingular}档案`}
        submitLabel={editingId ? '保存修改' : `创建${template.entitySingular}`}
        onClose={() => setModalOpen(false)}
        onSubmit={saveEntity}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="mb-2 text-sm">人物头像</p>
            <div className="flex flex-col gap-4 rounded-lg border border-ink-900/10 bg-paper-100/55 p-4 sm:flex-row sm:items-center">
              <AvatarBadge
                entity={{
                  name: draft.name || '人物',
                  type: draft.type,
                  avatarUrl: draft.avatarUrl,
                }}
                size="lg"
              />
              <div className="flex flex-1 flex-wrap gap-3">
                <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/70 px-4 text-sm text-ink-700 transition hover:bg-paper-50">
                  <ImagePlus size={17} />
                  上传图片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => uploadAvatar(event.target.files?.[0])}
                  />
                </label>
                {draft.avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => setDraft((value) => ({ ...value, avatarUrl: '' }))}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cinnabar/25 bg-cinnabar/10 px-4 text-sm text-cinnabar transition hover:bg-cinnabar/15"
                  >
                    <X size={17} />
                    移除头像
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <label className="grid gap-2 text-sm">
            {template.entityFields.find((field) => field.key === 'name')?.label || '名称'}
            <input
              value={draft.name}
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm">
            {template.entityFields.find((field) => field.key === 'type')?.label || '类型'}
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft((value) => ({ ...value, type: event.target.value as EntityType }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            >
              {Object.entries(template.entityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {template.entityFields.some((field) => field.key === 'identity') ? (
            <label className="grid gap-2 text-sm">
              身份
              <input
                value={draft.identity}
                onChange={(event) => setDraft((value) => ({ ...value, identity: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              />
            </label>
          ) : null}
          {template.entityFields.some((field) => field.key === 'dynasty') ? (
            <label className="grid gap-2 text-sm">
              时代 / 朝代
              <input
                value={draft.dynasty}
                onChange={(event) => setDraft((value) => ({ ...value, dynasty: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              />
            </label>
          ) : null}
          {template.entityFields.some((field) => field.key === 'birth') ? (
            <label className="grid gap-2 text-sm">
              生年
              <input
                value={draft.birth}
                onChange={(event) => setDraft((value) => ({ ...value, birth: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              />
            </label>
          ) : null}
          {template.entityFields.some((field) => field.key === 'death') ? (
            <label className="grid gap-2 text-sm">
              卒年
              <input
                value={draft.death}
                onChange={(event) => setDraft((value) => ({ ...value, death: event.target.value }))}
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm">
            阵营 / 所属势力
            <input
              value={draft.faction}
              onChange={(event) => setDraft((value) => ({ ...value, faction: event.target.value }))}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            {template.id === 'history' ? '政治目标 / 主要诉求' : '动机 / 目标'}
            <input
              value={draft.motivation}
              onChange={(event) =>
                setDraft((value) => ({ ...value, motivation: event.target.value }))
              }
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
            />
          </label>
          {template.entityFields.some((field) => field.key === 'roleArc') ? (
            <label className="grid gap-2 text-sm md:col-span-2">
              人物弧光
              <input
                value={draft.roleArc}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, roleArc: event.target.value }))
                }
                className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              />
            </label>
          ) : null}
          <label className="grid gap-2 text-sm md:col-span-2">
            简介
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((value) => ({ ...value, description: event.target.value }))
              }
              className="min-h-28 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
            />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            标签
            <input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
              placeholder="用逗号分隔，例如：核心视角，隐瞒"
            />
          </label>
        </div>
      </EditorModal>
    </div>
  )
}
