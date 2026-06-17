export type EntityType = 'person' | 'character' | 'organization' | 'place' | 'other'

export type Entity = {
  id: string
  name: string
  type: EntityType
  identity?: string
  faction?: string
  motivation?: string
  description?: string
  avatarUrl?: string
  tags: string[]
}

export type StoryEvent = {
  id: string
  title: string
  timeLabel: string
  order: number
  location?: string
  description?: string
  relatedEntityIds: string[]
  tags: string[]
}

export type EntityRelation = {
  id: string
  sourceId: string
  targetId: string
  type: string
  description?: string
}

export type EventLink = {
  id: string
  sourceEventId: string
  targetEventId: string
  type: string
  description?: string
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
  id: string
  title: string
  subtitle: string
  category: ProjectCategory
  updatedAt: string
  entities: Entity[]
  events: StoryEvent[]
  entityRelations: EntityRelation[]
  eventLinks: EventLink[]
  libraryItems: LibraryItem[]
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
