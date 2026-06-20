# Desktop Reliability And Data Safety Design

## Goal

Make Fushenglu safer to distribute and safer to use as a long-running local desktop app. A Windows user should be able to install a new build, launch it reliably, keep working across relaunches, and recover from common data or packaging mistakes without knowing how the project is built.

## Context

The app now has a working Electron Windows installer, an embedded Express API, Vite renderer assets, JSON file storage, optional SQLite storage, and a local `release/` output. A recent desktop blank-window issue came from web-style absolute asset paths being loaded through Electron's `file://` runtime. That class of failure should be caught automatically before another installer is shared.

The current desktop build also uses hash routing, but some client logic still reads `window.location.pathname`. In a hash-routed desktop window, that can point at the local `index.html` path instead of the active project route. Any feature that infers the current project from the URL should use a router-aware helper instead.

## Recommended Approach

Ship a focused reliability pass before adding new product features. This pass should keep the existing architecture: React renderer, Electron shell, Express local API, and current storage interfaces. It should add verification and recovery around that architecture rather than rewriting it.

The first reliability release should include five changes:

- Commit and preserve the relative desktop asset-path fix.
- Add a route helper that resolves the active project ID correctly in browser and desktop hash-router modes.
- Add a desktop smoke test script that builds or uses unpacked desktop output, launches the app, confirms the window is not blank, and writes a screenshot outside the repository.
- Add release metadata: app version, description, author, app icon, and clearer installer naming.
- Add automatic local backups for user data before destructive or high-risk writes.

## User Experience

The installed app should open to a rendered Fushenglu screen, not a blank window. If the renderer or API fails during startup, the user should see a useful in-app failure state instead of silent emptiness where practical.

The user should not have to manage build folders, logs, or generated installer files. Release files remain generated artifacts and should stay ignored by Git.

When data is changed in normal use, it should continue to save automatically. Before operations that can replace or erase a large amount of data, such as import, restore sample data, or clear project data, the app should leave a recoverable backup in the user's data directory.

## Architecture

### Desktop Asset Loading

The renderer should continue using `import.meta.env.BASE_URL` for public assets and `base: './'` for desktop builds. Browser builds keep normal root-relative paths.

### Route Awareness

Create a small route helper that reads the current route from `window.location.hash` when desktop hash routing is active, and from `window.location.pathname` otherwise. Store code should use this helper instead of manually parsing `window.location.pathname`.

This keeps the Zustand store independent from React Router internals while removing the desktop-specific bug.

### Desktop Smoke Validation

Add a Node or PowerShell-backed script that:

- launches `release/win-unpacked/Fushenglu.exe`;
- waits for a visible window titled `浮生录`;
- captures a screenshot to the OS temp directory;
- verifies the screenshot is not visually blank by sampling pixels or by checking the window region has meaningful color variance;
- stops the launched process.

The script should be runnable through `npm run desktop:smoke`. A later release command can chain `test`, `desktop:dist`, and `desktop:smoke`.

### Release Metadata

`package.json` should include a real app version, description, and author. Electron Builder should use the existing logo asset or a derived `.ico` file as the Windows icon. Installer output should remain under `release/`.

### Data Backups

The storage layer should create timestamped backups in a `backups/` directory next to the active data file. Backups should be created before writes that can overwrite broad project state. To keep disk usage bounded, keep the most recent 20 backups and delete older ones best-effort.

Backups should not block normal saving if cleanup fails. Backup creation should fail closed only when the active data file cannot be read during a high-risk operation.

## Data Flow

Normal project edits continue flowing through Zustand commands, then through the local API, then to active storage.

High-risk operations should pass a reason to the backend or call a dedicated backup endpoint before saving. The storage layer should be responsible for the actual backup copy so browser mode and desktop mode do not duplicate file-path logic.

The restore path should remain manual for the first pass: backups are files the user or developer can recover from. A built-in backup browser can be a later product feature.

## Error Handling

Desktop startup should log main-process failures and renderer load failures. Startup failures should not be swallowed behind a hidden `ready-to-show` window. If the renderer fails to load, the window should still appear with enough information to diagnose the issue.

Backup creation should distinguish between:

- no existing database yet, where no backup is needed;
- active database read failure before a high-risk write, where the write should stop;
- backup cleanup failure, where the write can continue and the cleanup warning can be logged.

## Testing

Validation should include:

- unit tests for the route helper in browser-path and hash-route cases;
- unit tests for backup path creation, backup retention, and no-file-first-run behavior;
- existing store tests for project mutations;
- `npm test`;
- `npm run desktop:dist`;
- `npm run desktop:smoke` against `release/win-unpacked/Fushenglu.exe`.

The smoke test should not depend on a user's installed copy. It should test the unpacked release output generated by Electron Builder.

## Out Of Scope

- Cloud sync.
- Auto-update.
- Signed installer certificates.
- A full in-app backup restore browser.
- Major store refactoring.
- Search, undo/redo, or new graph editing features.

## Success Criteria

- The current relative asset fix is committed.
- Desktop and browser route parsing both resolve the current project consistently.
- A blank-window class packaging failure is caught by an automated smoke command.
- Electron Builder no longer reports missing app description or author.
- A new installer has app identity metadata and an icon.
- High-risk data replacement operations leave recoverable backups in the active data directory.
- All generated build and smoke artifacts remain outside Git.
