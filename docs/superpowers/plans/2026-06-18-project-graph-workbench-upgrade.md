# Project Graph Workbench Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the project-internal relation graph and event graph pages into a shared three-pane graph research workbench with filters, focus, evidence-chain notes, connection composing, and immersive canvas mode.

**Architecture:** Add durable `analysisNotes` to project data, keep session-only graph controls inside `GraphWorkbench`, extract reusable graph filtering/reasoning utilities, and migrate `RelationGraphPage` and `EventGraphPage` onto one shared workbench shell while preserving the current React Flow canvas, store sync, and node-position persistence.

**Tech Stack:** React 19, TypeScript, Vite, React Router, React Flow, Zustand, Express, Zod, Tailwind CSS, Vitest, Testing Library

---

## File Map

- Modify: `src/types/index.ts`
  - Add `AnalysisNote`, `AnalysisNoteDraft`, and `analysisNotes` on `FushengProject`.
- Modify: `src/shared/projectNormalization.ts`
  - Normalize `analysisNotes`, remove analysis note references to missing nodes and edges, and bump the shared schema version from 4 to 5.
- Modify: `server/src/schema.ts`
  - Add Zod schema support for `analysisNotes`.
- Modify: `server/src/schema.test.ts`
  - Assert backend normalization preserves valid analysis notes and removes invalid references.
- Modify: `server/data/fushenglu-db.json`
  - Update checked-in projects to schema version 5 and add `analysisNotes: []`.
- Modify: `src/store/useFushengluStore.ts`
  - Add analysis note actions and include imported analysis notes.
- Modify: `src/store/useFushengluStore.test.ts`
  - Test normalization and store actions.
- Create: `src/lib/graphWorkbench.ts`
  - Shared graph adapter, filter, focus, and evidence-chain utility functions.
- Create: `src/lib/graphWorkbench.test.ts`
  - Utility regression tests for relation graph and event graph behavior.
- Create: `src/components/GraphToolbar.tsx`
  - Shared graph action toolbar.
- Create: `src/components/GraphFilterPanel.tsx`
  - Shared left filter/layer panel.
- Create: `src/components/GraphInspectorPanel.tsx`
  - Shared right tab panel.
- Create: `src/components/GraphEvidencePanel.tsx`
  - Evidence chain creation and saved note controls.
- Create: `src/components/GraphConnectionComposer.tsx`
  - Shared relation/event-link composer.
- Create: `src/components/GraphWorkbench.tsx`
  - Three-pane workbench and orchestration state.
- Create: `src/components/GraphFilterPanel.test.tsx`
  - Filter panel smoke and clear tests.
- Create: `src/components/GraphEvidencePanel.test.tsx`
  - Evidence chain save and clear tests.
- Modify: `src/components/GraphCanvas.tsx`
  - Accept visible ids, active chain ids, empty-state copy, layout save status, and a fit-view request key.
- Modify: `src/components/DetailPanel.tsx`
  - Add a compact/chrome variant for use inside inspector tabs.
- Modify: `src/index.css`
  - Add shared graph toolbar and workbench panel utility classes.
- Modify: `src/pages/RelationGraphPage.tsx`
  - Replace page-local graph shell with `GraphWorkbench` in entity mode.
- Modify: `src/pages/EventGraphPage.tsx`
  - Replace page-local graph shell with `GraphWorkbench` in event mode.
Before implementation, run:

```bash
git status --short
```

Expected: there may be unrelated uncommitted changes already present. Do not revert them and do not stage unrelated files in any task commit.

## Task 1: Add Durable Analysis Note Data Support

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/shared/projectNormalization.ts`
- Modify: `server/src/schema.ts`
- Modify: `server/src/schema.test.ts`
- Modify: `src/store/useFushengluStore.test.ts`
- Modify: `server/data/fushenglu-db.json`

- [ ] **Step 1: Write failing normalization and schema tests**

Append these assertions to `src/store/useFushengluStore.test.ts`:

```ts
it('normalizes missing and invalid analysis notes for local persistence', () => {
  const project = createFictionSampleProject('project-analysis-normalization')
  const entity = project.entities[0]
  const relation = project.entityRelations[0]

  if (!entity || !relation) throw new Error('Expected sample graph data')

  const normalized = normalizeProjectForStorage({
    ...project,
    analysisNotes: [
      {
        id: 'note-valid',
        title: '有效推理链',
        graphMode: 'entities',
        startId: entity.id,
        targetId: entity.id,
        nodeIds: [entity.id, 'missing-node'],
        edgeIds: [relation.id, 'missing-edge'],
        summary: '保留有效节点和关系，移除缺失引用。',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
      },
    ],
  })

  expect(normalized.analysisNotes).toEqual([
    {
      id: 'note-valid',
      title: '有效推理链',
      graphMode: 'entities',
      startId: entity.id,
      targetId: entity.id,
      nodeIds: [entity.id],
      edgeIds: [relation.id],
      summary: '保留有效节点和关系，移除缺失引用。',
      createdAt: '2026-06-18T00:00:00.000Z',
      updatedAt: '2026-06-18T00:00:00.000Z',
    },
  ])

  expect(normalizeProjectForStorage({ ...project, analysisNotes: undefined }).analysisNotes).toEqual([])
})
```

Append this test to `server/src/schema.test.ts`:

```ts
it('accepts analysis notes and removes missing graph references', () => {
  const payload = {
    ...baseProject,
    analysisNotes: [
      {
        id: 'note-schema-valid',
        title: 'Schema Note',
        graphMode: 'entities',
        startId: 'entity-1',
        targetId: 'missing-entity',
        nodeIds: ['entity-1', 'missing-entity'],
        edgeIds: ['relation-valid', 'relation-orphan'],
        summary: 'Schema keeps valid note references.',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-18T00:00:00.000Z',
      },
    ],
  }

  const project = normalizeProject(payload)

  expect(project.analysisNotes).toEqual([
    {
      id: 'note-schema-valid',
      title: 'Schema Note',
      graphMode: 'entities',
      startId: 'entity-1',
      targetId: undefined,
      nodeIds: ['entity-1'],
      edgeIds: ['relation-valid'],
      summary: 'Schema keeps valid note references.',
      createdAt: '2026-06-18T00:00:00.000Z',
      updatedAt: '2026-06-18T00:00:00.000Z',
    },
  ])
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/store/useFushengluStore.test.ts server/src/schema.test.ts
```

Expected: TypeScript or test failures mention missing `analysisNotes` and `AnalysisNote` types.

- [ ] **Step 3: Add analysis note types**

Modify `src/types/index.ts` by adding these definitions after `LibraryItem`:

```ts
export type GraphMode = 'entities' | 'events'

export type AnalysisNote = {
  id: string
  title: string
  graphMode: GraphMode
  startId?: string
  targetId?: string
  nodeIds: string[]
  edgeIds: string[]
  summary: string
  createdAt: string
  updatedAt: string
}

export type AnalysisNoteDraft = Omit<AnalysisNote, 'id' | 'createdAt' | 'updatedAt'>
```

Add `analysisNotes` to `FushengProject`:

```ts
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
  analysisNotes: AnalysisNote[]
  entityNodePositions: Record<string, GraphNodePosition>
  eventNodePositions: Record<string, GraphNodePosition>
}
```

- [ ] **Step 4: Normalize analysis notes**

Modify the import in `src/shared/projectNormalization.ts`:

```ts
import type {
  AnalysisNote,
  EdgeVisualStyle,
  FushengProject,
  GraphNodePosition,
  ProjectCategory,
  ProjectTemplateId,
} from '../types'
```

Bump the schema version:

```ts
export const FUSHENGLU_SCHEMA_VERSION = 5
```

Add this helper before `enforceProjectIntegrity`:

```ts
function normalizeAnalysisNotes(
  notes: AnalysisNote[] | undefined,
  entityIds: Set<string>,
  eventIds: Set<string>,
  relationIds: Set<string>,
  eventLinkIds: Set<string>,
): AnalysisNote[] {
  if (!Array.isArray(notes)) return []

  return notes
    .filter((note) => note.id && note.title && (note.graphMode === 'entities' || note.graphMode === 'events'))
    .map((note) => {
      const validNodeIds = note.graphMode === 'entities' ? entityIds : eventIds
      const validEdgeIds = note.graphMode === 'entities' ? relationIds : eventLinkIds
      const startId = note.startId && validNodeIds.has(note.startId) ? note.startId : undefined
      const targetId = note.targetId && validNodeIds.has(note.targetId) ? note.targetId : undefined

      return {
        id: note.id,
        title: note.title,
        graphMode: note.graphMode,
        startId,
        targetId,
        nodeIds: [...(note.nodeIds || [])].filter((nodeId) => validNodeIds.has(nodeId)),
        edgeIds: [...(note.edgeIds || [])].filter((edgeId) => validEdgeIds.has(edgeId)),
        summary: note.summary || '',
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
      }
    })
}
```

Update the start of `enforceProjectIntegrity`:

```ts
export function enforceProjectIntegrity(project: FushengProject): FushengProject {
  const entityIds = new Set(project.entities.map((entity) => entity.id))
  const eventIds = new Set(project.events.map((event) => event.id))
  const relationIds = new Set(project.entityRelations.map((relation) => relation.id))
  const eventLinkIds = new Set(project.eventLinks.map((link) => link.id))

  return {
    ...project,
    analysisNotes: normalizeAnalysisNotes(
      project.analysisNotes,
      entityIds,
      eventIds,
      relationIds,
      eventLinkIds,
    ),
```

Add this field inside `normalizeProjectForStorage` before node positions:

```ts
analysisNotes: Array.isArray(project.analysisNotes)
  ? project.analysisNotes.map((note) => ({
      ...note,
      nodeIds: [...(note.nodeIds || [])],
      edgeIds: [...(note.edgeIds || [])],
    }))
  : [],
```

- [ ] **Step 5: Add backend schema support**

In `server/src/schema.ts`, add this after `libraryItemSchema`:

```ts
const analysisNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  graphMode: z.enum(['entities', 'events']),
  startId: z.string().optional(),
  targetId: z.string().optional(),
  nodeIds: z.array(z.string()).default([]),
  edgeIds: z.array(z.string()).default([]),
  summary: z.string().default(''),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
})
```

Add this field to `projectSchema`:

```ts
analysisNotes: z.array(analysisNoteSchema).default([]),
```

- [ ] **Step 6: Update checked-in database shape**

Modify `server/data/fushenglu-db.json`:

```json
{
  "schemaVersion": 5,
  "projects": [
    {
      "schemaVersion": 5,
      "analysisNotes": []
    }
  ]
}
```

Apply the same `schemaVersion: 5` and `analysisNotes: []` fields to every checked-in project object while preserving each project's existing ids, titles, records, positions, relations, event links, and library items.

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm run test -- src/store/useFushengluStore.test.ts server/src/schema.test.ts
```

Expected: both suites pass.

- [ ] **Step 8: Commit data model support**

Run:

```bash
git status --short
git add src/types/index.ts src/shared/projectNormalization.ts server/src/schema.ts src/store/useFushengluStore.test.ts server/src/schema.test.ts server/data/fushenglu-db.json
git commit -m "feat: add analysis note data model"
```

## Task 2: Add Store Actions for Analysis Notes

**Files:**
- Modify: `src/store/useFushengluStore.ts`
- Modify: `src/store/useFushengluStore.test.ts`

- [ ] **Step 1: Add failing store action tests**

Append these imports to `src/store/useFushengluStore.test.ts`:

```ts
import { useFushengluStore } from './useFushengluStore'
```

Append these tests:

```ts
describe('analysis note store actions', () => {
  it('adds updates and deletes analysis notes', () => {
    const project = createFictionSampleProject('project-note-actions')
    useFushengluStore.setState({ projects: [project], backendStatus: 'offline' })

    const noteId = useFushengluStore.getState().addAnalysisNote(project.id, {
      title: '从主角到信件',
      graphMode: 'events',
      startId: project.events[0]?.id,
      targetId: project.events[1]?.id,
      nodeIds: project.events.slice(0, 2).map((event) => event.id),
      edgeIds: project.eventLinks.slice(0, 1).map((link) => link.id),
      summary: '神秘信件触发后续事件。',
    })

    const added = useFushengluStore
      .getState()
      .projects[0]?.analysisNotes.find((note) => note.id === noteId)

    expect(added?.title).toBe('从主角到信件')
    expect(added?.createdAt).toMatch(/T/)
    expect(added?.updatedAt).toMatch(/T/)

    useFushengluStore.getState().updateAnalysisNote(project.id, noteId, {
      title: '更新后的推理链',
      graphMode: 'events',
      startId: project.events[0]?.id,
      targetId: project.events[1]?.id,
      nodeIds: [project.events[0]?.id || ''].filter(Boolean),
      edgeIds: [],
      summary: '更新摘要。',
    })

    expect(useFushengluStore.getState().projects[0]?.analysisNotes[0]?.title).toBe('更新后的推理链')

    useFushengluStore.getState().deleteAnalysisNote(project.id, noteId)

    expect(useFushengluStore.getState().projects[0]?.analysisNotes).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/store/useFushengluStore.test.ts
```

Expected: failures mention missing `addAnalysisNote`, `updateAnalysisNote`, and `deleteAnalysisNote`.

- [ ] **Step 3: Add action types**

Modify imports in `src/store/useFushengluStore.ts`:

```ts
import type {
  AnalysisNoteDraft,
  BackendStatus,
  EdgeVisualStyle,
  EntityDraft,
  EntityRelationDraft,
  EventLinkDraft,
  FushengProject,
  GraphNodePosition,
  LibraryItem,
  ProjectCategory,
  ProjectTemplateId,
  StoryEventDraft,
  ThemeMode,
} from '../types'
```

Add these fields to `StoreState` after `deleteLibraryItem`:

```ts
addAnalysisNote: (projectId: string, draft: AnalysisNoteDraft) => string
updateAnalysisNote: (projectId: string, noteId: string, draft: AnalysisNoteDraft) => void
deleteAnalysisNote: (projectId: string, noteId: string) => void
```

- [ ] **Step 4: Preserve imported analysis notes**

In `cleanImportedProject`, add:

```ts
analysisNotes: Array.isArray(importedProject.analysisNotes) ? importedProject.analysisNotes : [],
```

In `clearProjectData`, add:

```ts
analysisNotes: [],
```

- [ ] **Step 5: Implement note actions**

Add these actions after `deleteLibraryItem` in `useFushengluStore.ts`:

```ts
addAnalysisNote: (projectId, draft) => {
  const id = makeId('analysis')
  const timestamp = now()
  commitProject(projectId, (project) => ({
    ...project,
    analysisNotes: [
      {
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...draft,
      },
      ...project.analysisNotes,
    ],
  }))
  logEvent('Analysis note created', {
    projectId,
    noteId: id,
    graphMode: draft.graphMode,
  })
  return id
},

updateAnalysisNote: (projectId, noteId, draft) => {
  commitProject(projectId, (project) => ({
    ...project,
    analysisNotes: project.analysisNotes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            ...draft,
            updatedAt: now(),
          }
        : note,
    ),
  }))
  logEvent('Analysis note updated', { projectId, noteId, graphMode: draft.graphMode })
},

deleteAnalysisNote: (projectId, noteId) => {
  commitProject(projectId, (project) => ({
    ...project,
    analysisNotes: project.analysisNotes.filter((note) => note.id !== noteId),
  }))
  logEvent('Analysis note deleted', { projectId, noteId })
},
```

- [ ] **Step 6: Run store tests**

Run:

```bash
npm run test -- src/store/useFushengluStore.test.ts
```

Expected: store tests pass.

- [ ] **Step 7: Commit store actions**

Run:

```bash
git status --short
git add src/store/useFushengluStore.ts src/store/useFushengluStore.test.ts
git commit -m "feat: manage graph analysis notes in store"
```

## Task 3: Create Graph Workbench Utilities

**Files:**
- Create: `src/lib/graphWorkbench.ts`
- Create: `src/lib/graphWorkbench.test.ts`

- [ ] **Step 1: Add failing graph utility tests**

Create `src/lib/graphWorkbench.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createFictionSampleProject } from '../data/sampleData'
import {
  buildEvidenceNextSteps,
  collectGraphFilterOptions,
  filterGraphRecords,
  getGraphRecords,
  getLinkedNodeIds,
  type GraphFilters,
} from './graphWorkbench'

describe('graphWorkbench utilities', () => {
  it('builds entity graph records and filter options', () => {
    const project = createFictionSampleProject('project-graph-utils')
    const graph = getGraphRecords(project, 'entities')
    const options = collectGraphFilterOptions(graph)

    expect(graph.nodes.length).toBe(project.entities.length)
    expect(graph.edges.length).toBe(project.entityRelations.length)
    expect(options.nodeTypes.length).toBeGreaterThan(0)
    expect(options.edgeTypes.length).toBeGreaterThan(0)
    expect(options.tags.length).toBeGreaterThan(0)
  })

  it('filters event graph records by query and edge type', () => {
    const project = createFictionSampleProject('project-filter-utils')
    const graph = getGraphRecords(project, 'events')
    const firstLink = project.eventLinks[0]
    const firstEvent = project.events[0]

    if (!firstLink || !firstEvent) throw new Error('Expected sample event graph')

    const filters: GraphFilters = {
      query: firstEvent.title,
      nodeTypes: [],
      edgeTypes: [firstLink.type],
      tags: [],
      factions: [],
      locations: [],
      year: null,
    }

    const filtered = filterGraphRecords(graph, filters)

    expect(filtered.nodes.some((node) => node.id === firstEvent.id)).toBe(true)
    expect(filtered.edges.every((edge) => edge.type === firstLink.type)).toBe(true)
  })

  it('finds linked nodes and reasoning next steps', () => {
    const project = createFictionSampleProject('project-evidence-utils')
    const graph = getGraphRecords(project, 'entities')
    const firstNode = graph.nodes[0]

    if (!firstNode) throw new Error('Expected graph node')

    const linked = getLinkedNodeIds(graph, firstNode.id)
    const nextSteps = buildEvidenceNextSteps(graph, [firstNode.id], [])

    expect(linked.size).toBeGreaterThan(0)
    expect(nextSteps.length).toBeGreaterThan(0)
    expect(nextSteps[0]).toHaveProperty('edgeId')
    expect(nextSteps[0]).toHaveProperty('nodeId')
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/lib/graphWorkbench.test.ts
```

Expected: module-not-found failure for `src/lib/graphWorkbench.ts`.

- [ ] **Step 3: Create graph utility module**

Create `src/lib/graphWorkbench.ts`:

```ts
import type {
  EdgeVisualStyle,
  Entity,
  EntityRelation,
  EventLink,
  FushengProject,
  GraphMode,
  StoryEvent,
} from '../types'

export type GraphNodeKind = Entity['type'] | 'event'

export type WorkbenchNode = {
  id: string
  label: string
  kind: GraphNodeKind
  description: string
  tags: string[]
  faction?: string
  location?: string
  startYear?: number
  endYear?: number
}

export type WorkbenchEdge = {
  id: string
  sourceId: string
  targetId: string
  type: string
  description?: string
  startYear?: number
  endYear?: number
  style?: EdgeVisualStyle
}

export type WorkbenchGraph = {
  mode: GraphMode
  nodes: WorkbenchNode[]
  edges: WorkbenchEdge[]
}

export type GraphFilters = {
  query: string
  nodeTypes: string[]
  edgeTypes: string[]
  tags: string[]
  factions: string[]
  locations: string[]
  year: number | null
}

export type GraphFilterOptions = {
  nodeTypes: string[]
  edgeTypes: string[]
  tags: string[]
  factions: string[]
  locations: string[]
  minYear: number | null
  maxYear: number | null
}

export type EvidenceNextStep = {
  edgeId: string
  nodeId: string
  label: string
  edgeType: string
  direction: 'outgoing' | 'incoming'
}

export const emptyGraphFilters = (): GraphFilters => ({
  query: '',
  nodeTypes: [],
  edgeTypes: [],
  tags: [],
  factions: [],
  locations: [],
  year: null,
})

const uniqueSorted = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'zh-CN'))

const inYear = (item: { startYear?: number; endYear?: number }, year: number | null) => {
  if (year == null) return true
  if (item.startYear != null && year < item.startYear) return false
  if (item.endYear != null && year > item.endYear) return false
  return true
}

const matchesQuery = (parts: Array<string | undefined>, query: string) => {
  if (!query.trim()) return true
  const text = parts.filter(Boolean).join(' ').toLowerCase()
  return text.includes(query.trim().toLowerCase())
}

export function getGraphRecords(project: FushengProject, mode: GraphMode): WorkbenchGraph {
  if (mode === 'entities') {
    return {
      mode,
      nodes: project.entities.map((entity) => ({
        id: entity.id,
        label: entity.name,
        kind: entity.type,
        description: entity.identity || entity.description || '',
        tags: entity.tags,
        faction: entity.faction,
        location: entity.type === 'place' ? entity.name : undefined,
        startYear: entity.startYear,
        endYear: entity.endYear,
      })),
      edges: project.entityRelations.map((relation: EntityRelation) => ({
        id: relation.id,
        sourceId: relation.sourceId,
        targetId: relation.targetId,
        type: relation.type,
        description: relation.description,
        startYear: relation.startYear,
        endYear: relation.endYear,
        style: relation.style,
      })),
    }
  }

  return {
    mode,
    nodes: project.events.map((event: StoryEvent) => ({
      id: event.id,
      label: event.title,
      kind: 'event',
      description: event.location || event.description || '',
      tags: event.tags,
      location: event.location,
      startYear: event.startYear,
      endYear: event.endYear,
    })),
    edges: project.eventLinks.map((link: EventLink) => ({
      id: link.id,
      sourceId: link.sourceEventId,
      targetId: link.targetEventId,
      type: link.type,
      description: link.description,
      startYear: link.startYear,
      endYear: link.endYear,
      style: link.style,
    })),
  }
}

export function collectGraphFilterOptions(graph: WorkbenchGraph): GraphFilterOptions {
  const years = [
    ...graph.nodes.flatMap((node) => [node.startYear, node.endYear]),
    ...graph.edges.flatMap((edge) => [edge.startYear, edge.endYear]),
  ].filter((year): year is number => Number.isFinite(year))

  return {
    nodeTypes: uniqueSorted(graph.nodes.map((node) => node.kind)),
    edgeTypes: uniqueSorted(graph.edges.map((edge) => edge.type)),
    tags: uniqueSorted(graph.nodes.flatMap((node) => node.tags)),
    factions: uniqueSorted(graph.nodes.map((node) => node.faction)),
    locations: uniqueSorted(graph.nodes.map((node) => node.location)),
    minYear: years.length ? Math.min(...years) : null,
    maxYear: years.length ? Math.max(...years) : null,
  }
}

export function countActiveFilters(filters: GraphFilters): number {
  return [
    filters.query.trim(),
    filters.year == null ? '' : String(filters.year),
    ...filters.nodeTypes,
    ...filters.edgeTypes,
    ...filters.tags,
    ...filters.factions,
    ...filters.locations,
  ].filter(Boolean).length
}

export function filterGraphRecords(graph: WorkbenchGraph, filters: GraphFilters): WorkbenchGraph {
  const nodes = graph.nodes.filter((node) => {
    if (!matchesQuery([node.label, node.description, node.faction, node.location, ...node.tags], filters.query)) {
      return false
    }
    if (filters.nodeTypes.length && !filters.nodeTypes.includes(node.kind)) return false
    if (filters.tags.length && !filters.tags.some((tag) => node.tags.includes(tag))) return false
    if (filters.factions.length && (!node.faction || !filters.factions.includes(node.faction))) return false
    if (filters.locations.length && (!node.location || !filters.locations.includes(node.location))) return false
    return inYear(node, filters.year)
  })
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = graph.edges.filter((edge) => {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) return false
    if (filters.edgeTypes.length && !filters.edgeTypes.includes(edge.type)) return false
    if (!matchesQuery([edge.type, edge.description], filters.query)) {
      const source = graph.nodes.find((node) => node.id === edge.sourceId)
      const target = graph.nodes.find((node) => node.id === edge.targetId)
      if (!matchesQuery([source?.label, target?.label], filters.query)) return false
    }
    return inYear(edge, filters.year)
  })

  return { ...graph, nodes, edges }
}

export function getLinkedNodeIds(graph: WorkbenchGraph, nodeId: string): Set<string> {
  const linked = new Set<string>([nodeId])
  for (const edge of graph.edges) {
    if (edge.sourceId === nodeId) linked.add(edge.targetId)
    if (edge.targetId === nodeId) linked.add(edge.sourceId)
  }
  return linked
}

export function buildEvidenceNextSteps(
  graph: WorkbenchGraph,
  nodeIds: string[],
  edgeIds: string[],
): EvidenceNextStep[] {
  const lastNodeId = nodeIds[nodeIds.length - 1]
  if (!lastNodeId) return []

  return graph.edges
    .filter((edge) => !edgeIds.includes(edge.id) && (edge.sourceId === lastNodeId || edge.targetId === lastNodeId))
    .map((edge) => {
      const outgoing = edge.sourceId === lastNodeId
      const nodeId = outgoing ? edge.targetId : edge.sourceId
      const node = graph.nodes.find((item) => item.id === nodeId)
      return {
        edgeId: edge.id,
        nodeId,
        label: node?.label || nodeId,
        edgeType: edge.type,
        direction: outgoing ? 'outgoing' : 'incoming',
      }
    })
}
```

- [ ] **Step 4: Run graph utility tests**

Run:

```bash
npm run test -- src/lib/graphWorkbench.test.ts
```

Expected: graph utility tests pass.

- [ ] **Step 5: Commit utility module**

Run:

```bash
git status --short
git add src/lib/graphWorkbench.ts src/lib/graphWorkbench.test.ts
git commit -m "feat: add graph workbench utilities"
```

## Task 4: Build Workbench Panels and Composer

**Files:**
- Create: `src/components/GraphToolbar.tsx`
- Create: `src/components/GraphFilterPanel.tsx`
- Create: `src/components/GraphInspectorPanel.tsx`
- Create: `src/components/GraphEvidencePanel.tsx`
- Create: `src/components/GraphConnectionComposer.tsx`
- Create: `src/components/GraphFilterPanel.test.tsx`
- Create: `src/components/GraphEvidencePanel.test.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add failing component tests**

Create `src/components/GraphFilterPanel.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { emptyGraphFilters } from '../lib/graphWorkbench'
import GraphFilterPanel from './GraphFilterPanel'

describe('GraphFilterPanel', () => {
  it('shows active filter count and clears filters', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()

    render(
      <GraphFilterPanel
        filters={{ ...emptyGraphFilters(), query: '刘邦', edgeTypes: ['对立'] }}
        options={{
          nodeTypes: ['person'],
          edgeTypes: ['对立'],
          tags: ['核心'],
          factions: ['汉军'],
          locations: ['关中'],
          minYear: -210,
          maxYear: -190,
        }}
        onChange={onChange}
        onClear={onClear}
      />,
    )

    expect(screen.getByText('筛选与图层')).toBeInTheDocument()
    expect(screen.getByText('已应用 2 项')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '清空筛选' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
```

Create `src/components/GraphEvidencePanel.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GraphEvidencePanel from './GraphEvidencePanel'

describe('GraphEvidencePanel', () => {
  it('saves an evidence chain with a summary', () => {
    const onSave = vi.fn()

    render(
      <GraphEvidencePanel
        graphMode="entities"
        nodes={[{ id: 'a', label: '刘邦' }, { id: 'b', label: '项羽' }]}
        edges={[{ id: 'r', type: '对立', sourceId: 'a', targetId: 'b' }]}
        chain={{ nodeIds: ['a', 'b'], edgeIds: ['r'], summary: '楚汉对立。' }}
        nextSteps={[]}
        savedNotes={[]}
        onAppendStep={vi.fn()}
        onRemoveLast={vi.fn()}
        onClear={vi.fn()}
        onSummaryChange={vi.fn()}
        onSave={onSave}
        onOpenNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '保存证据链' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/components/GraphFilterPanel.test.tsx src/components/GraphEvidencePanel.test.tsx
```

Expected: module-not-found failures for the new components.

- [ ] **Step 3: Add a compact detail panel variant**

Modify the `Props` type in `src/components/DetailPanel.tsx`:

```ts
type Props = {
  project: FushengProject
  selection: DetailSelection
  title?: string
  sticky?: boolean
  compactChrome?: boolean
  onRelationClick?: (relation: EntityRelation) => void
}
```

Read `compactChrome` in the component signature:

```ts
export default function DetailPanel({
  project,
  selection,
  title = '案前档案',
  sticky = false,
  compactChrome = false,
  onRelationClick,
}: Props) {
```

Replace the final return with this structure:

```tsx
if (compactChrome) {
  return <div className="space-y-4">{body}</div>
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
```

- [ ] **Step 4: Create `GraphToolbar`**

Create `src/components/GraphToolbar.tsx`:

```tsx
import {
  Focus,
  Fullscreen,
  LayoutGrid,
  Maximize2,
  Plus,
  RotateCcw,
  SearchX,
} from 'lucide-react'

export type GraphWorkMode = 'browse' | 'reasoning' | 'organize'

type Props = {
  mode: GraphWorkMode
  activeFilterCount: number
  immersive: boolean
  hasFocus: boolean
  onModeChange: (mode: GraphWorkMode) => void
  onAddConnection: () => void
  onAutoLayout: () => void
  onFitView: () => void
  onClearFilters: () => void
  onToggleImmersive: () => void
  onExitFocus: () => void
}

const modeLabels: Array<{ value: GraphWorkMode; label: string }> = [
  { value: 'browse', label: '浏览' },
  { value: 'reasoning', label: '推理' },
  { value: 'organize', label: '整理' },
]

export default function GraphToolbar({
  mode,
  activeFilterCount,
  immersive,
  hasFocus,
  onModeChange,
  onAddConnection,
  onAutoLayout,
  onFitView,
  onClearFilters,
  onToggleImmersive,
  onExitFocus,
}: Props) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-goldline/30 bg-paper-50/90 p-1 shadow-soft backdrop-blur">
        {modeLabels.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onModeChange(item.value)}
            className={[
              'min-h-8 rounded-md px-3 text-xs transition',
              mode === item.value ? 'bg-ink-900 text-paper-50' : 'text-ink-700 hover:bg-ink-900/5',
            ].join(' ')}
            aria-pressed={mode === item.value}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={onAddConnection} className="graph-tool-button">
        <Plus size={16} />
        添加连接
      </button>
      <button type="button" onClick={onAutoLayout} className="graph-tool-button">
        <LayoutGrid size={16} />
        自动整理
      </button>
      <button type="button" onClick={onFitView} className="graph-tool-button" aria-label="适应视图">
        <Maximize2 size={16} />
      </button>
      {activeFilterCount ? (
        <button type="button" onClick={onClearFilters} className="graph-tool-button">
          <SearchX size={16} />
          清空筛选
        </button>
      ) : null}
      {hasFocus ? (
        <button type="button" onClick={onExitFocus} className="graph-tool-button">
          <Focus size={16} />
          退出聚焦
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggleImmersive}
        className="graph-tool-button"
        aria-pressed={immersive}
      >
        {immersive ? <RotateCcw size={16} /> : <Fullscreen size={16} />}
        {immersive ? '退出沉浸' : '沉浸'}
      </button>
    </div>
  )
}
```

Add this reusable class to `src/index.css` near the other graph styles:

```css
.graph-tool-button {
  display: inline-flex;
  min-height: 2.25rem;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--goldline) / 0.3);
  background: rgb(var(--paper-50) / 0.9);
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: rgb(var(--ink-800));
  box-shadow: 0 8px 24px rgb(var(--shadow-soft) / 0.08);
  backdrop-filter: blur(10px);
  transition: background-color 160ms ease, border-color 160ms ease;
}

.graph-tool-button:hover {
  border-color: rgb(var(--goldline) / 0.5);
  background: rgb(var(--paper-50));
}
```

- [ ] **Step 5: Create `GraphFilterPanel`**

Create `src/components/GraphFilterPanel.tsx`:

```tsx
import { Search, X } from 'lucide-react'
import { countActiveFilters, type GraphFilterOptions, type GraphFilters } from '../lib/graphWorkbench'

type Props = {
  filters: GraphFilters
  options: GraphFilterOptions
  onChange: (filters: GraphFilters) => void
  onClear: () => void
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function FilterGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string
  values: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  if (!values.length) return null

  return (
    <div>
      <p className="mb-2 text-xs text-ink-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={[
              'min-h-8 rounded-full border px-3 text-xs transition',
              selected.includes(value)
                ? 'border-goldline bg-goldline/15 text-ink-900'
                : 'border-ink-900/10 bg-paper-50/70 text-ink-600 hover:border-goldline/40',
            ].join(' ')}
            aria-pressed={selected.includes(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GraphFilterPanel({ filters, options, onChange, onClear }: Props) {
  const activeCount = countActiveFilters(filters)

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">Filters</p>
          <h3 className="font-serif text-xl font-semibold">筛选与图层</h3>
        </div>
        {activeCount ? (
          <span className="rounded-full bg-goldline/15 px-2.5 py-1 text-xs text-ink-700">
            已应用 {activeCount} 项
          </span>
        ) : null}
      </div>

      <label className="mt-4 flex min-h-10 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm text-ink-500 focus-within:border-goldline">
        <Search size={15} />
        <input
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="搜索节点、关系、标签"
          className="min-w-0 flex-1 bg-transparent text-ink-800 outline-none placeholder:text-ink-500/70"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => onChange({ ...filters, query: '' })}
            aria-label="清空搜索"
            className="text-ink-400 hover:text-ink-800"
          >
            <X size={14} />
          </button>
        ) : null}
      </label>

      <div className="fsl-scrollbar mt-4 min-h-0 flex-1 space-y-4 overflow-auto pr-1">
        <FilterGroup
          title="节点类型"
          values={options.nodeTypes}
          selected={filters.nodeTypes}
          onToggle={(value) => onChange({ ...filters, nodeTypes: toggleValue(filters.nodeTypes, value) })}
        />
        <FilterGroup
          title="连接类型"
          values={options.edgeTypes}
          selected={filters.edgeTypes}
          onToggle={(value) => onChange({ ...filters, edgeTypes: toggleValue(filters.edgeTypes, value) })}
        />
        <FilterGroup
          title="标签"
          values={options.tags}
          selected={filters.tags}
          onToggle={(value) => onChange({ ...filters, tags: toggleValue(filters.tags, value) })}
        />
        <FilterGroup
          title="阵营"
          values={options.factions}
          selected={filters.factions}
          onToggle={(value) => onChange({ ...filters, factions: toggleValue(filters.factions, value) })}
        />
        <FilterGroup
          title="地点"
          values={options.locations}
          selected={filters.locations}
          onToggle={(value) => onChange({ ...filters, locations: toggleValue(filters.locations, value) })}
        />
        {options.minYear != null && options.maxYear != null ? (
          <label className="grid gap-2 text-xs text-ink-500">
            时间截面
            <input
              type="range"
              min={options.minYear}
              max={options.maxYear}
              value={filters.year ?? options.maxYear}
              onChange={(event) => onChange({ ...filters, year: Number(event.target.value) })}
              className="w-full accent-[rgb(var(--goldline))]"
            />
            <span className="text-ink-700">{filters.year == null ? '显示全部时间' : `${filters.year}`}</span>
          </label>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={!activeCount}
        className="mt-4 min-h-10 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 text-sm text-ink-700 transition hover:bg-paper-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        清空筛选
      </button>
    </aside>
  )
}
```

- [ ] **Step 6: Create inspector, evidence panel, and composer**

Create `src/components/GraphInspectorPanel.tsx`:

```tsx
import type { ReactNode } from 'react'

export type InspectorTab = 'detail' | 'evidence' | 'style' | 'notes'

type Props = {
  activeTab: InspectorTab
  onTabChange: (tab: InspectorTab) => void
  detail: ReactNode
  evidence: ReactNode
  style: ReactNode
  notes: ReactNode
}

const tabs: Array<{ value: InspectorTab; label: string }> = [
  { value: 'detail', label: '档案详情' },
  { value: 'evidence', label: '证据链' },
  { value: 'style', label: '关系样式' },
  { value: 'notes', label: '分析笔记' },
]

export default function GraphInspectorPanel({ activeTab, onTabChange, detail, evidence, style, notes }: Props) {
  const content = {
    detail,
    evidence,
    style,
    notes,
  }[activeTab]

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft">
      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={[
              'min-h-9 rounded-lg border px-2 text-xs transition',
              activeTab === tab.value
                ? 'border-goldline bg-goldline/15 text-ink-900'
                : 'border-ink-900/10 bg-paper-50/70 text-ink-600 hover:border-goldline/40',
            ].join(' ')}
            aria-pressed={activeTab === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="fsl-scrollbar mt-4 min-h-0 flex-1 overflow-auto pr-1">{content}</div>
    </aside>
  )
}
```

Create `src/components/GraphEvidencePanel.tsx`:

```tsx
import { Save, Trash2, Undo2 } from 'lucide-react'
import type { AnalysisNote, GraphMode } from '../types'
import type { EvidenceNextStep } from '../lib/graphWorkbench'

type ChainState = {
  nodeIds: string[]
  edgeIds: string[]
  summary: string
}

type Props = {
  graphMode: GraphMode
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ id: string; type: string; sourceId: string; targetId: string }>
  chain: ChainState
  nextSteps: EvidenceNextStep[]
  savedNotes: AnalysisNote[]
  onAppendStep: (step: EvidenceNextStep) => void
  onRemoveLast: () => void
  onClear: () => void
  onSummaryChange: (summary: string) => void
  onSave: () => void
  onOpenNote: (note: AnalysisNote) => void
  onDeleteNote: (noteId: string) => void
}

export default function GraphEvidencePanel({
  nodes,
  edges,
  chain,
  nextSteps,
  savedNotes,
  onAppendStep,
  onRemoveLast,
  onClear,
  onSummaryChange,
  onSave,
  onOpenNote,
  onDeleteNote,
}: Props) {
  const nodeLabel = (nodeId: string) => nodes.find((node) => node.id === nodeId)?.label || nodeId
  const edgeLabel = (edgeId: string) => edges.find((edge) => edge.id === edgeId)?.type || edgeId
  const canSave = chain.nodeIds.length > 0 && chain.summary.trim().length > 0

  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-500">Reasoning</p>
            <h3 className="font-serif text-xl font-semibold">当前证据链</h3>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onRemoveLast} className="graph-tool-button" aria-label="撤回一步">
              <Undo2 size={15} />
            </button>
            <button type="button" onClick={onClear} className="graph-tool-button" aria-label="清空证据链">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {chain.nodeIds.length ? (
          <ol className="mt-4 space-y-2">
            {chain.nodeIds.map((nodeId, index) => (
              <li key={`${nodeId}-${index}`} className="rounded-lg border border-ink-900/10 bg-paper-100/65 p-3 text-sm">
                <strong className="text-ink-900">{nodeLabel(nodeId)}</strong>
                {chain.edgeIds[index] ? <p className="mt-1 text-xs text-ink-500">经由：{edgeLabel(chain.edgeIds[index])}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-ink-900/15 bg-paper-100/55 p-4 text-sm leading-6 text-ink-500">
            在推理模式中选择一个节点作为起点，再沿关系逐步加入证据链。
          </p>
        )}

        <label className="mt-4 grid gap-2 text-sm">
          推理摘要
          <textarea
            value={chain.summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            className="min-h-24 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
            placeholder="记录这条链路说明了什么"
          />
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-ink-900 px-4 text-sm text-paper-50 transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Save size={16} />
          保存证据链
        </button>
      </section>

      <section>
        <h4 className="font-serif text-lg font-semibold">可继续展开</h4>
        <div className="mt-3 space-y-2">
          {nextSteps.map((step) => (
            <button
              key={step.edgeId}
              type="button"
              onClick={() => onAppendStep(step)}
              className="w-full rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-2 text-left text-sm transition hover:border-goldline/40"
            >
              <span className="text-ink-900">{step.label}</span>
              <span className="ml-2 text-xs text-ink-500">{step.direction === 'outgoing' ? '下游' : '上游'} · {step.edgeType}</span>
            </button>
          ))}
          {!nextSteps.length ? <p className="text-sm text-ink-500">当前节点没有可继续展开的未使用连接。</p> : null}
        </div>
      </section>

      <section>
        <h4 className="font-serif text-lg font-semibold">已保存笔记</h4>
        <div className="mt-3 space-y-2">
          {savedNotes.map((note) => (
            <div key={note.id} className="rounded-lg border border-ink-900/10 bg-paper-100/65 p-3">
              <button type="button" onClick={() => onOpenNote(note)} className="block w-full text-left">
                <strong className="text-sm text-ink-900">{note.title}</strong>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{note.summary}</p>
              </button>
              <button
                type="button"
                onClick={() => onDeleteNote(note.id)}
                className="mt-2 text-xs text-cinnabar hover:underline"
              >
                删除笔记
              </button>
            </div>
          ))}
          {!savedNotes.length ? <p className="text-sm text-ink-500">还没有保存的分析笔记。</p> : null}
        </div>
      </section>
    </div>
  )
}
```

Create `src/components/GraphConnectionComposer.tsx`:

```tsx
import { X } from 'lucide-react'
import EdgeStyleControls from './EdgeStyleControls'
import type { EdgeVisualStyle } from '../types'

type Draft = {
  sourceId: string
  targetId: string
  type: string
  description: string
  style?: EdgeVisualStyle
}

type Option = {
  id: string
  label: string
}

type Props = {
  open: boolean
  title: string
  sourceLabel: string
  targetLabel: string
  submitLabel: string
  draft: Draft
  nodes: Option[]
  types: string[]
  onDraftChange: (draft: Draft) => void
  onClose: () => void
  onSubmit: () => void
}

export default function GraphConnectionComposer({
  open,
  title,
  sourceLabel,
  targetLabel,
  submitLabel,
  draft,
  nodes,
  types,
  onDraftChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null

  const canSubmit = draft.sourceId && draft.targetId && draft.sourceId !== draft.targetId && draft.type.trim()

  return (
    <section className="rounded-lg border border-goldline/30 bg-paper-50 p-4 shadow-archive">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">Composer</p>
          <h3 className="font-serif text-xl font-semibold">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="关闭连接编辑"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm">
          {sourceLabel}
          <select
            value={draft.sourceId}
            onChange={(event) => onDraftChange({ ...draft, sourceId: event.target.value })}
            className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>{node.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          {targetLabel}
          <select
            value={draft.targetId}
            onChange={(event) => onDraftChange({ ...draft, targetId: event.target.value })}
            className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>{node.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          类型
          <select
            value={draft.type}
            onChange={(event) => onDraftChange({ ...draft, type: event.target.value })}
            className="min-h-11 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 outline-none focus:border-goldline"
          >
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          说明
          <textarea
            value={draft.description}
            onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
            className="min-h-24 rounded-lg border border-ink-900/10 bg-paper-50/70 px-3 py-3 outline-none focus:border-goldline"
          />
        </label>
        <EdgeStyleControls
          value={draft.style}
          onChange={(style) => onDraftChange({ ...draft, style })}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="min-h-11 rounded-lg bg-ink-900 px-4 text-sm text-paper-50 transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitLabel}
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Run component tests**

Run:

```bash
npm run test -- src/components/GraphFilterPanel.test.tsx src/components/GraphEvidencePanel.test.tsx
```

Expected: both component tests pass.

- [ ] **Step 8: Commit shared panels**

Run:

```bash
git status --short
git add src/components/GraphToolbar.tsx src/components/GraphFilterPanel.tsx src/components/GraphInspectorPanel.tsx src/components/GraphEvidencePanel.tsx src/components/GraphConnectionComposer.tsx src/components/GraphFilterPanel.test.tsx src/components/GraphEvidencePanel.test.tsx src/components/DetailPanel.tsx src/index.css
git commit -m "feat: add graph workbench panels"
```

## Task 5: Enhance GraphCanvas for Workbench State

**Files:**
- Modify: `src/components/GraphCanvas.tsx`

- [ ] **Step 1: Add new props**

Extend `Props` in `src/components/GraphCanvas.tsx`:

```ts
type Props = {
  project: FushengProject
  mode: 'entities' | 'events'
  compact?: boolean
  toolbar?: ReactNode
  onSelect?: (selection: DetailSelection) => void
  onConnectNodes?: (connection: GraphConnection) => void
  onNodePositionChange?: (nodeId: string, position: GraphNodePosition) => void
  focusNodeId?: string | null
  onFocusNodeChange?: (nodeId: string | null) => void
  currentYear?: number | null
  visibleNodeIds?: Set<string>
  visibleEdgeIds?: Set<string>
  activeChain?: { nodeIds: string[]; edgeIds: string[] }
  emptyTitle?: string
  emptyDescription?: string
  layoutStatus?: 'idle' | 'saving' | 'saved' | 'failed'
  fitViewKey?: number
}
```

- [ ] **Step 2: Apply visible filtering after graph build**

Inside `GraphCanvas`, after the `graph` memo, add:

```ts
const visibleGraph = useMemo(() => {
  const filteredNodes = visibleNodeIds
    ? graph.nodes.filter((node) => visibleNodeIds.has(node.id))
    : graph.nodes
  const nodeIds = new Set(filteredNodes.map((node) => node.id))
  const filteredEdges = graph.edges.filter((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false
    return visibleEdgeIds ? visibleEdgeIds.has(edge.id) : true
  })

  return { nodes: filteredNodes, edges: filteredEdges }
}, [graph, visibleEdgeIds, visibleNodeIds])
```

Change state initialization and effects to use `visibleGraph` instead of `graph`:

```ts
const [nodes, setNodes, onNodesChange] = useNodesState(visibleGraph.nodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(visibleGraph.edges)

useEffect(() => {
  setNodes(visibleGraph.nodes)
  setEdges(visibleGraph.edges)
}, [setEdges, setNodes, visibleGraph])
```

- [ ] **Step 3: Highlight active evidence chain**

Add this effect after the focus effect:

```ts
useEffect(() => {
  if (!activeChain?.nodeIds.length && !activeChain?.edgeIds.length) return

  const chainNodeIds = new Set(activeChain.nodeIds)
  const chainEdgeIds = new Set(activeChain.edgeIds)

  setNodes((prev) =>
    prev.map((node) => ({
      ...node,
      data: { ...node.data, dimmed: !chainNodeIds.has(node.id) },
    })),
  )
  setEdges((prev) =>
    prev.map((edge) => ({
      ...edge,
      animated: chainEdgeIds.has(edge.id) ? true : edge.animated,
      style: {
        ...edge.style,
        opacity: chainEdgeIds.has(edge.id) ? 1 : 0.12,
        strokeWidth: chainEdgeIds.has(edge.id) ? 4 : edge.style?.strokeWidth,
      },
    })),
  )
}, [activeChain, setEdges, setNodes])
```

- [ ] **Step 4: Add layout status and empty overlays**

Add this helper inside `GraphCanvas` before return:

```ts
const layoutStatusLabel = {
  idle: '',
  saving: '布局保存中',
  saved: '布局已保存',
  failed: '布局保存失败',
}[layoutStatus || 'idle']
```

Add these overlays as the first children inside the root `<div>`:

```tsx
{layoutStatusLabel ? (
  <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-goldline/25 bg-paper-50/92 px-3 py-2 text-xs text-ink-700 shadow-soft backdrop-blur">
    {layoutStatusLabel}
  </div>
) : null}
{!visibleGraph.nodes.length ? (
  <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
    <div className="max-w-sm rounded-lg border border-dashed border-ink-900/15 bg-paper-50/92 p-5 text-center shadow-soft backdrop-blur">
      <h3 className="font-serif text-xl font-semibold">{emptyTitle || '暂无图谱内容'}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        {emptyDescription || '添加节点或清空筛选后，图谱会显示在这里。'}
      </p>
    </div>
  </div>
) : null}
```

- [ ] **Step 5: Support external fit view requests**

Import `useReactFlow`:

```ts
useReactFlow,
```

Inside `GraphCanvas`, add:

```ts
const { fitView } = useReactFlow()

useEffect(() => {
  if (fitViewKey == null) return
  const timer = window.setTimeout(() => {
    fitView({ duration: 280, padding: 0.25 })
  }, 40)
  return () => window.clearTimeout(timer)
}, [fitView, fitViewKey])
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 7: Commit canvas enhancement**

Run:

```bash
git status --short
git add src/components/GraphCanvas.tsx
git commit -m "feat: support graph workbench canvas states"
```

## Task 6: Create GraphWorkbench and Migrate Graph Pages

**Files:**
- Create: `src/components/GraphWorkbench.tsx`
- Modify: `src/pages/RelationGraphPage.tsx`
- Modify: `src/pages/EventGraphPage.tsx`

- [ ] **Step 1: Create `GraphWorkbench` shell**

Create `src/components/GraphWorkbench.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useReactFlow } from 'reactflow'
import DetailPanel from './DetailPanel'
import EdgeStyleControls from './EdgeStyleControls'
import GraphCanvas from './GraphCanvas'
import GraphConnectionComposer from './GraphConnectionComposer'
import GraphEvidencePanel from './GraphEvidencePanel'
import GraphFilterPanel from './GraphFilterPanel'
import GraphInspectorPanel, { type InspectorTab } from './GraphInspectorPanel'
import GraphToolbar, { type GraphWorkMode } from './GraphToolbar'
import {
  buildEvidenceNextSteps,
  collectGraphFilterOptions,
  countActiveFilters,
  emptyGraphFilters,
  filterGraphRecords,
  getGraphRecords,
} from '../lib/graphWorkbench'
import { computeEntityLayout, computeEventLayout } from '../lib/dagreLayout'
import { getProjectTemplate } from '../templates/projectTemplates'
import type {
  AnalysisNote,
  AnalysisNoteDraft,
  DetailSelection,
  EdgeVisualStyle,
  EntityRelationDraft,
  EventLinkDraft,
  FushengProject,
  GraphMode,
  GraphNodePosition,
} from '../types'

type ConnectionDraft = {
  sourceId: string
  targetId: string
  type: string
  description: string
  style?: EdgeVisualStyle
}

type Props = {
  project: FushengProject
  graphMode: GraphMode
  eyebrow: string
  title: string
  description: string
  connectionTitle: string
  connectionSubmitLabel: string
  connectionTypes: string[]
  onAddEntityRelation?: (draft: EntityRelationDraft) => string
  onAddEventLink?: (draft: EventLinkDraft) => string
  onUpdateEdgeStyle: (edgeId: string, style: EdgeVisualStyle) => void
  onNodePositionChange: (nodeId: string, position: GraphNodePosition) => void
  onBatchLayout: (positions: Record<string, GraphNodePosition>) => void
  onAddAnalysisNote: (draft: AnalysisNoteDraft) => string
  onDeleteAnalysisNote: (noteId: string) => void
}

const emptyChain = { nodeIds: [] as string[], edgeIds: [] as string[], summary: '' }

export default function GraphWorkbench({
  project,
  graphMode,
  eyebrow,
  title,
  description,
  connectionTitle,
  connectionSubmitLabel,
  connectionTypes,
  onAddEntityRelation,
  onAddEventLink,
  onUpdateEdgeStyle,
  onNodePositionChange,
  onBatchLayout,
  onAddAnalysisNote,
  onDeleteAnalysisNote,
}: Props) {
  const template = getProjectTemplate(project.templateId, project.category)
  const { fitView } = useReactFlow()
  const [workMode, setWorkMode] = useState<GraphWorkMode>('browse')
  const [filters, setFilters] = useState(emptyGraphFilters)
  const [selection, setSelection] = useState<DetailSelection>(
    graphMode === 'entities'
      ? project.entities[0] ? { kind: 'entity', id: project.entities[0].id } : null
      : project.events[0] ? { kind: 'event', id: project.events[0].id } : null,
  )
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<InspectorTab>('detail')
  const [immersive, setImmersive] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [layoutStatus, setLayoutStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [fitViewKey, setFitViewKey] = useState(0)
  const [chain, setChain] = useState(emptyChain)

  const graph = useMemo(() => getGraphRecords(project, graphMode), [graphMode, project])
  const options = useMemo(() => collectGraphFilterOptions(graph), [graph])
  const filteredGraph = useMemo(() => filterGraphRecords(graph, filters), [filters, graph])
  const visibleNodeIds = useMemo(() => new Set(filteredGraph.nodes.map((node) => node.id)), [filteredGraph.nodes])
  const visibleEdgeIds = useMemo(() => new Set(filteredGraph.edges.map((edge) => edge.id)), [filteredGraph.edges])
  const activeFilterCount = countActiveFilters(filters)
  const savedNotes = project.analysisNotes.filter((note) => note.graphMode === graphMode)
  const selectedEdge =
    selection?.kind === 'entityRelation'
      ? project.entityRelations.find((relation) => relation.id === selection.id)
      : selection?.kind === 'eventLink'
        ? project.eventLinks.find((link) => link.id === selection.id)
        : undefined

  const nodesForComposer = graph.nodes.map((node) => ({ id: node.id, label: node.label }))
  const [draft, setDraft] = useState<ConnectionDraft>({
    sourceId: nodesForComposer[0]?.id || '',
    targetId: nodesForComposer[1]?.id || '',
    type: connectionTypes[0] || '',
    description: '',
    style: { lineStyle: 'solid', tone: graphMode === 'entities' ? 'cinnabar' : 'jade', animated: false },
  })

  const nextSteps = useMemo(
    () => buildEvidenceNextSteps(filteredGraph, chain.nodeIds, chain.edgeIds),
    [chain.edgeIds, chain.nodeIds, filteredGraph],
  )

  const submitConnection = () => {
    if (!draft.sourceId || !draft.targetId || draft.sourceId === draft.targetId || !draft.type.trim()) return
    if (graphMode === 'entities' && onAddEntityRelation) {
      const id = onAddEntityRelation({
        sourceId: draft.sourceId,
        targetId: draft.targetId,
        type: draft.type.trim(),
        description: draft.description.trim(),
        style: draft.style,
      })
      setSelection({ kind: 'entityRelation', id })
    }
    if (graphMode === 'events' && onAddEventLink) {
      const id = onAddEventLink({
        sourceEventId: draft.sourceId,
        targetEventId: draft.targetId,
        type: draft.type.trim(),
        description: draft.description.trim(),
        style: draft.style,
      })
      setSelection({ kind: 'eventLink', id })
    }
    setComposerOpen(false)
  }

  const runAutoLayout = () => {
    setLayoutStatus('saving')
    const positions =
      graphMode === 'entities'
        ? computeEntityLayout(project.entities, project.entityRelations, { rankdir: 'LR', nodesep: 90, ranksep: 140 })
        : computeEventLayout(project.events, project.eventLinks, { rankdir: 'LR', nodesep: 80, ranksep: 130 })
    onBatchLayout(positions)
    setLayoutStatus('saved')
    window.setTimeout(() => setLayoutStatus('idle'), 1400)
    window.setTimeout(() => fitView({ duration: 280, padding: 0.25 }), 80)
  }

  const saveChain = () => {
    const startId = chain.nodeIds[0]
    const targetId = chain.nodeIds[chain.nodeIds.length - 1]
    const startLabel = graph.nodes.find((node) => node.id === startId)?.label || '未命名起点'
    const targetLabel = graph.nodes.find((node) => node.id === targetId)?.label || startLabel
    onAddAnalysisNote({
      title: `${startLabel} → ${targetLabel}`,
      graphMode,
      startId,
      targetId,
      nodeIds: chain.nodeIds,
      edgeIds: chain.edgeIds,
      summary: chain.summary.trim(),
    })
    setActiveTab('notes')
  }

  const openNote = (note: AnalysisNote) => {
    setChain({ nodeIds: note.nodeIds, edgeIds: note.edgeIds, summary: note.summary })
    setActiveTab('evidence')
    setWorkMode('reasoning')
  }

  return (
    <div className={immersive ? 'grid gap-4' : 'grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_360px]'}>
      {!immersive ? (
        <GraphFilterPanel filters={filters} options={options} onChange={setFilters} onClear={() => setFilters(emptyGraphFilters())} />
      ) : null}

      <section className="min-h-[calc(100dvh-9rem)] rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm text-ink-500">{eyebrow}</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-ink-700">{description}</p>
          </div>
          <span className="text-xs text-ink-500">
            {filteredGraph.nodes.length} 节点 / {filteredGraph.edges.length} 连接
          </span>
        </div>
        <div className="h-[calc(100dvh-17rem)] min-h-[560px]">
          <GraphCanvas
            project={project}
            mode={graphMode}
            onSelect={(nextSelection) => {
              setSelection(nextSelection)
              setActiveTab('detail')
              if (workMode === 'reasoning' && nextSelection && (nextSelection.kind === 'entity' || nextSelection.kind === 'event')) {
                setChain((value) =>
                  value.nodeIds.includes(nextSelection.id)
                    ? value
                    : { ...value, nodeIds: [...value.nodeIds, nextSelection.id] },
                )
                setActiveTab('evidence')
              }
            }}
            onConnectNodes={({ sourceId, targetId }) => {
              setDraft((value) => ({ ...value, sourceId, targetId }))
              setComposerOpen(true)
            }}
            onNodePositionChange={(nodeId, position) => {
              setLayoutStatus('saving')
              onNodePositionChange(nodeId, position)
              setLayoutStatus('saved')
              window.setTimeout(() => setLayoutStatus('idle'), 1200)
            }}
            focusNodeId={focusNodeId}
            onFocusNodeChange={setFocusNodeId}
            visibleNodeIds={visibleNodeIds}
            visibleEdgeIds={visibleEdgeIds}
            activeChain={workMode === 'reasoning' ? chain : undefined}
            emptyTitle={activeFilterCount ? '没有匹配的图谱内容' : '暂无图谱内容'}
            emptyDescription={activeFilterCount ? '清空筛选或放宽条件后再查看。' : '先添加人物、事件或连接，再进入图谱分析。'}
            layoutStatus={layoutStatus}
            fitViewKey={fitViewKey}
            toolbar={
              <GraphToolbar
                mode={workMode}
                activeFilterCount={activeFilterCount}
                immersive={immersive}
                hasFocus={Boolean(focusNodeId)}
                onModeChange={setWorkMode}
                onAddConnection={() => setComposerOpen(true)}
                onAutoLayout={runAutoLayout}
                onFitView={() => setFitViewKey((value) => value + 1)}
                onClearFilters={() => setFilters(emptyGraphFilters())}
                onToggleImmersive={() => setImmersive((value) => !value)}
                onExitFocus={() => setFocusNodeId(null)}
              />
            }
          />
        </div>
      </section>

      {!immersive ? (
        <GraphInspectorPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          detail={<DetailPanel project={project} selection={selection} compactChrome />}
          evidence={
            <GraphEvidencePanel
              graphMode={graphMode}
              nodes={graph.nodes.map((node) => ({ id: node.id, label: node.label }))}
              edges={graph.edges.map((edge) => ({ id: edge.id, type: edge.type, sourceId: edge.sourceId, targetId: edge.targetId }))}
              chain={chain}
              nextSteps={nextSteps}
              savedNotes={savedNotes}
              onAppendStep={(step) =>
                setChain((value) => ({
                  ...value,
                  nodeIds: [...value.nodeIds, step.nodeId],
                  edgeIds: [...value.edgeIds, step.edgeId],
                }))
              }
              onRemoveLast={() =>
                setChain((value) => ({
                  ...value,
                  nodeIds: value.nodeIds.slice(0, -1),
                  edgeIds: value.edgeIds.slice(0, -1),
                }))
              }
              onClear={() => setChain(emptyChain)}
              onSummaryChange={(summary) => setChain((value) => ({ ...value, summary }))}
              onSave={saveChain}
              onOpenNote={openNote}
              onDeleteNote={onDeleteAnalysisNote}
            />
          }
          style={
            selectedEdge ? (
              <EdgeStyleControls value={selectedEdge.style} onChange={(style) => onUpdateEdgeStyle(selectedEdge.id, style)} />
            ) : (
              <p className="rounded-lg border border-dashed border-ink-900/15 bg-paper-100/55 p-4 text-sm text-ink-500">
                选择一条连接后可以调整线型、颜色、线宽和流动效果。
              </p>
            )
          }
          notes={
            <div className="space-y-3">
              {savedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note)}
                  className="block w-full rounded-lg border border-ink-900/10 bg-paper-100/65 p-3 text-left text-sm"
                >
                  <strong>{note.title}</strong>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{note.summary}</p>
                </button>
              ))}
              {!savedNotes.length ? <p className="text-sm text-ink-500">还没有保存的分析笔记。</p> : null}
            </div>
          }
        />
      ) : null}

      <div className={composerOpen ? '2xl:col-start-3' : 'hidden'}>
        <GraphConnectionComposer
          open={composerOpen}
          title={connectionTitle}
          sourceLabel={graphMode === 'entities' ? template.entitySingular : template.eventSingular}
          targetLabel={graphMode === 'entities' ? template.entitySingular : template.eventSingular}
          submitLabel={connectionSubmitLabel}
          draft={draft}
          nodes={nodesForComposer}
          types={connectionTypes}
          onDraftChange={setDraft}
          onClose={() => setComposerOpen(false)}
          onSubmit={submitConnection}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Migrate relation graph page**

Replace `src/pages/RelationGraphPage.tsx` with:

```tsx
import { ReactFlowProvider } from 'reactflow'
import GraphWorkbench from '../components/GraphWorkbench'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'

function RelationGraphInner() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addRelation = useFushengluStore((state) => state.addEntityRelation)
  const updateRelationStyle = useFushengluStore((state) => state.updateEntityRelationStyle)
  const updateNodePosition = useFushengluStore((state) => state.updateEntityNodePosition)
  const batchUpdatePositions = useFushengluStore((state) => state.batchUpdateEntityNodePositions)
  const addAnalysisNote = useFushengluStore((state) => state.addAnalysisNote)
  const deleteAnalysisNote = useFushengluStore((state) => state.deleteAnalysisNote)

  return (
    <GraphWorkbench
      project={project}
      graphMode="entities"
      eyebrow={template.pages.relationGraph.eyebrow}
      title={template.pages.relationGraph.title}
      description={template.pages.relationGraph.description}
      connectionTitle={template.pages.relationGraph.composerTitle}
      connectionSubmitLabel="添加关系"
      connectionTypes={template.relationTypes}
      onAddEntityRelation={(draft) => addRelation(project.id, draft)}
      onUpdateEdgeStyle={(edgeId, style) => updateRelationStyle(project.id, edgeId, style)}
      onNodePositionChange={(nodeId, position) => updateNodePosition(project.id, nodeId, position)}
      onBatchLayout={(positions) => batchUpdatePositions(project.id, positions)}
      onAddAnalysisNote={(draft) => addAnalysisNote(project.id, draft)}
      onDeleteAnalysisNote={(noteId) => deleteAnalysisNote(project.id, noteId)}
    />
  )
}

export default function RelationGraphPage() {
  return (
    <ReactFlowProvider>
      <RelationGraphInner />
    </ReactFlowProvider>
  )
}
```

- [ ] **Step 3: Migrate event graph page**

Replace `src/pages/EventGraphPage.tsx` with:

```tsx
import { ReactFlowProvider } from 'reactflow'
import GraphWorkbench from '../components/GraphWorkbench'
import { useProject } from '../hooks/useProject'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate } from '../templates/projectTemplates'

function EventGraphInner() {
  const project = useProject()
  const template = getProjectTemplate(project.templateId, project.category)
  const addEventLink = useFushengluStore((state) => state.addEventLink)
  const updateEventLinkStyle = useFushengluStore((state) => state.updateEventLinkStyle)
  const updateNodePosition = useFushengluStore((state) => state.updateEventNodePosition)
  const batchUpdatePositions = useFushengluStore((state) => state.batchUpdateEventNodePositions)
  const addAnalysisNote = useFushengluStore((state) => state.addAnalysisNote)
  const deleteAnalysisNote = useFushengluStore((state) => state.deleteAnalysisNote)

  return (
    <GraphWorkbench
      project={project}
      graphMode="events"
      eyebrow={template.pages.eventGraph.eyebrow}
      title={template.pages.eventGraph.title}
      description={template.pages.eventGraph.description}
      connectionTitle={template.pages.eventGraph.composerTitle}
      connectionSubmitLabel="添加连接"
      connectionTypes={template.eventLinkTypes}
      onAddEventLink={(draft) => addEventLink(project.id, draft)}
      onUpdateEdgeStyle={(edgeId, style) => updateEventLinkStyle(project.id, edgeId, style)}
      onNodePositionChange={(nodeId, position) => updateNodePosition(project.id, nodeId, position)}
      onBatchLayout={(positions) => batchUpdatePositions(project.id, positions)}
      onAddAnalysisNote={(draft) => addAnalysisNote(project.id, draft)}
      onDeleteAnalysisNote={(noteId) => deleteAnalysisNote(project.id, noteId)}
    />
  )
}

export default function EventGraphPage() {
  return (
    <ReactFlowProvider>
      <EventGraphInner />
    </ReactFlowProvider>
  )
}
```

- [ ] **Step 4: Run type/build checks and fix integration errors**

Run:

```bash
npm run build
```

Expected: TypeScript reports concrete integration errors on prop names or imports. Fix only the referenced graph workbench files. After fixes, `npm run build` passes.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm run test -- src/lib/graphWorkbench.test.ts src/components/GraphFilterPanel.test.tsx src/components/GraphEvidencePanel.test.tsx
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit graph page migration**

Run:

```bash
git status --short
git add src/components/GraphWorkbench.tsx src/pages/RelationGraphPage.tsx src/pages/EventGraphPage.tsx
git commit -m "feat: migrate graph pages to shared workbench"
```

## Task 7: Final Responsive Polish and Validation

**Files:**
- Modify: `src/components/GraphWorkbench.tsx`
- Modify: `src/components/GraphFilterPanel.tsx`
- Modify: `src/components/GraphInspectorPanel.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add responsive panel behavior**

Before the `return` in `GraphWorkbench`, extract the right-panel content into constants:

```tsx
const detailPanel = <DetailPanel project={project} selection={selection} compactChrome />
const evidencePanel = (
  <GraphEvidencePanel
    graphMode={graphMode}
    nodes={graph.nodes.map((node) => ({ id: node.id, label: node.label }))}
    edges={graph.edges.map((edge) => ({ id: edge.id, type: edge.type, sourceId: edge.sourceId, targetId: edge.targetId }))}
    chain={chain}
    nextSteps={nextSteps}
    savedNotes={savedNotes}
    onAppendStep={(step) =>
      setChain((value) => ({
        ...value,
        nodeIds: [...value.nodeIds, step.nodeId],
        edgeIds: [...value.edgeIds, step.edgeId],
      }))
    }
    onRemoveLast={() =>
      setChain((value) => ({
        ...value,
        nodeIds: value.nodeIds.slice(0, -1),
        edgeIds: value.edgeIds.slice(0, -1),
      }))
    }
    onClear={() => setChain(emptyChain)}
    onSummaryChange={(summary) => setChain((value) => ({ ...value, summary }))}
    onSave={saveChain}
    onOpenNote={openNote}
    onDeleteNote={onDeleteAnalysisNote}
  />
)
const stylePanel = selectedEdge ? (
  <EdgeStyleControls value={selectedEdge.style} onChange={(style) => onUpdateEdgeStyle(selectedEdge.id, style)} />
) : (
  <p className="rounded-lg border border-dashed border-ink-900/15 bg-paper-100/55 p-4 text-sm text-ink-500">
    选择一条连接后可以调整线型、颜色、线宽和流动效果。
  </p>
)
const notesPanel = (
  <div className="space-y-3">
    {savedNotes.map((note) => (
      <button
        key={note.id}
        type="button"
        onClick={() => openNote(note)}
        className="block w-full rounded-lg border border-ink-900/10 bg-paper-100/65 p-3 text-left text-sm"
      >
        <strong>{note.title}</strong>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">{note.summary}</p>
      </button>
    ))}
    {!savedNotes.length ? <p className="text-sm text-ink-500">还没有保存的分析笔记。</p> : null}
  </div>
)
```

In `GraphWorkbench`, revise the outer layout classes to:

```tsx
<div
  className={[
    'grid gap-4',
    immersive
      ? 'grid-cols-1'
      : 'xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_360px]',
  ].join(' ')}
>
```

Wrap the inspector so it moves below the canvas on `xl` but returns to the right on `2xl`:

```tsx
<div className="xl:col-span-2 2xl:col-span-1 2xl:col-start-3">
  <GraphInspectorPanel
    activeTab={activeTab}
    onTabChange={setActiveTab}
    detail={detailPanel}
    evidence={evidencePanel}
    style={stylePanel}
    notes={notesPanel}
  />
</div>
```

Keep the filter panel hidden only in immersive mode, not on ordinary desktop widths.

- [ ] **Step 2: Add stable panel heights**

In `GraphWorkbench`, set the filter and inspector container context so panels scroll independently:

```tsx
<div className="min-h-[calc(100dvh-9rem)]">
  <GraphFilterPanel
    filters={filters}
    options={options}
    onChange={setFilters}
    onClear={() => setFilters(emptyGraphFilters())}
  />
</div>
```

For the inspector wrapper:

```tsx
<div className="min-h-[calc(100dvh-9rem)] xl:col-span-2 2xl:col-span-1 2xl:col-start-3">
  <GraphInspectorPanel
    activeTab={activeTab}
    onTabChange={setActiveTab}
    detail={detailPanel}
    evidence={evidencePanel}
    style={stylePanel}
    notes={notesPanel}
  />
</div>
```

- [ ] **Step 3: Add final CSS for graph workbench stability**

Add to `src/index.css`:

```css
.graph-workbench-panel {
  min-height: 0;
  max-height: calc(100dvh - 9rem);
}

@media (max-width: 1279px) {
  .graph-workbench-panel {
    max-height: none;
  }
}
```

Apply `graph-workbench-panel` to the `GraphFilterPanel` root element:

```tsx
className="graph-workbench-panel flex h-full min-h-0 flex-col rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft"
```

Apply `graph-workbench-panel` to the `GraphInspectorPanel` root element:

```tsx
className="graph-workbench-panel flex h-full min-h-0 flex-col rounded-lg border border-ink-900/10 bg-paper-50 p-4 shadow-soft"
```

- [ ] **Step 4: Run final automated validation**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- ESLint passes.
- Vitest passes.
- TypeScript and Vite build pass.

- [ ] **Step 5: Manual smoke test**

Run:

```bash
npm run dev
```

Manual checks:

- Open a project relation graph.
- Confirm the left filter panel, center graph, and right inspector render.
- Filter by connection type, then clear filters.
- Click a node and confirm the detail tab updates.
- Switch to reasoning mode, select nodes, add a summary, and save a note.
- Open the Notes tab and reopen the saved note.
- Select an edge and adjust style in the Style tab.
- Use auto layout and confirm a layout saved indicator appears.
- Toggle immersive mode and confirm the canvas expands.
- Open the event graph and repeat filter, reasoning, style, and composer checks.
- Resize to a narrow viewport and confirm panels do not crush the canvas.

- [ ] **Step 6: Commit final polish**

Run:

```bash
git status --short
git add src/components/GraphWorkbench.tsx src/components/GraphFilterPanel.tsx src/components/GraphInspectorPanel.tsx src/index.css
git commit -m "feat: polish graph workbench responsiveness"
```

## Self-Review Checklist

- Spec coverage:
  - Three-pane graph workbench: Tasks 4, 6, and 7.
  - Shared filters and layers: Tasks 3 and 4.
  - Evidence-chain reasoning: Tasks 1, 2, 3, 4, and 6.
  - Saved analysis notes: Tasks 1, 2, 4, and 6.
  - Connection composer: Tasks 4 and 6.
  - Layout status and immersive mode: Tasks 5, 6, and 7.
  - Relation graph and event graph migration: Task 6.
  - Responsive behavior: Task 7.
- Placeholder scan:
  - No deferred implementation markers remain in this plan.
  - Box selection, group labels, graph overlays, and double-click shortcuts are explicitly excluded from first implementation behavior.
- Type consistency:
  - `GraphMode` is `entities | events`.
  - `AnalysisNote.graphMode`, `GraphWorkbench.graphMode`, and graph utility `mode` use the same type.
  - Entity relation edges use `sourceId` and `targetId`.
  - Event link edges are adapted to `sourceId` and `targetId` inside `graphWorkbench.ts`.
- Git hygiene:
  - Each task stages only listed files.
  - Existing unrelated uncommitted changes must remain untouched unless they are in one of the task files and are required for this upgrade.
