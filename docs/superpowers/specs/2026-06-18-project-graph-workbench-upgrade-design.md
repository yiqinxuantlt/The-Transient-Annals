# Project Graph Workbench Upgrade Design

## Context

Fushenglu is a local-first React, TypeScript, Vite, Zustand, React Router, React Flow, and Express application for organizing historical or fictional projects. Inside a project workspace, the current layout already includes a project sidebar, sticky project header, dashboard, entity and event pages, timeline, relation graph, event graph, library, help, and settings.

The requested upgrade is scoped to the project-internal management workspace only. It does not include the global project list, project creation template flow, or landing pages.

The primary workflow is graph analysis and reasoning. The current relation graph and event graph already support draggable nodes, React Flow canvas rendering, basic node and edge selection, connection creation, node position persistence, edge style controls, time filtering for the relation graph, and detail panels. The upgrade should turn those graph pages into a more complete, orderly, and comfortable analysis workbench rather than adding isolated buttons.

Current build and test status before this design:

- `npm run build` passes.
- `npm run test` passes with 8 test files and 17 tests.
- The working tree contains unrelated uncommitted implementation and data changes. The implementation plan must preserve those changes.

## Goal

Upgrade the project-internal management workspace around a unified graph research workbench that supports:

- Freeform graph organization.
- Strong filtering and layer control.
- Evidence-chain reasoning from people, entities, events, relations, and causal links.
- Clear detail, style, and note workflows.
- Smooth, predictable, and comfortable operation on desktop and narrow screens.

Success means relation graph and event graph feel like two modes of the same research instrument: users can filter, focus, inspect, connect, style, reason, save analysis notes, and recover context without losing their place.

## Recommended Approach

Build a shared three-pane graph workbench and migrate both graph pages onto it.

Use the current React Flow graph implementation as the base. Do not replace React Flow or introduce a separate whiteboard engine. The existing `GraphCanvas`, `RelationGraphPage`, `EventGraphPage`, `DetailPanel`, `EdgeStyleControls`, Zustand store actions, and node-position persistence provide enough foundation.

The key change is not visual decoration. The key change is workflow structure:

- Left pane owns filtering, layers, and graph mode controls.
- Center pane owns the graph canvas and immediate graph actions.
- Right pane owns inspection, evidence-chain reasoning, style editing, and analysis notes.

This approach gives the most balanced path toward "complete, smooth, orderly, and comfortable" without turning the first implementation into a full rewrite.

## Design Direction

### 1. Three-Pane Research Workbench

The default desktop graph page layout becomes:

- Left: filter and layer panel.
- Center: primary graph canvas.
- Right: inspector and reasoning panel.

The center canvas remains the visual and interaction focus. The side panels should support the graph, not crowd it. On medium widths, panels can become collapsible. On narrow screens, the left and right panels become drawers or bottom-sheet style panels so the graph remains usable.

### 2. Left Panel: Filters and Layers

The left panel includes:

- Text search across names, titles, descriptions, tags, factions, locations, and relation types.
- Node type filters.
- Relation or event-link type filters.
- Tag filters.
- Faction or location filters when the active graph has useful values.
- Time range filter when year data exists.
- Layer toggles for nodes, labels, relation labels, dimmed nonmatches, and saved analysis notes.
- View presets such as all, focused neighborhood, conflicts, alliances, causal chain, and current evidence chain.

The panel shows how many filters are active and provides a clear-all action. Empty filter results must show a useful empty state with a reset action.

### 3. Center Panel: Graph Canvas

The graph canvas supports three working modes:

- Browse mode: click nodes and edges to inspect them.
- Reasoning mode: build an evidence chain from a selected start point through connected nodes and edges.
- Organize mode: arrange, group, connect, and style the graph.

The canvas toolbar includes:

- Add relation or event link.
- Auto layout.
- Fit view.
- Reset filters.
- Toggle selection or organize mode.
- Toggle immersive canvas mode.
- Exit focus.

The canvas should provide stable feedback for:

- Empty graph.
- Empty filtered graph.
- Layout saving.
- Layout save failure.
- Selected object.
- Focused node.
- Active evidence chain.

Auto layout should support clear options:

- Horizontal.
- Vertical.
- Time-oriented when year/order data exists.
- Faction or group-oriented when useful entity metadata exists.

### 4. Right Panel: Inspector and Reasoning

The right panel uses tabs instead of stacked cards:

- Case File: selected node or edge details using the existing detail rendering patterns.
- Evidence Chain: current reasoning path, available upstream/downstream expansions, missing information, and save action.
- Style: selected edge visual controls.
- Notes: saved analysis notes and current note draft.

This replaces the current pattern where detail cards, style controls, and relationship notes stack vertically. Tabs make the panel predictable and reduce scrolling while analyzing a dense graph.

### 5. Immersive Canvas Mode

Users can switch to a canvas-first mode for heavy organization work. In this mode:

- The left panel collapses.
- The right panel collapses or becomes a floating inspector.
- The canvas expands to use the available space.
- A compact floating toolbar keeps core actions available.

This mode preserves the benefit of a whiteboard without making the default workspace feel uncontrolled.

## Core Interactions

### Browse Mode

Browse mode is the default.

- Clicking a node selects it, opens Case File, and highlights immediate relations.
- Clicking an edge selects it and opens Case File or Style depending on the previous panel context.
- Pane click clears transient focus but does not destroy active filters.
- Double-click shortcuts are deferred. The first version uses explicit toolbar and panel actions for focus and reasoning mode to avoid accidental state changes.

### Reasoning Mode

Reasoning mode supports "start here and follow the chain" analysis.

- A selected node or event can become the evidence-chain start.
- Clicking a connected edge or node appends it to the current chain.
- The active chain is highlighted.
- Non-chain graph elements dim but remain visible unless the user chooses "chain only".
- The Evidence Chain tab lists nodes and edges in order.
- Users can remove the last step, clear the chain, or save it as an analysis note.
- Saved chains can be reopened and projected onto the graph.

Reasoning mode should support both graph kinds:

- Relation graph chains use `entityRelations`.
- Event graph chains use `eventLinks`.

### Organize Mode

Organize mode supports graph cleanup and whiteboard operations.

- Dragging nodes saves positions with clear saving status.
- Auto layout updates stored node positions.
- Connecting nodes opens a side composer rather than a small overlay that blocks the canvas.
- The composer asks for type, description, time range where applicable, and edge style.
- Selected edge style changes update immediately.

Box selection and group labels are desirable, but they should be staged after the base workbench is stable unless implementation shows they are cheap with React Flow.

## Information Architecture

The existing project navigation remains:

- Dashboard.
- Entities.
- Events.
- Timeline.
- Relation graph.
- Event graph.
- Library.
- Help.
- Settings.

The graph pages become more capable, but the rest of the workspace still matters:

- Entities and Events remain the full editing surfaces for records.
- Timeline remains the chronological reading surface.
- Library remains the source and note repository.
- The graph workbench becomes the analysis surface where those records are connected, filtered, and reasoned over.

## Component Architecture

### New Components

Create `GraphWorkbench`.

Responsibilities:

- Own the three-pane layout.
- Receive graph kind: `entities` or `events`.
- Compute filter options.
- Own transient workbench state.
- Render toolbar, filter panel, canvas, inspector panel, and connection composer.
- Coordinate selection, focus, reasoning chain, and layout status.

Create `GraphFilterPanel`.

Responsibilities:

- Render search, filter groups, layer toggles, and view presets.
- Show active filter count.
- Provide clear-all action.
- Be reusable for relation and event graphs.

Create `GraphToolbar`.

Responsibilities:

- Render graph-page actions in a consistent order.
- Keep text concise and use lucide icons for recognizable actions.
- Expose mode switching, add connection, auto layout, fit view, immersive mode, reset filters, and exit focus.

Create `GraphInspectorPanel`.

Responsibilities:

- Render right-side tabs.
- Host details, evidence chain, style controls, and notes.
- Keep one primary task visible at a time.

Create `GraphEvidencePanel`.

Responsibilities:

- Display the active chain.
- Let users append, remove, clear, and save the chain.
- List possible next connected nodes or edges.
- Reopen saved notes into the active graph view.

Create `GraphConnectionComposer`.

Responsibilities:

- Replace duplicated relation/link composer markup.
- Support entity relation and event link drafts.
- Include type, source, target, description, optional time range, and style.
- Validate source and target are present and not equal.

### Modified Components

Modify `GraphCanvas`.

Responsibilities added:

- Accept filtered graph input or filtering metadata.
- Accept active chain and focus state.
- Render dimmed, highlighted, selected, and empty states.
- Report drag-save status.
- Support immersive-mode friendly toolbar placement.
- Keep compact mode for dashboard previews.

Modify `DetailPanel`.

Direction:

- Keep its existing record rendering logic.
- Allow use inside a tab panel without the large "case file" card chrome when needed.

Modify `RelationGraphPage` and `EventGraphPage`.

Direction:

- Replace page-specific duplicated workbench layout with `GraphWorkbench`.
- Keep graph-kind-specific data adapters and store actions.

Modify `EdgeStyleControls`.

Direction:

- Keep current controls.
- Ensure it is usable inside the right panel and connection composer.

## State and Data Model

### Transient Workbench State

Keep these as component state or small local reducers:

- Current work mode: browse, reasoning, organize.
- Selected object.
- Focus node id.
- Active filters.
- Current year or time range.
- Active right-panel tab.
- Immersive mode.
- Connection composer state.
- Active evidence-chain draft.
- Layout saving status.

These should not be persisted because they represent a working session, not durable project data.

### Persistent Project Data

Keep existing persistent structures:

- `entityNodePositions`.
- `eventNodePositions`.
- `entityRelations`.
- `eventLinks`.
- `EdgeVisualStyle`.

Add `analysisNotes` to `FushengProject`.

```ts
export type AnalysisNote = {
  id: string
  title: string
  graphMode: 'entities' | 'events'
  startId?: string
  targetId?: string
  nodeIds: string[]
  edgeIds: string[]
  summary: string
  createdAt: string
  updatedAt: string
}
```

Add store actions:

- `addAnalysisNote(projectId, draft)`.
- `updateAnalysisNote(projectId, noteId, draft)`.
- `deleteAnalysisNote(projectId, noteId)`.

Update normalization so old projects receive `analysisNotes: []`.

## UX Details

### Visual Hierarchy

The interface should remain work-focused and archive-themed. It should not become a marketing layout or decorative dashboard.

Use the existing palette and typography, but reduce nested card stacking in the graph pages. Cards should frame repeated items, tabs, drawers, and individual controls. Page sections should not become cards inside cards.

### Feedback

Required feedback states:

- Backend connected, checking, and local mode remain visible in the project header.
- Layout saving, saved, and failed states are visible inside graph pages.
- Filter active count and clear action are visible.
- Empty graph and empty filtered graph states are distinct.
- Reasoning chain state is visible on the canvas and in the Evidence Chain tab.

### Accessibility and Interaction Comfort

- Buttons must have accessible labels.
- Icon-only actions need titles or accessible labels.
- Keyboard focus states should remain visible.
- Critical destructive actions still require confirmation.
- Text must not overflow controls on narrow screens.
- Side panels should be scrollable independently from the canvas.

## Scope Boundaries

Included:

- Relation graph and event graph unified workbench.
- Shared filter panel.
- Shared inspector panel.
- Evidence-chain draft and saved analysis notes.
- Improved connection composer.
- Layout save status.
- Immersive canvas mode.
- Empty states and filter reset paths.
- Store normalization for `analysisNotes`.
- Tests for new store behavior and key UI interactions.

Excluded from this upgrade:

- Global project list changes.
- Project creation and template selection changes.
- Full multilingual support.
- Replacing React Flow.
- AI-generated summaries.
- Backend-specific search indexing.
- Collaborative multi-user editing.
- Exporting graph images or PDF reports.
- Full undo/redo history.

## Implementation Phasing

### Phase 1: Foundation

- Add `AnalysisNote` data type and normalization.
- Add store actions and tests.
- Extract graph data adapters for entity and event graph.
- Add filter state utilities and tests.

### Phase 2: Workbench Shell

- Create `GraphWorkbench`, `GraphToolbar`, `GraphFilterPanel`, and `GraphInspectorPanel`.
- Move relation graph onto the shared shell first.
- Validate relation graph feature parity.

### Phase 3: Event Graph Migration

- Move event graph onto the shared shell.
- Share connection composer behavior.
- Validate event graph feature parity.

### Phase 4: Reasoning and Notes

- Add active evidence-chain interactions.
- Add saved analysis notes.
- Render saved notes in the Notes tab.
- Defer graph overlays for saved notes until after the base notes workflow is stable.

### Phase 5: Polish and Responsive Behavior

- Add immersive canvas mode.
- Add narrow-screen drawers or panel toggles.
- Tighten empty states, saving feedback, and visual consistency.

## Risks and Mitigations

### Risk: Shared abstraction becomes too generic

Mitigation:
Build `GraphWorkbench` around only two graph kinds that exist today: entities and events. Use explicit graph adapters instead of a broad graph framework.

### Risk: Side panels reduce canvas usability

Mitigation:
Keep panels collapsible and add immersive mode. On narrow screens, move panels into drawers.

### Risk: Reasoning chains add data complexity

Mitigation:
Persist only saved `analysisNotes`. Keep active chains transient. Store node and edge ids instead of duplicating full records.

### Risk: Migration breaks old projects

Mitigation:
Normalize missing `analysisNotes` to an empty array in shared project normalization and server schema.

### Risk: Duplicate relation and event behavior diverges again

Mitigation:
Move composer, filters, inspector, and toolbar into shared components. Keep only graph-kind adapters separate.

## Validation

Automated validation:

```bash
npm run test
npm run build
```

Recommended focused tests:

- Old projects normalize to include `analysisNotes: []`.
- Analysis notes can be added, updated, and deleted.
- Relation graph filters hide nonmatching relations and nodes.
- Event graph filters hide nonmatching links and events.
- Evidence chain save creates a note with graph mode, node ids, edge ids, summary, and timestamps.
- Empty graph and empty filtered graph states render different messages.

Manual validation:

- Open a project relation graph and confirm the three-pane workbench renders.
- Filter by relation type and clear filters.
- Focus a node and exit focus.
- Drag a node and confirm layout save feedback appears.
- Create a relation through the composer.
- Style a selected relation in the Style tab.
- Build and save an evidence chain.
- Reopen the saved note and confirm the chain highlights on the graph.
- Repeat the same core flow on the event graph.
- Test immersive canvas mode.
- Test a narrow viewport and confirm panels do not crush the canvas.

## Implementation Defaults

- Ship box selection and group labels later unless React Flow makes them cheap during implementation without destabilizing the base workbench.
- Ship saved notes in the Notes tab first.
- Do not add double-click shortcuts in the first version. Use explicit toolbar actions for focus and reasoning mode.
