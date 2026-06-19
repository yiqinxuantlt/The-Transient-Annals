# Timeline And Name Disambiguation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make same-time events and duplicate person names understandable without changing stored data ids or schema.

**Architecture:** Add a small presentation helper module for entity/event labels and timeline grouping. Update event timeline, entity/event pages, and detail panel to use those helpers. Keep behavior id-based and add tests around the helper and rendered grouped timeline.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, Zustand.

---

## File Structure

- Create `src/lib/recordDisplay.ts`: pure helpers for entity labels, event labels, duplicate-name detection, and timeline grouping.
- Create `src/lib/recordDisplay.test.ts`: helper tests for duplicate names and event label behavior.
- Create `src/components/EventTimeline.test.tsx`: rendering tests for same-time timeline groups.
- Modify `src/components/EventTimeline.tsx`: render grouped time nodes.
- Modify `src/pages/EntitiesPage.tsx`: use disambiguated entity option labels.
- Modify `src/pages/EventsPage.tsx`: use disambiguated entity/event option labels.
- Modify `src/components/DetailPanel.tsx`: show disambiguated related names and relation endpoints.
- Modify `src/components/EntityCard.tsx`: surface duplicate-name context.
- Modify `src/components/EventCard.tsx`: accept richer related entity labels.

## Tasks

### Task 1: Add Display Helpers And Tests

**Files:**
- Create: `src/lib/recordDisplay.ts`
- Create: `src/lib/recordDisplay.test.ts`

- [ ] Add helper tests for duplicate entity names, unique entity names, event selector labels, and same-time event grouping.
- [ ] Implement `hasDuplicateEntityName`, `formatEntityLabel`, `formatEntityOptionLabel`, `formatEventOptionLabel`, and `groupEventsForTimeline`.
- [ ] Run `npm test -- --run src/lib/recordDisplay.test.ts`.

### Task 2: Update Timeline Rendering

**Files:**
- Modify: `src/components/EventTimeline.tsx`
- Create: `src/components/EventTimeline.test.tsx`

- [ ] Add a render test where two events share `timeLabel` and both remain selectable.
- [ ] Replace flat timeline sorting with `groupEventsForTimeline`.
- [ ] Render one grouped time heading for same-time events and a count badge when a group has multiple events.
- [ ] Keep each event card keyed and selected by `event.id`.
- [ ] Run `npm test -- --run src/components/EventTimeline.test.tsx src/lib/recordDisplay.test.ts`.

### Task 3: Update Selectors And Detail Labels

**Files:**
- Modify: `src/pages/EntitiesPage.tsx`
- Modify: `src/pages/EventsPage.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/components/EntityCard.tsx`
- Modify: `src/components/EventCard.tsx`

- [ ] Use entity option labels in relation selectors and related-person checkboxes.
- [ ] Use event option labels in event-link selectors.
- [ ] Show duplicate-name context on entity cards and details.
- [ ] Use disambiguated related entity labels in event cards and details.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.

## Self-Review

- Spec coverage: all approved behaviors map to tasks.
- Placeholder scan: no deferred implementation markers.
- Type consistency: all helpers operate on existing `Entity` and `StoryEvent` types; no schema change is required.

