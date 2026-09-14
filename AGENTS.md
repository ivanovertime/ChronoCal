# AGENTS.md - Developer & Agent Guide for ChronoCal

ChronoCal is a privacy-first Google Calendar Workspace Add-on built with Google Apps Script (V8 runtime). It tracks real time spent on calendar events directly inside the Google Calendar web side panel without external servers, third-party databases, or browser-side timer loops.

---

## 1. Quick Command Reference

All commands must be executed within `/home/ivan/Source/ChronoCal`:

- **Run Automated Tests**: `npm test` (Runs pure offline unit tests using `node --test`)
- **Check Syntax & Manifests**: `npm run lint` (Validates V8 JS syntax and JSON files)
- **Check Clasp Status**: `npm run status` (Shows local vs remote tracked files)
- **Push to Google Apps Script**: `npm run push` (Uploads `src/*.gs` and `appsscript.json`)
- **List Deployments**: `npm run deployments` (Shows active deployment IDs and versions)
- **Open Script Editor**: `npm run open` (Opens project in Google Apps Script browser editor)

---

## 2. Architecture & File Layout

```text
.
├── appsscript.json         # Add-on manifest: scopes, triggers, layout, universal actions
├── src/
│   ├── calendar.gs         # Calendar API integration, recurrence parsing, end-time & description patching
│   ├── cards.gs            # CardService UI builders: header, entry sections, fixed footer, settings
│   ├── config.gs           # Configuration constants, storage keys, default settings
│   ├── i18n.gs             # Internationalization (Spanish 'es' & English 'en'), templates, tag variants
│   ├── main.gs             # Event triggers, card actions, lifecycle handlers, navigation responses
│   ├── session.gs          # Session persistence (UserProperties), duration math, cache capping
│   └── sheets.gs           # Google Sheets export engine & summary sheet aggregator
├── tests/                  # Offline unit test suite (runs in Node.js VM with stubs)
│   ├── calendar.test.js    # ID parsing, recurrence candidate tests
│   ├── cards.test.js       # Card builder, entry buttons, label mapping tests
│   ├── handlers.test.js    # Action handler, session switching, settings navigation tests
│   ├── helpers/
│   │   └── load-source.js  # VM loader with stubs for CardService, PropertiesService, Calendar, Sheets
│   ├── i18n.test.js        # Interpolation and fallback tests
│   ├── session.test.js     # Duration math, session transition, capping, migration tests
│   ├── settings.test.js    # Settings normalization, toggle, and validation tests
│   └── sheets.test.js      # Export row generation and summary roll-up tests
├── scripts/
│   └── check-syntax.js     # Syntax and manifest validator
└── docs/                   # Documentation and Product Requirements (PRD)
```

---

## 3. CardService Constraints & Best Practices

When writing or modifying code in `src/*.gs`:

1. **Declarative UI Only**:
   - Google Workspace Add-ons use `CardService`. There is no client-side JavaScript execution or live per-second ticker in the side panel.
   - Durations are calculated dynamically from absolute timestamps (`Date.now() - started_at_ms + elapsed_ms`) whenever the user opens, refreshes, or interacts with a card.
2. **Button Limits**:
   - A `CardService.ButtonSet` inside a card section supports a maximum of **3 buttons**. Exceeding 3 causes layout errors in Google Workspace.
   - Current button distribution:
     - `RUNNING`: Pause (`onPauseTracking`), Stop (`onStopTracking`).
     - `PAUSED`: Resume (`onResumeTracking`), Stop (`onStopTracking`), Discard (`onDiscardSession`).
     - `STOPPED`: Save (`onSaveSession`), Export (`onExportSessionToSheets` if enabled), Discard (`onDiscardSession`).
     - `NONE`: Start (`onStartTracking`).
3. **CardService Icons**:
   - `CardService.Icon` does NOT have a `PAUSE` enum value. Use `CardService.Icon.CLOCK` or `VIDEO_PLAY`.
4. **Single Active Session Rule**:
   - Only ONE session may run at a time. Starting or resuming a session automatically pauses any other running session to prevent accidental runaway timers.
5. **Fixed Footer**:
   - Uses `CardService.newFixedFooter()`.
   - In `RUNNING` state: Primary is Break (`onPauseAll`), Secondary is Finish (`onFinishWork`).
   - In `PAUSED` state: Primary is Resume All (`onResumeAll`), Secondary is Finish (`onFinishWork`).
   - In `STOPPED` state: Primary is Export to Sheets (`onExportToSheets`).

---

## 4. Testing Rules

- **Zero External Dependencies in Tests**: All unit tests must run offline without requiring network calls or Google authentication.
- **Before Committing or Pushing**:
  ```bash
  npm test && npm run lint
  ```
- **Adding Test Coverage**: If you add a new action handler or helper, add corresponding tests in `tests/` asserting both state changes and `CardService` response structures.

---

## 5. Deployment & Google Calendar Verification

1. Ensure clasp is authenticated (`test -f ~/.clasprc.json`).
2. Push local code:
   ```bash
   npm run push
   ```
3. To test in Google Calendar:
   - Open [Google Calendar](https://calendar.google.com/) on desktop.
   - Click the **Gear icon (⚙)** -> **Settings** -> **Add-ons**.
   - Check **Enable developer add-ons execution**.
   - The head deployment (`@HEAD`) from `.clasp.json` will automatically show in the right-side companion bar.
   - Click the ChronoCal icon to open the side panel.
   - Select any event in Calendar to view contextual tracking options.
