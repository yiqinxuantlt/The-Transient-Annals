# Development Logging and Bug Detection System Design

## Context

Fushenglu is a Vite, React, TypeScript, Zustand, React Router, and Express prototype. It runs as a local authoring workspace with a browser frontend, a local API, and a localStorage fallback. Early development needs fast visibility into runtime failures, API sync issues, and state mutations without adding hosted observability services or changing the production user experience.

## Goal

Add a detailed development-only logging and bug detection system with two parts:

- A structured logging core that captures runtime, API, console, and key state events.
- A browser debug panel that lets developers inspect, filter, copy, export, and clear those logs while using the page.

The system must help debug early development issues locally, avoid external network dependencies, and stay disabled in production builds by default.

## Recommended Approach

Build a lightweight in-repo diagnostics system. Do not add external monitoring services. Keep logs in a bounded in-memory buffer and expose them through a development-only panel. Leave room for a future optional backend transport, but do not implement server-side log persistence in the first version.

This approach gives immediate debugging value while keeping the app simple and privacy-preserving.

## Architecture

### Logging Core

Create `src/lib/devLogger.ts` as the single logging entry point.

Responsibilities:

- Define structured log types and levels.
- Store logs in an in-memory ring buffer with a default maximum of 500 entries.
- Notify subscribers when logs change so UI can update without polling.
- Provide methods such as `debug`, `info`, `warn`, `error`, `api`, `state`, and `event`.
- Provide initialization helpers for global runtime capture.
- Only activate automatically when `import.meta.env.DEV` is true.

Each log entry includes:

- `id`
- `timestamp`
- `level`
- `category`
- `source`
- `message`
- `details`
- `stack`
- `url`
- `route`

The logger should serialize defensive copies of details where possible, and fall back to readable summaries if a value cannot be serialized.

### Runtime Capture

Initialize development diagnostics from `src/main.tsx`.

Capture:

- `window.error`
- `window.unhandledrejection`
- `console.warn`
- `console.error`

Console interception must still call the original console methods so normal browser developer tools keep working.

### API Capture

Instrument `src/lib/fushengluApi.ts` inside the existing `requestJson` wrapper.

Capture:

- Request start with method, path, and timeout.
- Request success with status and duration.
- Request failure with status, duration, abort information, and error message.

Do not log full project payloads by default because imports and saves can be large. Log payload summaries such as project id, method, path, and body size when useful.

### State and App Events

Add logging around important Zustand store actions in `src/store/useFushengluStore.ts`.

Capture:

- Backend status changes: `checking`, `online`, `offline`.
- Hydration start, success, and failure.
- Project creation, metadata update, deletion, import replacement, sample restore, and clear.
- Entity, event, relation, event link, library item creation and deletion.
- Node position updates should be throttled or skipped by default because graph dragging can generate many changes.

State logs should include ids and counts, not full entities or full projects.

## Debug Panel UI

Create `src/components/DevLogPanel.tsx`.

Render it from `src/App.tsx` only in development mode.

Behavior:

- Fixed position in the bottom-right corner.
- Default collapsed state with a compact button.
- Button displays current warning and error counts.
- Expanded panel shows recent logs sorted newest first.
- Provide filters for all, error, warning, API, state, and event logs.
- Provide search over message, source, category, path, and route.
- Provide actions to clear logs, copy JSON, and download JSON.
- Let each log row expand to show details, stack, URL, and route.
- Show a truncation indicator when older logs have been dropped from the buffer.

Visual constraints:

- Keep it compact and utilitarian.
- Do not alter the existing app layout.
- Use existing Tailwind patterns and lucide-react icons.
- Ensure panel text remains readable in light and dark themes.

## Error Handling

The diagnostics system must never break the app. Logger failures should be swallowed after falling back to the original console method. If clipboard or download actions fail, the panel should show a local warning log and keep the UI usable.

Global handlers must not prevent existing browser behavior unless explicitly necessary. Promise rejection logging must handle non-`Error` rejection values.

## Production Behavior

Production builds should not show the debug panel and should not install global console or window handlers by default.

The code may remain in the bundle if Vite does not tree-shake every branch, but runtime work should be guarded by `import.meta.env.DEV`.

## Future Extension

The first version should expose a small transport interface inside `devLogger.ts` so a future version can POST logs to the local Express server and write JSONL files under `server/data/dev-logs`. This extension should not affect current callers.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual checks during `npm run dev`:

- Trigger an API failure by running the frontend without the API or interrupting the API.
- Confirm failed requests appear in the panel with path, duration, and error.
- Create and edit project data and confirm state or event logs appear.
- Trigger `console.error(new Error('test'))` and confirm the panel records it while the browser console still shows it.
- Confirm the panel is not rendered in a production preview build.

## Scope Boundaries

Included:

- Frontend structured logging core.
- Global runtime capture.
- API request diagnostics.
- Selected Zustand action diagnostics.
- Development-only browser panel.
- JSON copy and download.

Excluded from the first version:

- External hosted observability services.
- Backend log persistence.
- Session replay.
- User analytics.
- Full payload capture for large project objects.
- Automated issue creation.
