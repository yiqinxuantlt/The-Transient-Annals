# Windows Desktop Installer Design

## Goal

Package Fushenglu as a Windows desktop application that can be shared with other people as an installer `.exe`. A recipient should be able to install the app, launch it from the Start Menu or desktop shortcut, and use it without installing Node.js, running terminal commands, or cloning the repository.

## Context

The current application is a Vite React frontend with an Express local API. The frontend currently defaults to `http://127.0.0.1:4177/api`, and the backend already supports configurable data paths through `FUSHENGLU_DB_PATH`, `FUSHENGLU_SQLITE_PATH`, and `FUSHENGLU_STORAGE`.

The desktop package should reuse the existing React UI and Express API rather than rewriting storage or duplicating application behavior.

## Recommended Approach

Use Electron for the desktop shell and `electron-builder` to create a Windows NSIS installer `.exe`.

Electron is the best fit for this codebase because it can run the existing web UI and Node-based API in one packaged application. It adds more runtime size than Tauri, but avoids a Rust rewrite and keeps the first desktop release focused.

## User Experience

- The built artifact is a Windows installer `.exe`.
- The installer creates a normal installed application named `Fushenglu`.
- The installed app launches a desktop window that loads the packaged React app.
- The user does not see or manage a terminal window.
- The app starts its local API internally before the UI tries to use it.
- App data is stored per Windows user, not in the installation directory.

## Distribution Notes

The installer can be sent to other people directly after it is built. Because the first version will not include code signing, Windows SmartScreen may warn that the publisher is unknown. Recipients can still install it. If the app is distributed broadly, code signing should be handled as a separate follow-up project.

The first desktop release will not include auto-update. New versions will be distributed by sending a newer installer.

## Architecture

Add an Electron layer without changing the app's primary React routes or screens.

- `server/src/index.ts` should stop doing all startup work as a module side effect.
- A reusable server module should expose a function that creates or starts the Express API.
- The existing CLI/API script should continue to support `npm run api`.
- Electron's main process should start the API on `127.0.0.1` and then create the browser window.
- The renderer should load `dist/index.html` in production and the Vite URL in desktop development.
- Electron should set `FUSHENGLU_DB_PATH` to a file under Electron's `app.getPath('userData')`.

## Data Storage

For installed desktop users, the JSON database should live in the Electron user data directory, for example:

`%APPDATA%\Fushenglu\fushenglu-db.json`

This prevents write failures under `Program Files` and keeps each Windows user account isolated. The repository's `server/data/fushenglu-db.json` remains useful for development and seed data, but it should not be the installed app's runtime database.

## Security

Electron should use a conservative window configuration:

- `nodeIntegration: false`
- `contextIsolation: true`
- no remote module
- no arbitrary external navigation inside the app window

The app does not need a preload API for the first release because the renderer can continue using the local HTTP API.

## Build Scripts

Add scripts for:

- building the web app and server TypeScript
- building the Electron main process
- creating the Windows installer with `electron-builder`

The main distribution command should produce an installer `.exe` in a release output directory.

## Validation

Before considering the work complete:

- `npm test` must pass.
- `npm run build` must pass.
- the Electron development launch command must open the app window.
- the Windows installer command must produce a `.exe` installer.
- after installing or unpacking locally, the app must start, show the React UI, and read/write data through the embedded API.

## Out of Scope

- macOS and Linux packages
- automatic updates
- code signing certificate setup
- cloud sync or multi-user shared storage
- replacing the Express API with a native desktop storage layer
