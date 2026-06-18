export type EntityType = 'person' | 'character' | 'organization' | 'place' | 'other'
export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted'
export type EdgeTone = 'cinnabar' | 'jade' | 'goldline' | 'ink'
export type EdgeType = 'straight' | 'smoothstep' | 'bezier' | 'step'
export type BackendStatus = 'checking' | 'online' | 'offline'
export type ProjectTemplateId = 'history' | 'fiction'

export type GraphNodePosition = {
  x: number
  y: number
}

export type EdgeVisualStyle = {
  lineStyle?: EdgeLineStyle
  tone?: EdgeTone
  edgeType?: EdgeType
  lineWidth?: number
  animated?: boolean
}

export type Entity = {
  id: string
  name: string
  type: EntityType
  identity?: string
  faction?: string
  motivation?: string
  birth?: string
  death?: string
  dynasty?: string
  roleArc?: string
  description?: string
  avatarUrl?: string
  tags: string[]
  /** 该实体在叙事中活跃/相关的起始年份（负数表示公元前） */
  startYear?: number
  /** 该实体在叙事中活跃/相关的结束年份（负数表示公元前） */
  endYear?: number
}

export type StoryEvent = {
  id: string
  title: string
  timeLabel: string
  order: number
  chapter?: string
  eventType?: string
  location?: string
  description?: string
  relatedEntityIds: string[]
  tags: string[]
  /** 事件发生的起始年份（负数表示公元前） */
  startYear?: number
  /** 事件发生的结束年份（负数表示公元前） */
  endYear?: number
}

export type EntityRelation = {
  id: string
  sourceId: string
  targetId: string
  type: string
  description?: string
  style?: EdgeVisualStyle
  /** 关系存在的起始年份（负数表示公元前） */
  startYear?: number
  /** 关系存在的结束年份（负数表示公元前） */
  endYear?: number
}

export type EventLink = {
  id: string
  sourceEventId: string
  targetEventId: string
  type: string
  description?: string
  style?: EdgeVisualStyle
  /** 关联的起始年份（负数表示公元前） */
  startYear?: number
  /** 关联的结束年份（负数表示公元前） */
  endYear?: number
}

export type LibraryItemKind = 'note' | 'quote' | 'source' | 'inspiration'

export type LibraryItem = {
  id: string
  title: string
  kind: LibraryItemKind
  content: string
  tags: string[]
  createdAt: string
}

export type ProjectCategory = 'history' | 'novel' | 'script' | 'worldbuilding' | 'research'
export type ThemeMode = 'light' | 'dark'

export type FushengProject = {
  schemaVersion: number
  id: string
  title: string
  subtitle: string
  templateId: ProjectTemplateId
  category: ProjectCategory
  updatedAt: string
  entities: Entity[]
  events: StoryEvent[]
  entityRelations: EntityRelation[]
  eventLinks: EventLink[]
  libraryItems: LibraryItem[]
  entityNodePositions: Record<string, GraphNodePosition>
  eventNodePositions: Record<string, GraphNodePosition>
}

export type EntityDraft = Omit<Entity, 'id'>
export type StoryEventDraft = Omit<StoryEvent, 'id'>
export type EntityRelationDraft = Omit<EntityRelation, 'id'>
export type EventLinkDraft = Omit<EventLink, 'id'>

export type DetailSelection =
  | { kind: 'entity'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'entityRelation'; id: string }
  | { kind: 'eventLink'; id: string }
  | { kind: 'libraryItem'; id: string }
  | null
