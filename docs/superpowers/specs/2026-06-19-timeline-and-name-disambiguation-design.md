# Timeline And Name Disambiguation Design

## Problem

The project already uses stable ids for entities and events, so duplicate names and duplicate time labels are valid data. The weak point is presentation: lists, timelines, checkboxes, and quick-link selectors often show only the name or title, which makes it hard to distinguish duplicate people or same-time events.

## Design

Keep the storage schema unchanged. Add display helpers that derive labels from existing fields:

- People keep `id` as identity. When a name is duplicated, labels include concise context from identity, faction, dynasty, type, or a short id suffix.
- Events keep `id` as identity. Labels include time label, order, title, location, chapter, or type where relevant.
- Timeline rendering groups events by normalized `timeLabel`; events with the same time label render under one time node and remain individually selectable.

## Behavior

- Duplicate person names are allowed.
- Same-time events are allowed.
- Selectors and related-person lists show enough context to distinguish records.
- Timeline groups do not merge records; each event card still uses its event id for selection.
- Event ordering remains deterministic: by numeric `order`, then title, then id.

## Testing

Add focused tests for display helpers and timeline grouping:

- duplicate entity labels include distinguishing metadata.
- unique entity labels remain concise.
- event labels combine time/order/title context for selectors.
- timeline grouping keeps same-time events separate while showing one grouped time heading.

