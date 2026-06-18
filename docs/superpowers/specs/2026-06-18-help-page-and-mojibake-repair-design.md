# Help Page and Mojibake Repair Design

## Context

Fushenglu is a local-first React, TypeScript, Vite, Zustand, React Router, and Express application used to organize people, events, graphs, and supporting notes for history and fiction projects. The current repository contains widespread mojibake in user-facing Chinese text. The issue is not limited to one page. It appears in page components, template metadata, sample data, shared layout labels, and the checked-in local data file used by the local API.

The user wants two outcomes in one pass:

- Fully repair the garbled Chinese text across the repository.
- Add a complete in-product help experience as a standalone help page, not a transient modal.

The help content should serve both end users and maintainers. It should explain product usage, project structure, data persistence, and development workflows.

## Goal

Deliver a full-text repair and documentation pass that:

- Restores normal Chinese in all user-visible UI text and sample data shipped in the repository.
- Adds a standalone help page that can be opened from the projects list and from inside an active project workspace.
- Covers product overview, workflow guidance, page explanations, data behavior, development commands, and common troubleshooting.
- Preserves the current visual language rather than introducing a new design system.

## Recommended Approach

Use explicit source correction plus a reusable help page component.

Do not add a generic encoding repair utility. The current mojibake is already committed into a finite set of source files and one checked-in local data file. The safer approach is to replace the affected literals with correct Chinese text at the source and make the help page a first-class route.

Use one shared help page component with two routes:

- A global route for use from the marketing and projects shell.
- A project-scoped route for use from the workspace sidebar while keeping the current project layout visible.

This keeps the content single-sourced while matching how users enter the page in different contexts.

## Architecture

### 1. Help Page Routing

Add one reusable page component, tentatively `src/pages/HelpPage.tsx`.

Expose it through two routes:

- `/help`
- `/projects/:projectId/help`

The global route should render under `RootLayout`.
The project-scoped route should render under `ProjectLayout`.

The page content is shared. The component may optionally detect whether it is rendered inside a project route, but it should not depend on project data to render correctly.

### 2. Help Page Entry Points

Add a visible help entry to the projects list page. This should sit near the primary actions on `ProjectsPage`, so a user browsing projects can open the manual without entering a project first.

Add a help entry to the workspace sidebar. This should behave like the other project navigation items and remain available while the user is editing a project.

The top-level public header may also gain a help entry if it improves discoverability, but this is secondary to the two confirmed entry points above.

### 3. Help Page Information Structure

The help page should be organized into clear sections rather than a single long prose block.

Required sections:

- Product overview
  - What Fushenglu is for.
  - Differences between the history and fiction templates.
- Quick start
  - Create a project.
  - Choose a template.
  - Enter the workspace.
- Workspace page guide
  - Dashboard.
  - Entities or characters.
  - Events.
  - Timeline.
  - Relation graph.
  - Event graph.
  - Library.
  - Settings.
- Common actions
  - Add or edit entities and events.
  - Create relations and event links.
  - Drag nodes and save layouts.
  - Import, export, clear local data, restore samples.
- Data and persistence
  - Local API behavior.
  - `server/data/fushenglu-db.json`.
  - Browser `localStorage` fallback when the API is unavailable.
- Development and troubleshooting
  - `npm install`, `npm run dev`, `npm run build`, `npm run lint`.
  - Common failure modes such as the API not running or stale local data.

The page should read like product documentation, not like developer notes pasted into the UI.

### 4. Text Source Repair

Repair the garbled text in the actual source files that define the product copy.

Primary files expected to be corrected:

- `src/pages/ProjectsPage.tsx`
- `src/components/AppHeader.tsx`
- `src/components/ProjectSidebar.tsx`
- `src/layouts/ProjectLayout.tsx`
- `src/routes/router.tsx` fallback copy if needed
- `src/templates/projectTemplates.ts`
- `src/data/sampleData.ts`
- `README.md`

The repair should cover:

- Headings, button labels, descriptions, status text, placeholders, and navigation labels.
- Template names, summaries, field labels, relation labels, and event link labels.
- Sample project titles, subtitles, sample entities, events, relations, and library notes.
- README sections, command descriptions, route descriptions, and project structure notes.

### 5. Checked-in Local Data Repair

The repository currently includes a checked-in `server/data/fushenglu-db.json` with garbled project data. Because this file is part of the local development path and affects what the user sees immediately when the API is running, it should be treated as in scope for this repair.

This file should be normalized so that:

- Existing checked-in demo projects display correct Chinese.
- The file remains valid JSON matching the current schema.
- Repair is limited to the checked-in repository copy. No generic runtime migration tool is required.

If implementation reveals that regenerating the file from corrected sample data is safer than hand-editing each string, that is acceptable, as long as the resulting checked-in file is stable and readable.

### 6. Shared Copy Discipline

Where the same wording appears in multiple places, prefer existing shared sources over repeating page-local literals.

In practice this means:

- Template-specific labels remain owned by `src/templates/projectTemplates.ts`.
- Sample content remains owned by `src/data/sampleData.ts`.
- The new help page owns only documentation-oriented copy.

This boundary reduces the chance of future copy drift.

## UX and Visual Direction

The help page should fit the existing archive-style interface:

- Reuse current paper, ink, goldline, jade, and cinnabar styling conventions.
- Use section cards or panels to break up content.
- Keep the layout readable on both desktop and mobile.
- Use typographic hierarchy strong enough for long-form reading.

The page should not feel like a bolted-on developer document. It should look like part of the product.

## Scope Boundaries

Included:

- Full repair of repository-shipped user-facing mojibake.
- New standalone help page component.
- Global and project-scoped help routes.
- Projects page and project sidebar help entry points.
- README repair to match the corrected product terminology.
- Checked-in `server/data/fushenglu-db.json` repair.

Excluded:

- Automated encoding detection or bulk recoding tools.
- Multi-language support.
- Search inside the help page.
- Contextual per-field tooltips across the app.
- Arbitrary migration of every user-created external JSON file.

## Risks and Mitigations

### Risk: Fixing only visible pages leaves deeper sample and template text broken

Mitigation:
Repair the template and sample data source files, not just the page components that currently render them.

### Risk: Runtime data file still shows mojibake even after source repair

Mitigation:
Treat `server/data/fushenglu-db.json` as an explicit repository artifact to repair in the same change.

### Risk: Help content becomes stale because it duplicates product labels

Mitigation:
Keep product labels sourced from existing template and navigation files. Write the help page around stable concepts and workflows instead of restating every tiny label variation.

### Risk: Project-scoped help route accidentally depends on project lookup and fails outside an active project

Mitigation:
Keep the help page itself independent from project data. Let routing control the shell only.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual validation:

- Open `/projects` and confirm all list-page Chinese renders correctly.
- Open a history project and a fiction project and confirm template navigation and page labels render correctly.
- Open `/help` and `/projects/:projectId/help` and confirm both render the same help content in the appropriate shell.
- Verify sample project titles, subtitles, cards, and graph or timeline content no longer contain mojibake.
- Run with the local API enabled and confirm projects loaded from `server/data/fushenglu-db.json` also show corrected text.
- Check the README in the repository and confirm the repaired copy matches the application terminology.

## Parallelization Note

The implementation can later use parallel agents because the work naturally separates into mostly independent domains:

- Help page and routing.
- Shared UI copy repair.
- Sample and checked-in data repair.

That split is suitable for `dispatching-parallel-agents` during execution, but not during the design-document stage.
