import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import AvatarBadge from '../components/AvatarBadge'
import AvatarCropper from '../components/AvatarCropper'
import DetailPanel from '../components/DetailPanel'
import EditorModal from '../components/EditorModal'
import EntityCard from '../components/EntityCard'
import { ArchiveEmptyState, ArchivePageHeader, ArchiveToolbar } from '../components/archive'
import { useProject } from '../hooks/useProject'
import {
  formatEntityOptionLabel,
  formatEntitySecondaryLabel,
  hasDuplicateEntityName,
} from '../lib/recordDisplay'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'
import type { AvatarCrop, DetailSelection, Entity, EntityDraft, EntityType } from '../types'

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
  avatarCrop: undefined,
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
  avatarCrop: entity.avatarCrop,
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
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState('')
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
    setShowCropper(false)
    setTempImageUrl('')
    setModalOpen(true)
  }

  const openEdit = (entity: Entity) => {
    setEditingId(entity.id)
    setDraft(toDraft(entity))
    setTagText(entity.tags.join('，'))
    setShowCropper(false)
    setTempImageUrl('')
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
    setShowCropper(false)
    setTempImageUrl('')
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
      const imageUrl = typeof reader.result === 'string' ? reader.result : ''
      setTempImageUrl(imageUrl)
      setShowCropper(true)
      // 先设置图片URL，裁剪完成后再更新draft
      setDraft((value) => ({
        ...value,
        avatarUrl: imageUrl,
        avatarCrop: undefined,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleCropChange = (crop: AvatarCrop) => {
    setDraft((value) => ({
      ...value,
      avatarCrop: crop,
    }))
  }

  const removeAvatar = () => {
    setDraft((value) => ({
      ...value,
      avatarUrl: '',
      avatarCrop: undefined,
    }))
    setShowCropper(false)
    setTempImageUrl('')
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
                disambiguationLabel={
                  hasDuplicateEntityName(entity, project.entities)
                    ? formatEntitySecondaryLabel(entity, template.entityTypeLabels[entity.type])
                    : undefined
                }
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
                  {formatEntityOptionLabel(entity, project.entities, template.entityTypeLabels[entity.type])}
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
                  {formatEntityOptionLabel(entity, project.entities, template.entityTypeLabels[entity.type])}
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
        onClose={() => {
          setModalOpen(false)
          setShowCropper(false)
          setTempImageUrl('')
        }}
        onSubmit={saveEntity}
      >
        <div className="grid gap-5 md:grid-cols-2">
          {/* 头像区域 */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-700">人物头像</label>
            <div className="flex flex-col gap-4 rounded-xl border border-ink-900/8 bg-paper-100/50 p-4 sm:flex-row sm:items-center">
              <AvatarBadge
                entity={{
                  name: draft.name || '人物',
                  type: draft.type,
                  avatarUrl: draft.avatarUrl,
                  avatarCrop: draft.avatarCrop,
                }}
                size="lg"
              />
              <div className="flex flex-1 flex-wrap gap-3">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/80 px-4 text-sm text-ink-600 shadow-sm transition hover:border-goldline/40 hover:bg-paper-50 hover:text-ink-800 hover:shadow-soft">
                  <ImagePlus size={16} />
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
                    onClick={removeAvatar}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cinnabar/20 bg-cinnabar/8 px-4 text-sm text-cinnabar transition hover:bg-cinnabar/12"
                  >
                    <X size={16} />
                    移除头像
                  </button>
                ) : null}
              </div>
            </div>

            {showCropper && tempImageUrl && (
              <div className="mt-4 rounded-xl border border-goldline/20 bg-paper-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-700">调整头像显示区域</p>
                  <button
                    type="button"
                    onClick={() => setShowCropper(false)}
                    className="rounded-md px-2 py-1 text-xs text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-700"
                  >
                    完成裁剪
                  </button>
                </div>
                <AvatarCropper
                  imageUrl={tempImageUrl}
                  initialCrop={draft.avatarCrop}
                  onCropChange={handleCropChange}
                />
              </div>
            )}
          </div>

          {/* 基本信息 */}
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-ink-700">
              {template.entityFields.find((field) => field.key === 'name')?.label || '名称'}
            </span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
              placeholder="请输入名称"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-ink-700">
              {template.entityFields.find((field) => field.key === 'type')?.label || '类型'}
            </span>
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft((value) => ({ ...value, type: event.target.value as EntityType }))
              }
              className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
            >
              {Object.entries(template.entityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {template.entityFields.some((field) => field.key === 'identity') ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">身份</span>
              <input
                value={draft.identity}
                onChange={(event) => setDraft((value) => ({ ...value, identity: event.target.value }))}
                className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
                placeholder="例如：西楚霸王"
              />
            </label>
          ) : null}

          {template.entityFields.some((field) => field.key === 'dynasty') ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">时代 / 朝代</span>
              <input
                value={draft.dynasty}
                onChange={(event) => setDraft((value) => ({ ...value, dynasty: event.target.value }))}
                className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
                placeholder="例如：秦末汉初"
              />
            </label>
          ) : null}

          {template.entityFields.some((field) => field.key === 'birth') ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">生年</span>
              <input
                value={draft.birth}
                onChange={(event) => setDraft((value) => ({ ...value, birth: event.target.value }))}
                className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
                placeholder="例如：前232年"
              />
            </label>
          ) : null}

          {template.entityFields.some((field) => field.key === 'death') ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">卒年</span>
              <input
                value={draft.death}
                onChange={(event) => setDraft((value) => ({ ...value, death: event.target.value }))}
                className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
                placeholder="例如：前202年"
              />
            </label>
          ) : null}

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-ink-700">阵营 / 所属势力</span>
            <input
              value={draft.faction}
              onChange={(event) => setDraft((value) => ({ ...value, faction: event.target.value }))}
              className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
              placeholder="例如：楚军"
            />
          </label>

          {/* 全宽字段 */}
          <label className="grid gap-1.5 text-sm md:col-span-2">
            <span className="font-medium text-ink-700">
              {template.id === 'history' ? '政治目标 / 主要诉求' : '动机 / 目标'}
            </span>
            <input
              value={draft.motivation}
              onChange={(event) =>
                setDraft((value) => ({ ...value, motivation: event.target.value }))
              }
              className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
              placeholder="简述其核心目标或诉求"
            />
          </label>

          {template.entityFields.some((field) => field.key === 'roleArc') ? (
            <label className="grid gap-1.5 text-sm md:col-span-2">
              <span className="font-medium text-ink-700">人物弧光</span>
              <input
                value={draft.roleArc}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, roleArc: event.target.value }))
                }
                className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
                placeholder="描述人物在故事中的转变轨迹"
              />
            </label>
          ) : null}

          <label className="grid gap-1.5 text-sm md:col-span-2">
            <span className="font-medium text-ink-700">简介</span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((value) => ({ ...value, description: event.target.value }))
              }
              rows={4}
              className="min-h-[88px] resize-y rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 py-2.5 text-sm leading-relaxed text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
              placeholder="补充人物背景、性格特点或关键经历"
            />
          </label>

          <label className="grid gap-1.5 text-sm md:col-span-2">
            <span className="font-medium text-ink-700">标签</span>
            <input
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
              className="min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/80 px-3.5 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-goldline/60 focus:bg-paper-50 focus:focus:shadow-[0_0_0_3px_rgb(var(--goldline)/0.08)]"
              placeholder="用逗号分隔，例如：核心视角，隐瞒"
            />
          </label>
        </div>
      </EditorModal>
    </div>
  )
}
